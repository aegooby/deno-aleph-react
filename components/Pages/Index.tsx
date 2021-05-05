
import * as React from "react";

import { GraphQL, Console } from "../Core/Core.tsx";
import graphql from "../../graphql/graphql.tsx";
const Lazy = React.lazy(() => import("./Lazy/Index.tsx"));
import Page from "../Page.tsx";

export default function Index()
{
    const promise = GraphQL.useGraphQL({ query: graphql`query { request }` });
    function effect()
    {
        async function __effect()
        {
            const data = await promise;
            if (data) Console.log(data);
        }
        __effect();
    }
    React.useEffect(effect);
    const element: React.ReactElement =
        <Page
            helmet={<title>httpsaurus</title>}
            content={<Lazy />}
            lazy
        />;
    return element;
}
