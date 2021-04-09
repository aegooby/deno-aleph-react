
import * as React from "https://esm.sh/react";
import * as ReactHelmet from "react-helmet";

interface Props
{
    staticContext:
    {
        statusCode: number;
    };
}

export default function NotFound(props: Props)
{
    if (props.staticContext)
        props.staticContext.statusCode = 404;
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                <title>httpsaurus | Not Found</title>
            </ReactHelmet.Helmet>
            <div className="page">
                <h1><strong>404</strong> Not Found</h1>
            </div>
        </>;
    return element;
}