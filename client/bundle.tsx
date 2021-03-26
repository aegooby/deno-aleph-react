
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";
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
            <App fetch={httpclient.fetch} />
        </ReactRouter.BrowserRouter>;
    httpclient.hydrate(element);
}
catch (error) { client.Console.error(error); }