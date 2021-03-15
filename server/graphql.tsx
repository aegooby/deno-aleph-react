
import * as http from "https://deno.land/std/http/mod.ts";

import * as graphql from "https://esm.sh/graphql";
import * as playground from "https://esm.sh/graphql-playground-html";

import { Console } from "./console.tsx";

interface GraphQLAttributes
{
    schema: string;
    resolvers: unknown;
}

interface GraphQLBuildAttributes
{
    url: string;
}

export class GraphQL
{
    private schemaPath: string;
    private schema: graphql.GraphQLSchema = new graphql.GraphQLSchema({});
    private resolvers: unknown;
    private playgroundHTML: string = "" as const;
    constructor(attributes: GraphQLAttributes)
    {
        this.schemaPath = attributes.schema;
        this.resolvers = attributes.resolvers;
    }
    private async buildSchema()
    {
        const schemaFile = await Deno.readTextFile(this.schemaPath);
        this.schema = graphql.buildSchema(schemaFile);
    }
    private async query(request: http.ServerRequest): Promise<http.Response>
    {
        try
        {
            const decoder = new TextDecoder();
            const body: string = decoder.decode(await Deno.readAll(request.body));
            const query: { query: string; operationName?: string; variables?: { [key: string]: unknown; }; } = { query: "" };
            switch (request.headers.get("content-type"))
            {
                case "application/json":
                    {
                        const json = JSON.parse(body);
                        query.query = json.query;
                        query.operationName = json.operationName;
                        query.variables = json.variables;
                        break;
                    }
                case "application/graphql":
                    {
                        query.query = body;
                        break;
                    }
                default:
                    throw new Error("Invalid GraphQL MIME type");
            }
            const graphqlargs: graphql.GraphQLArgs =
            {
                schema: this.schema,
                source: query.query,
                rootValue: this.resolvers,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphqlargs);
            const response: http.Response =
            {
                status: 200,
                body: JSON.stringify(result),
            };
            return response;
        }
        catch (error)
        {
            Console.warn("Encountered GraphQL error");
            const json =
            {
                data: null,
                errors: [{ message: error.message ? error.message : error }],
            };
            const response: http.Response =
            {
                status: 200,
                body: JSON.stringify(json),
            };
            return response;
        }
    }
    private renderPlayground(url: string)
    {
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql",
            subscriptionEndpoint: url,
        };
        this.playgroundHTML = playground.renderPlaygroundPage(playgroundOptions);
    }
    public async build(attributes: GraphQLBuildAttributes)
    {
        await this.buildSchema();
        this.renderPlayground(attributes.url);
    }
    public async respond(request: http.ServerRequest): Promise<void>
    {
        if (request.url !== "/graphql")
            throw new Error("Invalid request URL for GraphQL");
        try
        {
            switch (request.method)
            {
                case "GET":
                    await request.respond({ status: 200, body: this.playgroundHTML });
                    break;
                case "POST":
                    await request.respond(await this.query(request));
                    break;
                default:
                    throw new Error("Invalid HTTP method for GraphQL");
            }
        }
        catch (error) { Console.error(error); }
    }
}
