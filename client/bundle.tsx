
import * as React from "react";
import * as ReactRouter from "react-router";
import * as client from "./client.tsx";

import App from "../components/App.tsx";

try
{
    const clientAttributes =
    {
        api: client.process.env.GRAPHQL_API_ENDPOINT,
    };
    const httpclient = new client.Client(clientAttributes);
    const element: React.ReactElement =
        <ReactRouter.BrowserRouter>
            <App client={httpclient} />
        </ReactRouter.BrowserRouter>;
    httpclient.hydrate(element);
}
catch (error) { client.Console.error(error); }