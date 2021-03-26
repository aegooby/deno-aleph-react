
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

import * as client from "../client/client.tsx";

import Index from "./Pages/Index.tsx";
import NotFound from "./Pages/NotFound.tsx";

interface Props
{
    client: client.Client | undefined;
}

export default class App extends React.Component<Props, unknown>
{
    private mounted: boolean = false as const;
    constructor(props: Props)
    {
        super(props);
    }
    async componentDidMount(): Promise<void>
    {
        try
        {
            this.mounted = true;
            if (!this.props.client)
                return;
            const response = await this.props.client.fetch({ query: "query{ request }" });
            if (!this.mounted)
                return;
            const data = response.data;
            client.Console.log(JSON.stringify(data));
        }
        catch (error) { client.Console.error(error); }
    }
    componentWillUnmount(): void
    {
        this.mounted = false;
    }
    render(): React.ReactElement
    {
        const element =
            <ReactRouter.Switch>
                <ReactRouter.Route exact path="/">
                    <Index />
                </ReactRouter.Route>
                <ReactRouter.Route render={function (props) { return <NotFound {...props} />; }} />
            </ReactRouter.Switch>;
        return element;
    }
}
