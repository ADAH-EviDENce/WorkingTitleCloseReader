import * as React from "react";
import Resources from "../Resources";
import InfoBox from "../common/InfoBox";
import MoreLikeThisSnippet from "./MoreLikeThisSnippet";
import {MoreLikeThisOption} from "./MoreLikeThisOption";
import {AppContext} from "../AppContext";
import {MoreLikeThisType} from "../configuring/MoreLikeThisType";

interface MoreLikeThisSnippetListProps {
    snippetId: string,
    docId: string,
    from: number,
    onAllSnippetsHaveAnswers: ((answers: Array<any>) => void)
}

class MoreLikeThisSnippetList extends React.Component<MoreLikeThisSnippetListProps, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            // array of snippet ids and relevance
            answers: []
        };
        this.fetchSnippets(context);
    }

    private fetchSnippets = (context: React.ContextType<typeof AppContext>) => {
        if (this.state.snippets || this.state.error) {
            return;
        }

        switch (context.moreLikeThisType) {
            case MoreLikeThisType.ES:
                this.fetchFromES(context.moreLikeThisSize, context.useRocchio);
                break;
            case MoreLikeThisType.DOC2VEC:
                this.fetchFromDoc2Vec(context.moreLikeThisSize, context.useRocchio);
                break;
        }
    };

    private fetchFromES(size: number, useRocchio: boolean) {
        if (useRocchio) {
            Resources.getSnippetsFromESUsingRocchio(
                this.props.snippetId,
                this.props.docId,
                this.props.from,
                size,
                this.context.user
            ).then( (data) => {
                data.json().then( (json) => {
                    this.handleNewSnippets(json)
                })
            }).catch( (data) => {
                this.setState({error: 'Fout bij ophalen ElasticSearch fragmenten met Rocchio.'})
            });
        } else {
            Resources.getMoreLikeThisSnippetsFromES(
                this.props.snippetId,
                this.props.docId,
                this.props.from,
                size
            ).then((json) => {
                this.handleNewSnippets(json);
            }).catch((data) => {
                this.setState({error: 'Er trad een fout op bij het ophalen van de fragmenten uit ElasticSearch.'});
            });
        }
    }

    private handleNewSnippets(snippets: any) {
        const answers :any[] = [];
        snippets.hits.hits.forEach((s: any) => {
            answers.push({id: s._id, relevant: MoreLikeThisOption.MAYBE});
        });
        this.setState({snippets, answers}, () => this.props.onAllSnippetsHaveAnswers(this.state.answers));
    }

    private fetchFromDoc2Vec(size: number, useRocchio: boolean) {
        let get = useRocchio ?
                  Resources.getMoreLikeThisSnippetsFromDoc2VecUsingRocchio :
                  Resources.getMoreLikeThisSnippetsFromDoc2Vec;
        get(
            this.props.snippetId,
            this.props.docId,
            this.props.from,
            size,
            this.context.user
        ).then((data) => {
            if (!data.ok) {
                throw Error("Status " + data.status);
            }
            data.json().then((json) => {
                this.handleNewSnippets(json);
            });
        }).catch((data) => {
            this.setState({error: 'Er trad een fout op bij het ophalen van de fragmenten uit doc2vec.'});
        });
    }

    handleSelect = (id: string, relevant: MoreLikeThisOption) => {
        const answers = this.state.answers;

        this.addOrEditChoice(answers, id, relevant);

        this.setState(answers, () => {
            if (this.state.answers.length === this.state.snippets.hits.hits.length) {
                this.props.onAllSnippetsHaveAnswers(this.state.answers);
            }
        });
    };

    private addOrEditChoice(answers: Array<any>, id: string, relevant: MoreLikeThisOption) {
        const answerById = answers.find((a: any) => a.id === id);
        if (answerById) {
            answerById.relevant = relevant;
        } else {
            answers.push({id, relevant});
        }
    }

    private findRelevantById(id: number) {
        let answer = this.state.answers.find((a: any) => a.id === id);
        if (answer) {
            return answer.relevant;
        }
    }

    private renderSnippets() {
        if (!this.state.snippets) {
            return null;
        }
        return this.state.snippets.hits.hits.map((s: any, i: number) => {
            return <MoreLikeThisSnippet
                key={i}
                id={s._id}
                text={s._source ? s._source.text : '-'}
                onSelect={this.handleSelect}
                relevant={this.findRelevantById(s._id)}
            />
        });
    }

    render() {
        return (
            <div className="more-like-this-snippet-list">
                <InfoBox msg={this.state.error} type="warning" onClose={() => this.setState({error: null})}/>
                <div>
                    {this.renderSnippets()}
                </div>
            </div>
        );
    }
}

MoreLikeThisSnippetList.contextType = AppContext;

export default MoreLikeThisSnippetList;
