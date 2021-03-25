
// deno-lint-ignore-file
import * as path from "path";
import * as webpack from "webpack";

import "webpack-dev-server";

declare const __dirname: string;

const config: webpack.Configuration =
{
    mode: "none",
    stats: "minimal",
    entry: path.resolve(__dirname, ".dist/deno.bundle.js"),
    output:
    {
        path: path.resolve(__dirname, ".dist/"),
        filename: "webpack.bundle.js",
    },
    plugins:
        [
            new webpack.EnvironmentPlugin(["GRAPHQL_API_ENDPOINT"])
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
    }
};

export default config;
