
import * as http from "https://deno.land/std/http/mod.ts";

import * as graphql from "https://esm.sh/graphql";
import * as query from "https://esm.sh/query-string";

import * as console from "./console.tsx";

class GraphQL
{
    url(url: string): string
    {
        const parsed = query.parseUrl(url);
        if (parsed.url !== "/graphql")
        {
            console.Console.warn("Non-GraphQL request routed to GraphQL");
            return "";
        }
        return parsed.query.query as string;
    }
}

console.Console.dev = true;
const gql = new GraphQL();
await gql.url("/graphql?query={penis{dong}}");
