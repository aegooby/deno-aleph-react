
const config =
{
    mount: 
    {
        "../public": "/",
        "../client": "/dist",
        "../components": "/dist",
        "../graphql": "/dist"
    },
    plugins: 
    [
        "@snowpack/plugin-react-refresh",
        [
            "@snowpack/plugin-webpack",
            {
                sourceMap: true,
                failOnWarnings: true,
                outputPattern: { js: "dist/webpack/[name].js" },
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
    /** @todo See what to do about this. */
    // optimize: { bundle: true },
    packageOptions: 
    {
        polyfillNode: true,
        "@todo-source": "remote",
        "@todo-cache": "../.cache/"
    },
    devOptions: 
    {
        output: "dashboard",
        hmrErrorOverlay: true,
        port: 8443
    },
    buildOptions: 
    {
        out: "../dist/",
        sourcemap: true
    }
};

module.exports = config;
