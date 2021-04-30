
import * as React from "react";
import type { Client } from "../../../client/client.tsx";
export type { Client } from "../../../client/client.tsx";

export type Snowpack = ImportMeta & { hot: { accept: () => unknown; }; env: Record<string, string>; };
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
    if (!client || !(import.meta as Snowpack).env.SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT)
        return undefined;
    return await client.fetch(data);
}
