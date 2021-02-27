
import * as React from "react";

import Logo from "./components/Logo.tsx";

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
                <h1><strong>Deno</strong></h1>
                <h2>http server</h2>
                <p className="copyinfo">React v{React.version}</p>
            </div>;

        return element;
    }
}
