
import * as React from "react";
import * as ReactRouter from "react-router-dom";
import * as client from "./client.tsx";

import App from "../components/App.tsx";

type Snowpack = ImportMeta & { hot: { accept: () => unknown; }; env: Record<string, string>; };

try
{
    const clientAttributes =
    {
        api: (import.meta as Snowpack).env.SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT,
    };
    const httpclient = new client.Client(clientAttributes);
    const element: React.ReactElement =
        <ReactRouter.BrowserRouter>
            <App client={httpclient} />
        </ReactRouter.BrowserRouter>;
    switch ((import.meta as Snowpack).env.MODE)
    {
        case "development":
            httpclient.render(element);
            if ((import.meta as Snowpack).hot)
                (import.meta as Snowpack).hot.accept();
            break;
        case "production":
            httpclient.hydrate(element);
            break;
        default:
            throw new Error("Unknown Snowpack mode");
    }
}
catch (error) { client.Console.error(error); }