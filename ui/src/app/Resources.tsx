import * as React from "react";
import elasticsearch from 'elasticsearch';
import config from "../config";

class Resources {

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

    public static getSnippetsFromESUsingRocchio = (
        snippetId: string,
        docId: string,
        from: number,
        size: number
    ) => {
        return fetch(`${config.ES_ROCCHIO_HOST}/${snippetId}?docId=${docId}&from=${from}&size=${size}`);
    };

    public static getMoreLikeThisSnippetsFromDoc2Vec = (
        snippetId: string,
        docId: string,
        from: number,
        size: number
    ) => {
        return fetch(`${config.HOST}/doc2vec/${snippetId}?docId=${docId}&from=${from}&size=${size}`);
    };

    public static getMoreLikeThisSnippetsFromDoc2VecUsingRocchio = (
        snippetId: string,
        docId: string,
        from: number,
        size: number
    ) => {
        return fetch(`${config.HOST}/doc2vec_rocchio/${snippetId}?docId=${docId}&from=${from}&size=${size}`);
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

    public static getUsers() {
        return fetch(config.USERS_HOST);
    }

    public static getExport() {
        return fetch(config.EXPORT_HOST).then(data => data.text());
    }

    public static purgeDatabase(user: string) {
        return fetch(config.PURGE_HOST, {
            headers: {
                "X-User": user
            }
        });
    }
}

export default Resources;
