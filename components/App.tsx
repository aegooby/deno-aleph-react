
import * as React from "react";

import Index from "./Pages/Index.tsx";
import * as UIRouter from "./Router/UIRouter.tsx";

export default class App extends React.Component
{
    routes: Map<string, React.ReactElement> = new Map<string, React.ReactElement>();
    constructor(props: Readonly<unknown>)
    {
        super(props);

        this.routes.set("/", <Index />);
    }
    render(): React.ReactElement
    {
        return <UIRouter.Component routes={this.routes} />;
    }
}
