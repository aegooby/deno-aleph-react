
import * as React from "react";

interface Props
{
    routes: Map<string, React.ReactElement>;
}
interface State
{
    route: string;
}

export class Component extends React.Component<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        this.state = { route: "/" };

        this.reroute = this.reroute.bind(this);
    }
    reroute(route: string): void
    {
        this.setState({ route: route });
    }
    render(): React.ReactElement
    {
        if (this.props.routes.has(this.state.route))
        {
            const element =
                <Context.Provider value={this}>
                    {this.props.routes.get(this.state.route) as React.ReactElement}
                </Context.Provider>;
            return element;
        }
        else throw new Error("route not found");
    }
}
export const Context = React.createContext(null as Component | null);