
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

import { GraphQL } from "./Core/Core.tsx";
export { GraphQL } from "./Core/Core.tsx";
export { Console } from "../client/console.tsx";

import Index from "./Pages/Index.tsx";
import NotFound from "./Pages/NotFound.tsx";

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
                <ReactRouter.Route component={NotFound} />
            </ReactRouter.Switch>
        </GraphQL.Provider>;
    return element;
}
