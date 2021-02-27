
import * as React from "react";

interface Props
{
    denoVersion?: string;
}

export default class App extends React.Component<Props, unknown>
{
    constructor(props: Props)
    {
        super(props);
    }
    render(): React.ReactElement
    {
        const reactVersion = React.version;

        const element =
            <div className="page">
                <p className="logo"></p>
                <h1><strong>Deno</strong> v{this.props.denoVersion}</h1>
                <div className="counter">
                </div>
                <p className="copyinfo">React v{reactVersion} (deno-react)</p>
            </div>;

        return element;
    }
}
