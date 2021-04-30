
import * as React from "react";
import * as ReactRouter from "react-router-dom";

import { GraphQL, Suspense } from "./Core/Core.tsx";

const Index = React.lazy(() => import("./Pages/Index.tsx"));
const Error = React.lazy(() => import("./Pages/Error.tsx"));

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
                    <ReactRouter.Route path="*" element={<Error code={404} text="Not Found" />} />
                </ReactRouter.Routes>
            </Suspense>
        </GraphQL.Provider>;
    return element;
}
