import * as React from "react";
import SnippetListItem from "../common/SnippetListItem";

interface SearchSnippetProps {
    id: string,
    text: string
    onDeselect: Function
}

export class SeedSetSnippet extends React.Component<SearchSnippetProps, any> {

    render() {
        return (
            <SnippetListItem id={this.props.id} text={this.props.text} >
                <button className="btn btn-danger btn-sm float-right" onClick={() => this.props.onDeselect()}>
                    <i className='fa fa-trash'/>
                </button>
            </SnippetListItem>
        );
    }
}

export default SeedSetSnippet;