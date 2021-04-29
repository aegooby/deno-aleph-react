
// deno-lint-ignore-file
import * as path from "path";
import * as webpack from "webpack";

import "webpack-dev-server";

declare const __dirname: string;

export default function (env: Record<string, string>)
{
    const config: webpack.Configuration =
    {
        mode: "none",
        stats: "normal",
        entry: path.resolve(__dirname, "public/dist/deno.bundle.js"),
        output:
        {
            path: path.resolve(__dirname, "public/dist/"),
            filename: "webpack.bundle.js",
        },
        plugins:
            [
                new webpack.EnvironmentPlugin({ GRAPHQL_API_ENDPOINT: env.GRAPHQL_API_ENDPOINT })
            ],
        module:
        {
            rules:
                [
                    {
                        test: /\.m?js$/,
                        exclude: /(node_modules|\.cache)/,
                        use:
                        {
                            loader: "babel-loader",
                            options:
                            {
                                presets: ["@babel/preset-env"],
                                plugins:
                                    [
                                        "@babel/plugin-proposal-class-properties",
                                        "@babel/plugin-transform-runtime"
                                    ]
                            }
                        }
                    }
                ]
        },
        experiments: { topLevelAwait: true }
    };

    return config;
}
