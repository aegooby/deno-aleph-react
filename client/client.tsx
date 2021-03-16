
import * as React from "https://esm.sh/react";
import * as ReactDOM from "https://esm.sh/react-dom";

import { Console } from "./console.tsx";
export { Console } from "./console.tsx";

interface GlobalThis
{
    document:
    {
        querySelector: (_: string) => DocumentFragment;
    };
}

interface ClientAttributes
{
    api: string;
}

export class Client
{
    private document = (globalThis as typeof globalThis & GlobalThis).document;
    private api: string;
    constructor(attributes: ClientAttributes)
    {
        this.api = attributes.api;

        this.fetch = this.fetch.bind(this);
    }
    public async fetch(query: unknown): Promise<Record<string, unknown>>
    {
        const fetchOptions: { method?: string; headers?: Record<string, string>; body?: string; } =
        {
            method: "POST",
        };
        switch (typeof query)
        {
            case "string":
                {
                    fetchOptions.headers = { "content-type": "application/graphql" };
                    fetchOptions.body = query;
                    break;
                }
            default:
                {
                    fetchOptions.headers = { "content-type": "application/json" };
                    fetchOptions.body = JSON.stringify(query);
                    break;
                }
        }
        return await (await fetch(this.api, fetchOptions)).json();
    }
    public hydrate(element: React.ReactElement): void
    {
        Console.log("Hydrating bundle");
        ReactDOM.hydrate(element, this.document.querySelector("#root"));
    }
}
