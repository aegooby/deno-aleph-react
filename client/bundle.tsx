
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";
import * as client from "./client.tsx";

import App from "../components/App.tsx";

interface Process
{
    env: Record<string, string>;
}

declare const process: Process;

try
{
    const clientAttributes =
    {
        api: process.env.GRAPHQL_API_ENDPOINT,
    };
    const httpclient = new client.Client(clientAttributes);
    const element: React.ReactElement =
        <ReactRouter.BrowserRouter>
            <App fetch={httpclient.fetch} />
        </ReactRouter.BrowserRouter>;
    httpclient.hydrate(element);
}
catch (error) { client.Console.error(error); }