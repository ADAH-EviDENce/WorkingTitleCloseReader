import * as React from "react";
import Resources from "../Resources";
import Page from "../common/Page";
import ErrorBox from "../common/ErrorBox";
import DocumentSnippetList from "./DocumentSnippetList";

class DocumentPage extends React.Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            loading: true,
            snippets: null
        };
        this.getSnippets(this.props.match.params.did);
    }

    getSnippets = (documentId: string) => {
        Resources.getSnippetsByDocumentId(documentId).then((data) => {
            if (!data.ok) {
                throw Error("Status " + data.status);
            }
            data.json().then((json) => {
                console.log(json);
                this.setState({snippets: json, loading: false});
            });
        }).catch((data) => {
            this.setState({loading: false, error: 'Could not fetch documents with provided query.'});
        });

    };

    private renderDocument() {
        if (!this.state.snippets || this.state.loading) {
            return null;
        }
        return <div className="query-document-list">
            <DocumentSnippetList isOpen={true} snippetIds={this.state.snippets._source.sub.map(
                (s: number) => {
                    return {_id: s}
                }
            )} documentId={this.props.match.params.did}/>
        </div>;
    }

    render() {
        return (
            <Page>
                <div className="offset-2 col-8">
                    <div className="document-page">
                        <h2>{this.props.match.params.did}</h2>
                        <ErrorBox error={this.state.error} onClose={() => this.setState({error: null})}/>
                        {this.renderDocument()}
                    </div>
                </div>
            </Page>
        );
    }
}

export default DocumentPage;