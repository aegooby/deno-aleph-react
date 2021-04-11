
export function tag(strings: TemplateStringsArray): string
{
    function reducer(previous: string, current: string, _1: number, _2: readonly string[]): string
    {
        return previous.concat(current);
    }
    return strings.reduce(reducer);
}