
import * as React from "react";
import * as ReactRouter from "react-router";

import { GraphQL } from "./Core/Core.tsx";

import Index from "./Pages/Index.tsx";
import NotFound from "./Pages/NotFound.tsx";
import InternalError from "./Pages/InternalError.tsx";

interface Props
{
    client: GraphQL.Client | undefined;
}

export default function App(props: Props)
{
    const element =
        <GraphQL.Provider value={props.client}>
            <ReactRouter.Switch>
                <ReactRouter.Route exact path="/">
                    <Index />
                </ReactRouter.Route>
                <ReactRouter.Route exact path="/internalerror" component={InternalError} />
                <ReactRouter.Route component={NotFound} />
            </ReactRouter.Switch>
        </GraphQL.Provider>;
    return element;
}
