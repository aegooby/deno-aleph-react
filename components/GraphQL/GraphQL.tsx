
import * as React from "https://esm.sh/react";
import type { Client } from "../../client/client.tsx";
export type { Client } from "../../client/client.tsx";

export const Context = React.createContext(undefined as (Client | undefined));

export const Provider = Context.Provider;
export const Consumer = Context.Consumer;

export async function useGraphQL(data: unknown)
{
    const client = React.useContext(Context);
    if (!client) return undefined;
    return await client.fetch(data);
}
