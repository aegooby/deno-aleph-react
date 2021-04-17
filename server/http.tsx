
import { NativeRequest, NativeResponse } from "./fetch.tsx";

type BufferSource = ArrayBufferView | ArrayBuffer;
type BodyInit =
    | Blob
    | BufferSource
    | FormData
    | URLSearchParams
    | ReadableStream<Uint8Array>
    | string
    | null;

type RequestCache =
    | "default"
    | "force-cache"
    | "no-cache"
    | "no-store"
    | "only-if-cached"
    | "reload";
type RequestCredentials = "include" | "omit" | "same-origin";
type RequestMode = "cors" | "navigate" | "no-cors" | "same-origin";
type RequestRedirect = "error" | "follow" | "manual";
type ReferrerPolicy =
    | ""
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
export interface RequestAttributes
{
    input: string;
    method: string;
    headers: HeadersInit;
    body: BodyInit | null;
    cache?: RequestCache | undefined;
    credentials?: RequestCredentials | undefined;
    integrity?: string | undefined;
    keepalive?: boolean | undefined;
    mode?: RequestMode | undefined;
    redirect?: RequestRedirect | undefined;
    referrer?: string | undefined;
    referrerPolicy?: ReferrerPolicy | undefined;
    signal?: AbortSignal | null | undefined;
}

export class Request
{
    public url: string;

    private __native: NativeRequest;

    private constructor(request: NativeRequest)
    {
        this.url = request.url;

        this.__native = request;

        const length = this.headers.get("content-length");
        if (length)
        {
            const array = length.split(",");
            if (array.length > 1)
            {
                const distinct = [...new Set(array.map(function (entry) { return entry.trim(); }))];
                if (distinct.length > 1)
                    throw Error("http: cannot contain multiple Content-Length headers");
                else
                    this.headers.set("content-length", distinct[0]);
            }
            const __length = this.headers.get("content-length");
            if (this.__native.method === "HEAD" && __length && __length !== "0")
                throw Error("http: method cannot contain a Content-Length");

            /* A sender MUST NOT send a Content-Length header field in any  */
            /* message that contains a Transfer-Encoding header field.      */
            /* rfc: https://tools.ietf.org/html/rfc7230#section-3.3.2       */
            if (__length && this.headers.has("transfer-encoding"))
                throw new Error("http: Transfer-Encoding and Content-Length are both set");
        }
    }
    public static $($_: NativeRequest | RequestAttributes): Request
    {
        if (($_ as NativeRequest).url)
        {
            const request = $_ as NativeRequest;
            return new Request(request);
        }
        else
        {
            const attributes = $_ as RequestAttributes;
            return new Request(new NativeRequest(attributes.input, attributes));
        }
    }

    public get headers()
    {
        return this.__native.headers;
    }
    public get body()
    {
        return this.__native.body;
    }
    public get method()
    {
        return this.__native.method;
    }
    public get native()
    {
        if (this.__native.url !== this.url)
        {
            const attributes: RequestAttributes =
            {
                input: this.url,
                method: this.__native.method,
                headers: this.headers,
                body: this.body,
                cache: this.__native.cache,
                credentials: this.__native.credentials,
                integrity: this.__native.integrity,
                keepalive: this.__native.keepalive,
                mode: this.__native.mode,
                redirect: this.__native.redirect,
                referrer: this.__native.referrer,
                referrerPolicy: this.__native.referrerPolicy,
                signal: this.__native.signal,
            };
            this.__native = new NativeRequest(attributes.input, attributes);
        }
        return this.__native;
    }
}

type HeadersInit = Headers | string[][] | Record<string, string>;
export interface ResponseAttributes
{
    status: number;
    headers: HeadersInit;
    body: BodyInit;
    statusText: string | undefined;
}

export class Response
{
    public status: Status;

    private __native: NativeResponse;

    private constructor(response: NativeResponse)
    {
        this.status = response.status;

        this.__native = response;

        if (this.__native.body && !this.headers.get("content-length"))
            this.headers.set("transfer-encoding", "chunked");
    }
    public static $($_: NativeResponse | ResponseAttributes): Response
    {
        if (($_ as NativeResponse).url)
        {
            const response = $_ as NativeResponse;
            return new Response(response);
        }
        else
        {
            const attributes = $_ as ResponseAttributes;
            if (!attributes.statusText)
                attributes.statusText = StatusText.get(attributes.status);
            return new Response(new NativeResponse(attributes.body, attributes));
        }
    }

