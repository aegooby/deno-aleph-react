
import * as React from "https://esm.sh/react";
import * as ReactRouter from "https://esm.sh/react-router-dom";
import * as ReactHelmet from "https://esm.sh/react-helmet";

export default function NotFound(props: ReactRouter.RouteComponentProps)
{
    if (props.staticContext)
        props.staticContext.statusCode = 404;
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                <title>not found</title>
            </ReactHelmet.Helmet>
            <div className="page">
                <h1><strong>404</strong> Not Found</h1>
            </div>
        </>;
    return element;
}