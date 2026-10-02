import { useEffect, useState, type DependencyList } from "react";

type AsyncState<T> = { data: T | null; error: string | null; loading: boolean };

/**
 * Run an async loader whenever `deps` change, exposing loading / error / data and
 * a `reload`. `fn` is intentionally not in the dependency list — `deps` names the
 * real inputs, so a fresh closure each render does not cause a refetch loop.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((d) => {
        if (active) setState({ data: d, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (active) setState({ data: null, error: e instanceof Error ? e.message : "Something went wrong.", loading: false });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
