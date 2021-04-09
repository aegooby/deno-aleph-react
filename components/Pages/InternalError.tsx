
import * as React from "react";
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
        props.staticContext.statusCode = 500;
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                <title>httpsaurus | Internal Error</title>
            </ReactHelmet.Helmet>
            <div className="page">
                <h1><strong>500</strong> Not Found</h1>
            </div>
        </>;
    return element;
}