
import * as React from "https://esm.sh/react";
import type { Client } from "../../../client/client.tsx";
export type { Client } from "../../../client/client.tsx";

export interface Query
{
    query: string;
    operationName?: string | undefined;
    variables?: Record<string, unknown> | undefined;
}

export const Context = React.createContext(undefined as (Client | undefined));

export const Provider = Context.Provider;
export const Consumer = Context.Consumer;

export function useClient(): Client | undefined
{
    const client = React.useContext(Context);
    if (!client) return undefined;
    return client;
}

export async function useGraphQL(data: string | Query): Promise<Record<string, unknown> | undefined>
{
    const client = useClient();
    if (!client) return undefined;
    return await client.fetch(data);
}