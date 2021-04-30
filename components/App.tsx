
import * as React from "react";
import * as ReactRouter from "react-router-dom";

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
            <ReactRouter.Routes>
                <ReactRouter.Route path="/" element={<Index />} />
                <ReactRouter.Route path="/internalerror" element={<InternalError />} />
                <ReactRouter.Route path="*" element={<NotFound />} />
            </ReactRouter.Routes>
        </GraphQL.Provider>;
    return element;
}
