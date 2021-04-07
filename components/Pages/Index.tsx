
import * as React from "https://esm.sh/react";
import * as ReactHelmet from "https://esm.sh/react-helmet";

import { GraphQL, Console } from "../Core/Core.tsx";

export default function Index()
{
    const promise = GraphQL.useGraphQL({ query: `query { request }` });
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
        <>
            <ReactHelmet.Helmet>
                <title>httpsaurus</title>
            </ReactHelmet.Helmet>
            <div className="page">
                <p className="logo">
                    <img src="/static/logo.webp" height={304} width={256} alt="logo" />
                </p>
                <h1><strong>https</strong>aurus</h1>
                <h2>React v{React.version}</h2>
                <p className="copyinfo">© 0000 Company, Inc.</p>
            </div>
        </>;
    return element;
}