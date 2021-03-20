
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";

export default class NotFound extends React.Component<ReactRouter.RouteComponentProps, unknown>
{
    constructor(props: ReactRouter.RouteComponentProps)
    {
        super(props);
    }
    render(): React.ReactElement
    {
        if (this.props.staticContext)
            this.props.staticContext.statusCode = 404;
        const element =
            <div className="page">
                <h1><strong>404</strong> Not Found</h1>
            </div>;
        return element;
    }
}