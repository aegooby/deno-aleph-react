
import * as React from "react";
import * as ReactHelmet from "react-helmet";

import Page from "../Page.tsx";

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
    const content: React.ReactElement =
        <div className="page">
            <h1><strong>{props.code}</strong> {props.text}</h1>
        </div>;
    return <Page helmet={<title>httpsaurus | {props.text}</title>} content={content} />;
}