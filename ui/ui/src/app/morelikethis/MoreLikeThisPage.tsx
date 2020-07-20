import * as React from "react";
import Page from "../common/Page";
import InfoBox from "../common/InfoBox";
import Resources from "../Resources";
import DocumentSnippet from "../document/DocumentSnippet";
import MoreLikeThisSnippetList from "./MoreLikeThisSnippetList";
import './MoreLikeThisPage.css';
import MoreLikeThisCommitModal from "./MoreLikeThisCommitModal";
import ReadableId from "../common/ReadableId";
import {AppContext} from "../AppContext";
import {Link} from "react-router-dom";
import Spinner from "../common/Spinner";
import {fromVal} from "../configuring/MoreLikeThisType";

class MoreLikeThisPage extends React.Component<any, any> {
    static contextType = AppContext;
    context!: React.ContextType<typeof AppContext>;

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            answers: [],
            answersSet: false,
            savingAnswers: false,
            answersSaved: false
        };

        this.fetchSnippets();
    }

    fetchSnippets = () => {
        if (this.state.snippet || this.state.error) {
            return;
        }

        Resources.getSnippetsByIds([{_id: this.props.match.params.sid}]).then((json) => {
            let docs = json.docs;
            this.setState({snippet: docs ? docs[0] : null});
        }).catch(() => this.setState({error: 'The fragments could not be found based on ID'}));

    };

    handleAllSnippetsHaveAnswers = (answers: Array<any>) => {
        this.setState({answers, answersSet: true});
    };

    handleCommit = () => {
        this.setState({savingAnswers: true});
        Resources.commitAnswers(this.state.answers, this.context.user).then(() => {
            this.setState({answersSaved: true, savingAnswers: false});
        }).catch(() => this.setState({error: 'The answers could not be saved.', savingAnswers: false}));
    };

    render() {

        let snippetId = this.props.match.params.sid;
        let documentId = this.props.match.params.did;
        let from = parseInt(this.props.match.params.from);

        return (
            <Page
                breadcrumbTrail={[
                    { text: "zoeken", path: "/search/"},
                    { text: this.context.search, path: `/search/${this.context.search}/`},
                    { text: <ReadableId id={documentId} lowercase />, path: `/documents/${documentId}/`},
                    { text: <ReadableId id={snippetId} toRemove={documentId} lowercase />, path: `/documents/${documentId}/snippets/${snippetId}/`},
                ]}
            >
                <div className="more-like-this">
                    <h3><ReadableId id={documentId}/></h3>
                    <InfoBox msg={this.state.error} type="warning" onClose={() => this.setState({error: null})}/>
                    <DocumentSnippet
                        id={snippetId}
                        documentId={documentId}
                        text={this.state.snippet ? this.state.snippet._source.text : null}
                        moreLikeThis={false}
                        showSeedSetBtn={false}
                    />

                    {this.context.user
                        ?
                        this.renderScoreForm(from, snippetId, documentId)
                        :
                        <InfoBox
                            type='info'
                            msg={<>First select <Link to="/user/">a user</Link> to assess the relevance.</>}
                        />
                    }
                </div>
            </Page>
        );
    }

    private renderScoreForm(from: number, snippetId: string, documentId: string) {
        return <>
            <h2>To assess relevance #{from + 1}-{from + this.context.moreLikeThisSize}</h2>
            <MoreLikeThisSnippetList
                snippetId={snippetId}
                docId={documentId}
                from={from}
                onAllSnippetsHaveAnswers={this.handleAllSnippetsHaveAnswers}
                moreLikeThisType={fromVal(this.props.match.params.type)}
            />
            <div className="commit-answers">
                <button
                    type="submit"
                    className="btn btn-success float-right commit-btn"
                    disabled={(!this.state.answersSet && !this.state.answersSaved) || !this.context.user}
                    onClick={this.handleCommit}
                >
                    Save ({this.context.user})
                    &nbsp;
                    {this.state.savingAnswers
                        ? <Spinner />
                        : <i className='fa fa-chevron-right'/>
                    }
                </button>
            </div>
            <MoreLikeThisCommitModal
                documentId={documentId}
                snippetId={snippetId}
                from={from}
                answers={this.state.answers}
                committed={this.state.answersSaved}
            />
        </>;
    }

}

MoreLikeThisPage.contextType = AppContext;

export default MoreLikeThisPage;
