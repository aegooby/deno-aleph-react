
// deno-lint-ignore-file
import * as path from "path";
import * as webpack from "webpack";

import "webpack-dev-server";

declare const __dirname: string;

const config: webpack.Configuration =
{
    mode: "none",
    stats: "minimal",
    entry: path.resolve(__dirname, ".dist/bundle-babel.js"),
    output:
    {
        path: path.resolve(__dirname, ".dist/"),
        filename: "bundle-webpack.js",
    }
};

export default config;
