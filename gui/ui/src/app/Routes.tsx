import * as React from "react";
import {Redirect, Route, Switch, withRouter} from "react-router-dom";
import SearchPage from "./search/SearchPage";
import MoreLikeThisPage from "./morelikethis/MoreLikeThisPage";
import DocumentPage from "./document/DocumentPage";
import DataPage from "./data/DataPage";
import {AppContext} from "./AppContext";
import SeedSetPage from "./seedset/SeedSetPage";
import PositivePage from "./positives/PositivePage";

class Routes extends React.Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {};
    }

    render() {
        // add key to force instantiation of new component when path or context changes
        const key = this.props.location.pathname + JSON.stringify(this.context);

        return (
            <Switch>
                <Redirect exact from="/" to="/search/"/>
                <Route exact path='/data/' component={DataPage} key={key}/>
                <Route exact path='/documents/:did/' component={DocumentPage} key={key}/>
                <Route exact path='/documents/:did/snippets/:sid/from/:from/' component={MoreLikeThisPage} key={key}/>
                <Route exact path='/documents/:did/snippets/:sid/from/:from/type/:type' component={MoreLikeThisPage} key={key}/>
                <Route exact path='/positive/:page/' component={PositivePage} key={key}/>
                <Route exact path='/search/' component={SearchPage} key={key}/>
                <Route exact path='/search/:search/' component={SearchPage} key={key}/>
                <Route exact path='/seedset/' component={SeedSetPage} key={key}/>
            </Switch>
        );
    }
}
Routes.contextType = AppContext;

export default withRouter(Routes);