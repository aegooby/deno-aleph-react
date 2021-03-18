
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
    public static methods: string[] = ["POST", "GET"];
    public static schema:
        {
            schema: graphql.GraphQLSchema;
            path: string;
        } = { schema: new graphql.GraphQLSchema({}), path: "" };
    public static resolvers: unknown;
    private static playgroundHTML: string;
    private static async buildSchema()
    {
        const schema = await Deno.readTextFile(GraphQL.schema.path);
        GraphQL.schema.schema = graphql.buildSchema(schema);
    }
    private static async query(request: http.ServerRequest): Promise<http.Response>
    {
        try
        {
            const decoder = new TextDecoder();
            const body: string = decoder.decode(await Deno.readAll(request.body));
            const query:
                {
                    query: string;
                    operationName?: string;
                    variables?: { [key: string]: unknown; };
                } = { query: "" };
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
                schema: GraphQL.schema.schema,
                source: query.query,
                rootValue: GraphQL.resolvers,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphqlargs);
            const response: http.Response =
            {
                status: http.Status.OK,
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
                status: http.Status.OK,
                body: JSON.stringify(json),
            };
            return response;
        }
    }
    private static renderPlayground(url: string)
    {
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql",
            subscriptionEndpoint: url,
        };
        GraphQL.playgroundHTML = playground.renderPlaygroundPage(playgroundOptions);
    }
    public static async build(attributes: GraphQLBuildAttributes)
    {
        await GraphQL.buildSchema();
        GraphQL.renderPlayground(attributes.url);
    }
    public static async resolve(request: http.ServerRequest): Promise<http.Response>
    {
        if (request.url !== "/graphql")
            throw new Error("Invalid request URL for GraphQL");
        switch (request.method)
        {
            case "GET":
                return { status: http.Status.OK, body: GraphQL.playgroundHTML };
            case "POST":
                return await GraphQL.query(request);
            default:
                throw new Error("Invalid HTTP method for GraphQL");
        }
    }
}
