
import * as React from "react";

export default function useCounter(): [number, boolean, () => void, () => void] 
{
    const [count, setCount] = React.useState(0);
    const [isSyncing, setIsSyncing] = React.useState(true);
    const increase = React.useCallback(() => 
    {
        setCount(n => n + 1);
        fetch("/api/counter/increase").catch(e => console.error(e));
    }, []);
    const decrease = React.useCallback(() => 
    {
        setCount(n => n - 1);
        fetch("/api/counter/decrease").catch(e => console.error(e));
    }, []);

    React.useEffect(() => 
    {
        fetch("/api/counter").then(resp => resp.json().catch(() => ({})))
            .then(({ count }) => 
            {
                if (typeof count === "number" && !Number.isNaN(count))
                    setCount(count);
            })
            .catch(e => console.error(e))
            .finally(() => { setIsSyncing(false); });
    }, []);

    return [count, isSyncing, increase, decrease];
}
