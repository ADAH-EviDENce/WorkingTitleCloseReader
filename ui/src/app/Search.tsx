import * as React from "react";
import SearchBar from "./SearchBar";
import Page from "./Page";

class Search extends React.Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {};
    }

    handleSearch = (query: string) => {
        console.log('handle search with query', query);
    };

    render() {
        return (
            <Page>
                <div className="offset-2 col-8">
                    <SearchBar onSearch={this.handleSearch}/>
                </div>
            </Page>
        );
    }
}

export default Search;