
import * as React from "react";

interface Props
{
    size?: number;
}

export default class Logo extends React.Component<Props, unknown>
{
    constructor(props: Props)
    {
        super(props);
    }
    render(): React.ReactElement
    {
        return <img src="/logo.svg" height={this.props.size} title="Aleph.js" />;
    }
}
