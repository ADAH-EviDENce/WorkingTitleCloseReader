import elasticsearch from 'elasticsearch';
import config from "../config";
import fetchMock from "fetch-mock";

export default class Resources {

    // TODO: remove mocks
    static initialize() {
        fetchMock.post(config.SEED_HOST, 200);
        fetchMock.get(config.SEED_HOST, [
            {_id: "GV_NIOD_Buchenwald_31_clipped_150_paragraph_57-76"},
            {_id: "GV_NIOD_Buchenwald_14_clipped_150_paragraph_57-65"}
        ]);
        fetchMock.delete(config.SEED_HOST + '/GV_NIOD_Buchenwald_31_clipped_150_paragraph_57-76', 200);
        fetchMock.delete(config.SEED_HOST + '/GV_NIOD_Buchenwald_14_clipped_150_paragraph_57-65', 200);
        fetchMock.spy();
    }

    public static getSnippetsByDocumentId = (documentId: string) => {
        return fetch(config.ES_HOST + "/documents/document/" + documentId);
    };

    public static searchSnippets = (
        query: string,
        from: number,
        size: number
    ) => {
        const client = new elasticsearch.Client({
            host: config.ES_HOST + "/snippets",
            log: 'error'
        });
        return client.search({
            body: {
                size: size,
                from: from,
                query: {
                    query_string: {query: query}
                },
                highlight: {
                    fields: {
                        text: {}
                    },
                    number_of_fragments: 1,
                    type: "unified",
                    fragment_size: 2000
                }
            }

        });
    };

    public static getSnippetsByIds = (docs: Array<any>) => {
        const client = new elasticsearch.Client({
            host: config.ES_HOST + "/snippets/snippet",
            log: 'error'
        });
        return client.mget({body: {docs: docs}});
    };

    public static getMoreLikeThisSnippetsFromES = (
        snippetId: string,
        docId: string, // document id of the snippet
        from: number,
        size: number
    ) => {
        const client = new elasticsearch.Client({
            host: config.ES_HOST + "/snippets",
            log: 'error'
        });
        return client.search({
            body: {
                size: size,
                from: from,
                query: {
                    bool: {
                        must: {
                            more_like_this: {
                                fields: ["text", "lemma"],
                                boost_terms: 1,
                                max_query_terms: 150,
                                min_doc_freq: 1,
                                min_term_freq: 1,
                                like: [{
                                    _index: "snippets",
                                    _type: "snippet",
                                    _id: snippetId
                                }]
                            }
                        },
                        // Filter out snippets from the current document.
                        must_not: {
                            term: {document: docId}
                        }
                    }
                }
            }
        });
    };

    public static getSnippetsFromESUsingRocchio(
        snippetId: string,
        docId: string,
        from: number,
        size: number,
        user: string
    ) {
        const url = `${config.ES_ROCCHIO_HOST}/${snippetId}?docId=${docId}&from=${from}&size=${size}`;
        return fetch(url, Resources.withUserHeader(user));
    };

    public static getMoreLikeThisSnippetsFromDoc2Vec = (
        snippetId: string,
        docId: string,
        from: number,
        size: number
    ) => {
        const url = `${config.HOST}/doc2vec/${snippetId}?docId=${docId}&from=${from}&size=${size}`;
        return fetch(url);
    };

    public static getMoreLikeThisSnippetsFromDoc2VecUsingRocchio(
        snippetId: string,
        docId: string,
        from: number,
        size: number,
        user: string
    ) {
        const url = `${config.HOST}/doc2vec_rocchio/${snippetId}?docId=${docId}&from=${from}&size=${size}`;
        return fetch(url, Resources.withUserHeader(user));
    };

    public static commitAnswers = (answers: Array<any>, user: string) => {
        return fetch(config.ASSESS_HOST, {
            method: 'POST',
            headers: {
                "X-User": user,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(answers)
        });
    };

    public static getUsers(signal: AbortSignal) {
        return fetch(config.USERS_HOST, {signal});
    }

    public static getExport() {
        return fetch(config.EXPORT_HOST).then(data => data.text());
    }

    public static purgeDatabase(user: string) {
        return fetch(config.PURGE_HOST, Resources.withUserHeader(user));
    }

    /*
     GET /seed  - lijstje identifiers in JSON
      curl http://localhost:8080/seed
     */
    public static getSeedSet(user: string) {
        return fetch(config.SEED_HOST, Resources.withUserHeader(user));
    }

    /*
     POST /seed  - voeg identifier toe
      curl -XPOST http://localhost:8080/seed -d lijstje identifiers in JSON
     */
    public static postSeedSet(user: string, ids: Array<string>) {
        return fetch(config.SEED_HOST, Resources.withUserHeader(user));
    }

    /*
     DELETE /seed/:id  - verwijder identifier
      curl -XDELETE http://localhost:8080/seed/id_van_fragment_zus_totenmet_zo
     */
    public static removeSeedId(user: string, id: string) {
        return fetch(config.SEED_HOST, Resources.withUserHeader(user));
    }


    private static withUserHeader(user: string) {
        return {
            headers: {
                "X-User": user
            }
        };
    }
}

Resources.initialize();