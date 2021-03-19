
import * as React from "https://esm.sh/react";
import * as client from "./client.tsx";

import App from "../components/Core/App.tsx";
import Index from "../components/Pages/Index.tsx";

try
{
    const clientAttributes =
    {
        api: "https://localhost:8443/graphql"
    };
    const httpclient = new client.Client(clientAttributes);
    httpclient.hydrate(<App routes={{ "/": <Index /> }} fetch={httpclient.fetch} />);
}
catch (error) { client.Console.error(error); }