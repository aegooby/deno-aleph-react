
const config =
{
    extends: "./snowpack.config.js",
    env: { SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT: "https://localhost:8443/graphql" }
}

module.exports = config;
