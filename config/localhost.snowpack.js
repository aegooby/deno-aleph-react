
const config =
{
    extends: "./snowpack.config.js",
    env: { SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT: "https://localhost:5443/graphql" }
}

module.exports = config;
