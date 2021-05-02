
import * as async from "@std/async";

import * as Oak from "oak";
import * as graphql from "graphql";
import * as playground from "graphql-playground";

import { Console } from "./console.tsx";
import type { Query } from "../components/Core/GraphQL/GraphQL.tsx";

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
    private schema:
        {
            schema: graphql.GraphQLSchema | undefined;
            path: string;
        } = { schema: undefined, path: "" };
    private resolvers: unknown;
    private playgroundHTML: async.Deferred<string> = async.deferred();
    constructor(attributes: GraphQLAttributes)
    {
        this.schema.path = attributes.schema;
        this.resolvers = attributes.resolvers;

        this.buildSchema = this.buildSchema.bind(this);
        this.renderPlayground = this.renderPlayground.bind(this);
        this.build = this.build.bind(this);

        this.post = this.post.bind(this);
        this.get = this.get.bind(this);
        this.head = this.head.bind(this);
    }
    private async buildSchema(): Promise<void>
    {
        const schema = await Deno.readTextFile(this.schema.path);
        this.schema.schema = graphql.buildSchema(schema);
    }
    private renderPlayground(url: string): void
    {
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql",
            subscriptionEndpoint: url,
            settings:
            {
                "editor.cursorShape": "line",
                "editor.fontSize": 18,
                "editor.fontFamily": "'Menlo', monospace",
                "editor.reuseHeaders": true,
                "editor.theme": "dark",
                "general.betaUpdates": true,
                "request.credentials": "omit",
                "request.globalHeaders": {},
                "schema.polling.enable": true,
                "schema.polling.endpointFilter": "*localhost",
                "schema.polling.interval": 2000,
                "tracing.hideTracingResponse": true,
                "tracing.tracingSupported": true,
            }
        };
        this.playgroundHTML.resolve(playground.renderPlaygroundPage(playgroundOptions));
    }
    public async build(attributes: GraphQLBuildAttributes)
    {
        await this.buildSchema();
        this.renderPlayground(attributes.url);
    }
    public async post(context: Oak.Context): Promise<void>
    {
        try
        {
            const query: Query = { query: "" };
            switch (context.request.headers.get("content-type"))
            {
                case "application/json":
                    {
                        const jsonRequest = await context.request.body({ type: "json" }).value;
                        query.query = jsonRequest.query;
                        query.operationName = jsonRequest.operationName;
                        query.variables = jsonRequest.variables;
                        break;
                    }
                case "application/graphql":
                    {
                        const textRequest = await context.request.body({ type: "text" }).value;
                        query.query = textRequest;
                        break;
                    }
                default:
                    throw new Error("Invalid GraphQL MIME type");
            }
            const graphqlargs: graphql.GraphQLArgs =
            {
                schema: this.schema.schema as graphql.GraphQLSchema,
                source: query.query,
                rootValue: this.resolvers,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphqlargs);

            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(result);
        }
        catch (error)
        {
            if (!(error instanceof Deno.errors.Http))
                Console.warn(error);
            const jsonError =
            {
                data: null,
                errors: [{ message: error.message ? error.message : error }],
            };
            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(jsonError);
        }
    }
    public async get(context: Oak.Context): Promise<void>
    {
        context.response.status = Oak.Status.OK;
        context.response.body = await this.playgroundHTML;
    }
    public async head(context: Oak.Context): Promise<void>
    {
        await this.get(context);
        context.response.status = Oak.Status.MethodNotAllowed;
        context.response.body = undefined;
    }
}
