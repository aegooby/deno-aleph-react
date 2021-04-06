
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

import { GraphQL, Suspense } from "./Core/Core.tsx";

import Index from "./Pages/Index.tsx";
const NotFound = React.lazy(() => import(`root:///components/Pages/NotFound.tsx`));

interface Props
{
    client: GraphQL.Client | undefined;
}

export default function App(props: Props)
{
    const element =
        <GraphQL.Provider value={props.client}>
            <Suspense fallback={<Index />}>
                <ReactRouter.Switch>
                    <ReactRouter.Route exact path="/">
                        <Index />
                    </ReactRouter.Route>
                    <ReactRouter.Route component={NotFound} />
                </ReactRouter.Switch>
            </Suspense>
        </GraphQL.Provider>;
    return element;
}
