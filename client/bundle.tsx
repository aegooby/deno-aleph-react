
import * as React from "react";
import * as Client from "./client.tsx";

import App from "../components/Core/App.tsx";

try
{
    const client = new Client.Client();
    client.hydrate(<App />);
}
catch (error)
{
    Client.Console.log(error);
}