
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

import { Console } from "../client/console.tsx";

import Index from "./Pages/Index.tsx";
import NotFound from "./Pages/NotFound.tsx";

interface Props
{
    fetch: (json: unknown) => Promise<Record<string, unknown>>;
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
            const response = await this.props.fetch({ query: "query{ request }" });
            if (!this.mounted)
                return;
            const data = response.data;
            console.log(JSON.stringify(data));
        }
        catch (error) { Console.error(error); }
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
