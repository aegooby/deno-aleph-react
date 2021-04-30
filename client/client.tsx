
import * as React from "react";
import * as ReactDOM from "react-dom";

import { Console } from "./console.tsx";
export { Console } from "./console.tsx";
import type { GraphQL } from "../components/Core/Core.tsx";

interface Document
{
    querySelector: (selectors: string) => DocumentFragment;
}

interface ClientAttributes
{
    api: string;
}

export declare const document: Document;
export type Snowpack = ImportMeta & { hot: { accept: () => unknown; }; env: Record<string, string>; };

export class Client
{
    private api: string;
    constructor(attributes: ClientAttributes)
    {
        this.api = attributes.api;

        this.fetch = this.fetch.bind(this);
    }
    public async fetch(data: string | GraphQL.Query): Promise<Record<string, unknown>>
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
    public render(element: React.ReactElement): void
    {
        Console.log("Hydrating bundle");
        ReactDOM.render(element, document.querySelector("#root"));
    }
}
