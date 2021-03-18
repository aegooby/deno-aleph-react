
import * as http from "https://deno.land/std/http/mod.ts";

import * as React from "https://esm.sh/react";
import * as ReactDOMServer from "https://esm.sh/react-dom/server";

export class Page
{
    public static render(status: http.Status): string
    {
        const body: { stylesheet: React.ReactElement; element: React.ReactElement; } =
        {
            stylesheet: <></>,
            element: <></>
        };
        switch (status)
        {
            case http.Status.OK:
                body.stylesheet = <link rel="stylesheet" href="/static/index.css" />;
                body.element = <script src="/.httpsaurus/bundle.js" defer></script>;
                break;
            case http.Status.NotFound:
                body.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                body.element = <h1>404 Not Found</h1>;
                break;
            case http.Status.MethodNotAllowed:
                body.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                body.element = <h1>405 Method Not Allowed</h1>;
                break;
            case http.Status.InternalServerError:
                body.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                body.element = <h1>500 Internal Server Error</h1>;
                break;
            default:
                break;
        }
        const page: React.ReactElement =
            <html lang="en">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta httpEquiv="Content-Security-Policy" />
                    <meta charSet="UTF-8" />
                    {body.stylesheet}
                </head>
                <body>
                    <div id="root">
                        {body.element}
                    </div>
                </body>
            </html>;

        return "<!DOCTYPE html>" + ReactDOMServer.renderToString(page);
    }
}
