
import * as React from "react";
import * as ReactRouter from "react-router-dom";

import { GraphQL } from "./Core/Core.tsx";

import Index from "./Pages/Index.tsx";
import MobileProf from "./Pages/MobileProf.tsx";
import Error from "./Pages/Error.tsx";

interface Props
{
    client: GraphQL.Client | undefined;
}

export default function App(props: Props)
{
    const element =
        <React.StrictMode>
            <GraphQL.Provider value={props.client}>
                <ReactRouter.Routes>
                    <ReactRouter.Route path="/" element={<Index />} />
                    <ReactRouter.Route path="/mobile-prof" element={<MobileProf />} />
                    <ReactRouter.Route path="*" element={<Error code={404} text="Not Found" />} />
                </ReactRouter.Routes>
            </GraphQL.Provider>
        </React.StrictMode>;
    return element;
}
