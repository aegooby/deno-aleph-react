
import * as React from "react";
import * as ReactRouter from "react-router-dom";

import { GraphQL, Suspense } from "./Core/Core.tsx";

const Index = React.lazy(() => import("./Pages/Index.tsx"));
const NotFound = React.lazy(() => import("./Pages/NotFound.tsx"));
const InternalError = React.lazy(() => import("./Pages/InternalError.tsx"));

interface Props
{
    client: GraphQL.Client | undefined;
}

export default function App(props: Props)
{
    const element =
        <GraphQL.Provider value={props.client}>
            <Suspense fallback={<></>}>
                <ReactRouter.Routes>
                    <ReactRouter.Route path="/" element={<Index />} />
                    <ReactRouter.Route path="/internalerror" element={<InternalError />} />
                    <ReactRouter.Route path="*" element={<NotFound />} />
                </ReactRouter.Routes>
            </Suspense>
        </GraphQL.Provider>;
    return element;
}
