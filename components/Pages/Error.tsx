
import * as React from "react";
import * as ReactHelmet from "react-helmet";

interface Props
{
    code: number;
    text: string;
    staticContext?: { statusCode: number; };
}

export default function Error(props: Props)
{
    if (props.staticContext)
        props.staticContext.statusCode = props.code;
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                <title>httpsaurus | {props.text}</title>
            </ReactHelmet.Helmet>
            <div className="page">
                <h1><strong>404</strong> {props.text}</h1>
            </div>
        </>;
    return element;
}