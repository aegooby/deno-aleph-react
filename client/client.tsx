
import * as React from "https://esm.sh/react";
import * as ReactDOM from "https://esm.sh/react-dom";

import { Console } from "./console.tsx";
export { Console } from "./console.tsx";
import type { Query } from "../components/GraphQL/GraphQL.tsx";

interface Document
{
    querySelector: (selectors: string) => DocumentFragment;
}

interface ClientAttributes
{
    api: string;
}

interface Process
{
    env: Record<string, string>;
}

export declare const process: Process;
export declare const document: Document;

export class Client
{
    private api: string;
    constructor(attributes: ClientAttributes)
    {
        this.api = attributes.api;

        this.fetch = this.fetch.bind(this);
    }
    public async fetch(data: string | Query): Promise<Record<string, unknown>>
    {
        const fetchOptions: { method?: string; headers?: Record<string, string>; body?: string; } =
        {
            method: "POST",
        };
        switch (typeof data)
        {
            case "string":
                {
                    fetchOptions.headers = { "content-type": "application/graphql" };
                    fetchOptions.body = data;
                    break;
                }
            default:
                {
                    fetchOptions.headers = { "content-type": "application/json" };
                    fetchOptions.body = JSON.stringify(data);
                    break;
                }
        }
        return await (await fetch(this.api, fetchOptions)).json();
    }
    public hydrate(element: React.ReactElement): void
    {
        Console.log("Hydrating bundle");
        ReactDOM.hydrate(element, document.querySelector("#root"));
    }
}
