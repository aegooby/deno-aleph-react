
import * as async from "@std/async";

import * as Oak from "oak";
import * as graphql from "graphql";
import * as playground from "graphql-playground";

import { Console } from "./console.tsx";
import type { Query } from "../components/Core/GraphQL/GraphQL.tsx";

interface GraphQLAttributes
{
    customSchema: string;
    dbSchema: string;
    resolvers: unknown;
}
interface GraphQLBuildAttributes
{
    url: string;
}
interface GraphQLCustomSchema
{
    schema: graphql.GraphQLSchema | undefined;
    path: string;
}

export class GraphQL
{
    private customSchema: GraphQLCustomSchema = { schema: undefined, path: "" };
    private dbSchema: string = "" as const;
    private resolvers: unknown;
    private customPlayground: async.Deferred<string> = async.deferred();
    private dbPlayground: async.Deferred<string> = async.deferred();

    constructor(attributes: GraphQLAttributes)
    {
        this.customSchema.path = attributes.customSchema;
        this.dbSchema = attributes.dbSchema;
        this.resolvers = attributes.resolvers;

        this.buildSchema = this.buildSchema.bind(this);
        this.renderPlayground = this.renderPlayground.bind(this);
        this.build = this.build.bind(this);

        this.customPost = this.customPost.bind(this);
        this.customGet = this.customGet.bind(this);
        this.customHead = this.customHead.bind(this);

        this.dbPost = this.dbPost.bind(this);
        this.dbGet = this.dbGet.bind(this);
        this.dbHead = this.dbHead.bind(this);
    }
    private async buildSchema(): Promise<void>
    {
        const customSchema = await Deno.readTextFile(this.customSchema.path);
        this.customSchema.schema = graphql.buildSchema(customSchema);

        const dbSchema = await Deno.readFile(this.dbSchema);
        const requestInit: RequestInit =
        {
            body: dbSchema,
            method: "POST",
            headers: { "content-length": dbSchema.byteLength.toString(), "content-type": "multipart/form-data" }
        };
        while (true)
        {
            try 
            {
                const response = await fetch("http://localhost:8080/admin/schema", requestInit);
                if (response.ok && response.body)
                {
                    let body = "";
                    const decoder = new TextDecoder();
                    for await (const bytes of response.body)
                        body += decoder.decode(bytes);
                    const json = JSON.parse(body);
                    if (!json.errors)
                        break;
                }
            }
            catch { undefined; }
            await async.delay(500);
        }
    }
    private renderPlayground(url: string): void
    {
        const customPlaygroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql/custom",
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
        const dbPlaygroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql/db",
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
        this.customPlayground.resolve(playground.renderPlaygroundPage(customPlaygroundOptions));
        this.dbPlayground.resolve(playground.renderPlaygroundPage(dbPlaygroundOptions));
    }
    public async build(attributes: GraphQLBuildAttributes)
    {
        await this.buildSchema();
        this.renderPlayground(attributes.url);
    }
    public async customPost(context: Oak.Context): Promise<void>
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
                schema: this.customSchema.schema as graphql.GraphQLSchema,
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
    public async customGet(context: Oak.Context): Promise<void>
    {
        context.response.status = Oak.Status.OK;
        context.response.body = await this.customPlayground;
    }
    public async customHead(context: Oak.Context): Promise<void>
    {
        await this.customGet(context);
        context.response.status = Oak.Status.MethodNotAllowed;
        context.response.body = undefined;
    }
    public async dbPost(context: Oak.Context): Promise<void>
    {
        const request = context.request.originalRequest as Oak.NativeRequest;
        const requestInit: RequestInit =
        {
            body: request.body,
            method: request.method,
            headers: request.headers,
        };
        const response = await fetch("http://localhost:8080/graphql", requestInit);
        context.response.body = response.body;
        context.response.headers = response.headers;
    }

    public async dbGet(context: Oak.Context): Promise<void>
    {
        context.response.status = Oak.Status.OK;
        context.response.body = await this.dbPlayground;
    }
    public async dbHead(context: Oak.Context): Promise<void>
    {
        await this.dbGet(context);
        context.response.status = Oak.Status.MethodNotAllowed;
        context.response.body = undefined;
    }






}
