
const config =
{
    mount: 
    {
        "../public": "/",
        "../client": "/scripts",
        "../components": "/scripts",
        "../graphql": "/scripts"
    },
    plugins: 
    [
        "@snowpack/plugin-react-refresh",
        [
            "@snowpack/plugin-webpack",
            {
                sourceMap: true,
                failOnWarnings: true,
                outputPattern: { js: "scripts/webpack/[name].[id].js" },
                extendConfig: function (config)
                {
                    const babel = 
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
                    };
                    config.module.rules.push(babel);
                    return config;
                }
            }
        ]
    ],
    routes: [{ match: "routes", src: ".*", dest: "/index.html" }],
    /** @todo Switch from webpack to esbuild once stable. */
    /* optimize:                */
    /* {                        */
    /*     entrypoints: "auto", */
    /*     bundle: true,        */
    /*     sourcemap: true,     */
    /*     splitting: true,     */
    /*     treeshake: true,     */
    /*     minify: true,        */
    /*     target: "es2020"     */
    /* },                       */
    packageOptions: 
    {
        polyfillNode: true
        /** @todo Restore when react-router-dom is fixed. */
        /* "source": "remote",      */
        /* "cache": "../.cache/"    */
    },
    devOptions: 
    {
        output: "dashboard",
        hmrErrorOverlay: true,
        port: 5443
    },
    buildOptions: 
    {
        out: "../dist/",
        sourcemap: true
    }
};

module.exports = config;
