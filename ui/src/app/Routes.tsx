import * as React from "react";
import {Redirect, Route, Switch, withRouter} from "react-router-dom";
import Search from "./search/Search";
import MoreLikeThis from "./morelikethis/MoreLikeThis";
import DocumentPage from "./document/DocumentPage";
import ConfigPage from "./configuring/ConfigPage";
import UserPage from "./user/UserPage";
import DataPage from "./data/DataPage";

class Routes extends React.Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {};
    }

    render() {
        // add pathname as key to force instantiation of new component when path changes
        const pathname = this.props.location.pathname;

        return (
            <Switch>
                <Redirect exact from="/" to="/user/"/>
                <Route exact path='/config/' component={ConfigPage} key={pathname}/>
                <Route exact path='/data/' component={DataPage} key={pathname}/>
                <Route exact path='/documents/:did/' component={DocumentPage} key={pathname}/>
                <Route exact path='/documents/:did/snippets/:sid/from/:from/' component={MoreLikeThis} key={pathname}/>
                <Route exact path='/search/' component={Search} key={pathname}/>
                <Route exact path='/search/:search/' component={Search} key={pathname}/>
                <Route exact path='/user/' component={UserPage} key={pathname}/>
            </Switch>
        );
    }
}

export default withRouter(Routes);