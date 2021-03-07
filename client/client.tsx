
import * as React from "react";
import * as ReactDOM from "react-dom";

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
    hydrate(element: React.ReactElement): void
    {
        const document = (globalThis as typeof globalThis & GlobalThis).document;
        ReactDOM.hydrate(element, document.querySelector("#root"));
    }
}