    public get headers()
    {
        return this.__native.headers;
    }
    public get body()
    {
        return this.__native.body;
    }
    public get native()
    {
        if (this.__native.status !== this.status)
        {
            const attributes: ResponseAttributes =
            {
                status: this.status,
                headers: this.headers,
                body: this.body,
                statusText: StatusText.get(this.status)
            };
            this.__native = new NativeResponse(attributes.body, attributes);
        }
        return this.__native;
    }
}

export enum Status
{
    /** RFC 7231, 6.2.1 */
    Continue = 100,
    /** RFC 7231, 6.2.2 */
    SwitchingProtocols = 101,
    /** RFC 2518, 10.1 */
    Processing = 102,
    /** RFC 8297 **/
    EarlyHints = 103,
    /** RFC 7231, 6.3.1 */
    OK = 200,
    /** RFC 7231, 6.3.2 */
    Created = 201,
    /** RFC 7231, 6.3.3 */
    Accepted = 202,
    /** RFC 7231, 6.3.4 */
    NonAuthoritativeInfo = 203,
    /** RFC 7231, 6.3.5 */
    NoContent = 204,
    /** RFC 7231, 6.3.6 */
    ResetContent = 205,
    /** RFC 7233, 4.1 */
    PartialContent = 206,
    /** RFC 4918, 11.1 */
    MultiStatus = 207,
    /** RFC 5842, 7.1 */
    AlreadyReported = 208,
    /** RFC 3229, 10.4.1 */
    IMUsed = 226,

    /** RFC 7231, 6.4.1 */
    MultipleChoices = 300,
    /** RFC 7231, 6.4.2 */
    MovedPermanently = 301,
    /** RFC 7231, 6.4.3 */
    Found = 302,
    /** RFC 7231, 6.4.4 */
    SeeOther = 303,
    /** RFC 7232, 4.1 */
    NotModified = 304,
    /** RFC 7231, 6.4.5 */
    UseProxy = 305,
    /** RFC 7231, 6.4.7 */
    TemporaryRedirect = 307,
    /** RFC 7538, 3 */
    PermanentRedirect = 308,

    /** RFC 7231, 6.5.1 */
    BadRequest = 400,
    /** RFC 7235, 3.1 */
    Unauthorized = 401,
    /** RFC 7231, 6.5.2 */
    PaymentRequired = 402,
    /** RFC 7231, 6.5.3 */
    Forbidden = 403,
    /** RFC 7231, 6.5.4 */
    NotFound = 404,
    /** RFC 7231, 6.5.5 */
    MethodNotAllowed = 405,
    /** RFC 7231, 6.5.6 */
    NotAcceptable = 406,
    /** RFC 7235, 3.2 */
    ProxyAuthRequired = 407,
    /** RFC 7231, 6.5.7 */
    RequestTimeout = 408,
    /** RFC 7231, 6.5.8 */
    Conflict = 409,
    /** RFC 7231, 6.5.9 */
    Gone = 410,
    /** RFC 7231, 6.5.10 */
    LengthRequired = 411,
    /** RFC 7232, 4.2 */
    PreconditionFailed = 412,
    /** RFC 7231, 6.5.11 */
    RequestEntityTooLarge = 413,
    /** RFC 7231, 6.5.12 */
    RequestURITooLong = 414,
    /** RFC 7231, 6.5.13 */
    UnsupportedMediaType = 415,
    /** RFC 7233, 4.4 */
    RequestedRangeNotSatisfiable = 416,
    /** RFC 7231, 6.5.14 */
    ExpectationFailed = 417,
    /** RFC 7168, 2.3.3 */
    Teapot = 418,
    /** RFC 7540, 9.1.2 */
    MisdirectedRequest = 421,
    /** RFC 4918, 11.2 */
    UnprocessableEntity = 422,
    /** RFC 4918, 11.3 */
    Locked = 423,
    /** RFC 4918, 11.4 */
    FailedDependency = 424,
    /** RFC 8470, 5.2 */
    TooEarly = 425,
    /** RFC 7231, 6.5.15 */
    UpgradeRequired = 426,
    /** RFC 6585, 3 */
    PreconditionRequired = 428,
    /** RFC 6585, 4 */
    TooManyRequests = 429,
    /** RFC 6585, 5 */
    RequestHeaderFieldsTooLarge = 431,
    /** RFC 7725, 3 */
    UnavailableForLegalReasons = 451,

