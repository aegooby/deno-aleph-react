
import * as React from "https://esm.sh/react";
import * as UIRouter from "./Router/UIRouter.tsx";

import { Console } from "../../client/console.tsx";

interface Props
{
    fetch: (json: unknown) => Promise<Record<string, unknown>>;
    routes: Record<string, React.ReactElement>;
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
        return <UIRouter.Component routes={this.props.routes} />;
    }
}
