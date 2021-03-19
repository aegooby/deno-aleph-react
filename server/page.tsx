
import * as http from "https://deno.land/std/http/mod.ts";

import * as React from "https://esm.sh/react";
import * as ReactDOMServer from "https://esm.sh/react-dom/server";

export class Page
{
    public static render(status: http.Status): string
    {
        const html:
            {
                title: React.ReactElement;
                stylesheet: React.ReactElement;
                element: React.ReactElement;
            } =
        {
            title: <></>,
            stylesheet: <></>,
            element: <></>,
        };
        switch (status)
        {
            case http.Status.OK:
                html.title = <title>Home</title>;
                html.stylesheet = <link rel="stylesheet" href="/static/index.css" />;
                html.element = <script src="/.httpsaurus/bundle-stupid-safari.js" defer></script>;
                break;
            case http.Status.NotFound:
                html.title = <title>404</title>;
                html.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                html.element = <h1>404 Not Found</h1>;
                break;
            case http.Status.MethodNotAllowed:
                html.title = <title>Relax, chief</title>;
                html.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                html.element = <h1>405 Method Not Allowed</h1>;
                break;
            case http.Status.InternalServerError:
                html.title = <title>Oops</title>;
                html.stylesheet = <link rel="stylesheet" href="/static/error.css" />;
                html.element = <h1>500 Internal Server Error</h1>;
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
                    {html.title}
                    {html.stylesheet}
                </head>
                <body>
                    <div id="root">
                        {html.element}
                    </div>
                </body>
            </html>;

        return "<!DOCTYPE html>" + ReactDOMServer.renderToString(page);
    }
}
