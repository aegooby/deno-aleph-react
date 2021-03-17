
import * as React from "https://esm.sh/react";

interface Props
{
    routes: Record<string, React.ReactElement>;
}
interface State
{
    route: string;
}

export default class UIRouter extends React.Component<Props, State>
{
    public static Context = React.createContext(null as UIRouter | null);
    private routes: Map<string, React.ReactElement> = new Map<string, React.ReactElement>();
    constructor(props: Props)
    {
        super(props);
        this.state = { route: "/" };

        for (const key in this.props.routes)
            this.routes.set(key, this.props.routes[key]);

        this.reroute = this.reroute.bind(this);
    }
    reroute(route: string): void
    {
        this.setState({ route: route });
    }
    render(): React.ReactElement
    {
        if (this.routes.has(this.state.route))
        {
            const element =
                <UIRouter.Context.Provider value={this}>
                    {this.routes.get(this.state.route) as React.ReactElement}
                </UIRouter.Context.Provider>;
            return element;
        }
        else throw new Error("route not found");
    }
}