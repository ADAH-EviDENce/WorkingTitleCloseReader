package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/julienschmidt/httprouter"
	"github.com/stretchr/testify/assert"
)

func TestAssessments(t *testing.T) {
	es := mockElastic()
	defer es.Close()

	db := newDatabase(t)
	defer db.Close()

	_, err := db.Exec(`INSERT INTO users (username) VALUES ('test')`)
	if err != nil {
		t.Fatalf("SQL: %v", err)
	}

	r := httprouter.New()
	newServer(db, "", es.URL, r)

	req := httptest.NewRequest("GET", "/assess",
		strings.NewReader(`["foo", "bar", "baz"]`))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	resp := w.Result()
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var rel []string
	json.NewDecoder(resp.Body).Decode(&rel)

	assert.Empty(t, rel)

	req = httptest.NewRequest("POST", "/assess",
		strings.NewReader(`[
			{"id": "foo", "relevant": "yes"},
			{"id": "bar", "relevant": "no"},
			{"id": "baz", "relevant": ""}
		]`))
	req.Header.Set("Authorization", "Username test")

	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Result().StatusCode)

	req = httptest.NewRequest("GET", "/assess",
		strings.NewReader(`["foo", "bar", "baz", "quux"]`))

	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	resp = w.Result()
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var assess []assessment
	json.NewDecoder(resp.Body).Decode(&assess)
	assert.Equal(t, []assessment{
		{"foo", "yes"},
		{"bar", "no"},
		{"baz", ""},
		// no value for quux
	}, assess)

	req = httptest.NewRequest("GET", "/export", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, "text/csv", w.HeaderMap.Get("Content-Type"))
	assert.Equal(t, "foo,yes,test\nbar,no,test\nbaz,,test\n", w.Body.String())
}

func TestESProxy(t *testing.T) {
	es := mockElastic()
	defer es.Close()

	r := httprouter.New()
	newServer(nil, "", es.URL, r)

	req := httptest.NewRequest("GET", "/es/snippets/snippet/_mget", nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	// We care about getting through to the proxied server,
	// not about its handling of incorrect requests.
	assert.NotEqual(t, http.StatusNotFound, w.Result().StatusCode)
}

func mockElastic() *httptest.Server {
	r := httprouter.New()
	r.GET("/_mget", mget)
	r.GET("/snippets/snippet/_mget", mget)

	return httptest.NewServer(r)
}

func mget(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	docs := make(map[string]struct{})
	for _, s := range []string{"foo", "bar", "baz", "quux"} {
		docs[s] = struct{}{}
	}

	var m map[string][]struct {
		Id    string `json:"_id"`
		Index string `json:"_index"`
		Type  string `json:"_type"`
	}
	err := json.NewDecoder(r.Body).Decode(&m)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	rdocs, ok := m["docs"]
	if !ok {
		http.Error(w, `no "docs" in body JSON`, http.StatusBadRequest)
		return
	}

	io.WriteString(w, `{"docs": [`)

	for i, doc := range rdocs {
		if i > 0 {
			w.Write([]byte{','})
		}

		_, found := docs[doc.Id]
		fmt.Fprintf(w,
			`{"_index": "snippets", "_type": "snippet", "_id": %q, "found": %t}`,
			doc.Id, found)
	}

	io.WriteString(w, "]}")
}

func TestUI(t *testing.T) {
	tempdir, err := ioutil.TempDir("", "evidence-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tempdir)

	uiDir := filepath.Join(tempdir, "ui")
	err = os.MkdirAll(filepath.Join(uiDir, "static"), 0755)
	if err != nil {
		t.Fatal(err)
	}

	hello := "<html>Hello, world!</html>"
	for _, f := range []struct{ name, content string }{
		{"index.html", hello},
		{"static/empty", ""},
		{"../forbidden", "I should not be seen"},
	} {
		err = ioutil.WriteFile(filepath.Join(uiDir, f.name),
			[]byte(f.content), 0644)
		if err != nil {
			t.Fatal(err)
		}
	}

	r := httprouter.New()
	s := newServer(nil, "", "", r)
	s.uiDir = uiDir

	req := httptest.NewRequest("GET", "/ui/", nil)
	w := httptest.NewRecorder()
	w.Body = new(bytes.Buffer)
	r.ServeHTTP(w, req)
	resp := w.Result()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, hello, w.Body.String())

	req = httptest.NewRequest("GET", "/ui/static/empty", nil)
	w = httptest.NewRecorder()
	w.Body = new(bytes.Buffer)
	r.ServeHTTP(w, req)
	resp = w.Result()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "", w.Body.String())

	req = httptest.NewRequest("GET", "/ui/static/nonexistent", nil)
	w = httptest.NewRecorder()
	w.Body = new(bytes.Buffer)
	r.ServeHTTP(w, req)
	resp = w.Result()

	assert.Equal(t, http.StatusNotFound, resp.StatusCode)

	// A file outside ui/ should not be read, even if it exists.
	// We should get index.html instead.
	req = httptest.NewRequest("GET", "/ui/../forbidden", nil)
	w = httptest.NewRecorder()
	w.Body = new(bytes.Buffer)
	r.ServeHTTP(w, req)
	resp = w.Result()

	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
}

func newDatabase(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatal(err)
	}

	schema, err := ioutil.ReadFile("schema.sql")
	if err == nil {
		_, err = db.Exec(string(schema))
	}
	if err != nil {
		t.Fatalf("SQL: %v", err)
	}

	return db
}
