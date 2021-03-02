
import * as React from "react";

export default class App extends React.Component<unknown, unknown>
{
    constructor(props: unknown)
    {
        super(props);
    }
    render(): React.ReactElement
    {
        const element =
            <div className="page">
                <p className="logo">
                    <img src="static/logo.gif" height={300} />
                </p>
                <h1><strong>https</strong>erver</h1>
                <h2>React v{React.version}</h2>
                <p className="copyinfo">© 0000 Company Inc.</p>
            </div>;

        return element;
    }
}
