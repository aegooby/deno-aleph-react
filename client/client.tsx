
import * as React from "react";
import * as ReactDOM from "react-dom";

import App from "../components/App.tsx";

interface GlobalThis
{
    document:
    {
        querySelector: (_: string) => DocumentFragment;
    };
}

export class Console
{
    static log(message: string): void
    {
        console.log("  [*]  " + message);
    }
    static success(message: string): void
    {
        console.log("  [$]  " + message);
    }
    static warn(message: string): void
    {
        console.warn("  [?]  " + message);
    }
    static error(message: string): void
    {
        console.error("  [!]  " + message);
    }
}

export type Protocol = "unknown" | "http" | "https";

export interface ClientAttributes
{
    protocol: Protocol;
    hostname: string;
    port: number;
}

export class Client
{
    static document = (globalThis as typeof globalThis & GlobalThis).document;
    hydrate(element: React.ReactElement): void
    {
        ReactDOM.hydrate(element, Client.document.querySelector("#root"));
    }
    static main(): void
    {
        try
        {
            const client = new Client();
            client.hydrate(<App />);
        }
        catch (error)
        {
            Console.log(error);
        }
    }
}