    /** RFC 7231, 6.6.1 */
    InternalServerError = 500,
    /** RFC 7231, 6.6.2 */
    NotImplemented = 501,
    /** RFC 7231, 6.6.3 */
    BadGateway = 502,
    /** RFC 7231, 6.6.4 */
    ServiceUnavailable = 503,
    /** RFC 7231, 6.6.5 */
    GatewayTimeout = 504,
    /** RFC 7231, 6.6.6 */
    HTTPVersionNotSupported = 505,
    /** RFC 2295, 8.1 */
    VariantAlsoNegotiates = 506,
    /** RFC 4918, 11.5 */
    InsufficientStorage = 507,
    /** RFC 5842, 7.2 */
    LoopDetected = 508,
    /** RFC 2774, 7 */
    NotExtended = 510,
    /** RFC 6585, 6 */
    NetworkAuthenticationRequired = 511,
}

const StatusTextEntries: [Status, string][] =
    [
        [Status.Continue, "Continue"],
        [Status.SwitchingProtocols, "Switching Protocols"],
        [Status.Processing, "Processing"],
        [Status.EarlyHints, "Early Hints"],
        [Status.OK, "OK"],
        [Status.Created, "Created"],
        [Status.Accepted, "Accepted"],
        [Status.NonAuthoritativeInfo, "Non-Authoritative Information"],
        [Status.NoContent, "No Content"],
        [Status.ResetContent, "Reset Content"],
        [Status.PartialContent, "Partial Content"],
        [Status.MultiStatus, "Multi-Status"],
        [Status.AlreadyReported, "Already Reported"],
        [Status.IMUsed, "IM Used"],
        [Status.MultipleChoices, "Multiple Choices"],
        [Status.MovedPermanently, "Moved Permanently"],
        [Status.Found, "Found"],
        [Status.SeeOther, "See Other"],
        [Status.NotModified, "Not Modified"],
        [Status.UseProxy, "Use Proxy"],
        [Status.TemporaryRedirect, "Temporary Redirect"],
        [Status.PermanentRedirect, "Permanent Redirect"],
        [Status.BadRequest, "Bad Request"],
        [Status.Unauthorized, "Unauthorized"],
        [Status.PaymentRequired, "Payment Required"],
        [Status.Forbidden, "Forbidden"],
        [Status.NotFound, "Not Found"],
        [Status.MethodNotAllowed, "Method Not Allowed"],
        [Status.NotAcceptable, "Not Acceptable"],
        [Status.ProxyAuthRequired, "Proxy Authentication Required"],
        [Status.RequestTimeout, "Request Timeout"],
        [Status.Conflict, "Conflict"],
        [Status.Gone, "Gone"],
        [Status.LengthRequired, "Length Required"],
        [Status.PreconditionFailed, "Precondition Failed"],
        [Status.RequestEntityTooLarge, "Request Entity Too Large"],
        [Status.RequestURITooLong, "Request URI Too Long"],
        [Status.UnsupportedMediaType, "Unsupported Media Type"],
        [Status.RequestedRangeNotSatisfiable, "Requested Range Not Satisfiable"],
        [Status.ExpectationFailed, "Expectation Failed"],
        [Status.Teapot, "I'm a teapot"],
        [Status.MisdirectedRequest, "Misdirected Request"],
        [Status.UnprocessableEntity, "Unprocessable Entity"],
        [Status.Locked, "Locked"],
        [Status.FailedDependency, "Failed Dependency"],
        [Status.TooEarly, "Too Early"],
        [Status.UpgradeRequired, "Upgrade Required"],
        [Status.PreconditionRequired, "Precondition Required"],
        [Status.TooManyRequests, "Too Many Requests"],
        [Status.RequestHeaderFieldsTooLarge, "Request Header Fields Too Large"],
        [Status.UnavailableForLegalReasons, "Unavailable For Legal Reasons"],
        [Status.InternalServerError, "Internal Server Error"],
        [Status.NotImplemented, "Not Implemented"],
        [Status.BadGateway, "Bad Gateway"],
        [Status.ServiceUnavailable, "Service Unavailable"],
        [Status.GatewayTimeout, "Gateway Timeout"],
        [Status.HTTPVersionNotSupported, "HTTP Version Not Supported"],
        [Status.VariantAlsoNegotiates, "Variant Also Negotiates"],
        [Status.InsufficientStorage, "Insufficient Storage"],
        [Status.LoopDetected, "Loop Detected"],
        [Status.NotExtended, "Not Extended"],
        [Status.NetworkAuthenticationRequired, "Network Authentication Required"],
    ];

export const StatusText = new Map<Status, string>(StatusTextEntries);