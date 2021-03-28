
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

import * as client from "../client/client.tsx";

import Index from "./Pages/Index.tsx";
import NotFound from "./Pages/NotFound.tsx";

interface Props
{
    client: client.Client | undefined;
}

export default function App(props: Props)
{
    function effect()
    {
        async function __effect()
        {
            if (!props.client)
                return;
            const response = await props.client.fetch({ query: "query{ request }" });
            const data = response.data;
            client.Console.log(JSON.stringify(data));
        }
        __effect();
    }
    React.useEffect(effect);
    const element =
        <ReactRouter.Switch>
            <ReactRouter.Route exact path="/">
                <Index />
            </ReactRouter.Route>
            <ReactRouter.Route render={function (props) { return <NotFound {...props} />; }} />
        </ReactRouter.Switch>;
    return element;
}
