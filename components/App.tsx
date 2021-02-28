
import * as React from "react";

import Logo from "./Logo.tsx";

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
                <p className="logo"><Logo size={300} /></p>
                <h1><strong>https</strong> server</h1>
                <h2>React v{React.version}</h2>
                <p className="copyinfo">© 0000 Company Inc.</p>
            </div>;

        return element;
    }
}
