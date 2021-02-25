
import * as React from "react";

interface Props
{
    Page: React.ComponentType<unknown>;
    /** @todo Find alternative to lint ignore. */
    // deno-lint-ignore no-explicit-any
    pageProps: any;
}

export default class App extends React.Component<Props, unknown>
{
    constructor(props: Props)
    {
        super(props);
    }
    render(): React.ReactElement
    {
        const element =
            <main>
                <head>
                    <title>Hello World - Aleph.js</title>
                </head>
                <this.props.Page {...this.props.pageProps} />
            </main>;
        return element;
    }
}