
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

export class Client
{
    document = (globalThis as typeof globalThis & GlobalThis).document;
    hydrate(element: React.ReactElement): void
    {
        Console.log("Hydrating bundle");
        ReactDOM.hydrate(element, this.document.querySelector("#root"));
    }
}
