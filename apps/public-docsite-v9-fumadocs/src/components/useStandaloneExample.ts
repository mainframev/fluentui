import * as React from 'react';
import { useSearchParams } from 'react-router';

export const StandaloneExampleContext = React.createContext<string | undefined>(undefined);

const subscribe = () => () => {
  // Hydration has no external subscription to clean up.
};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function useStandaloneExample() {
  const [params] = useSearchParams();
  const hydrated = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { example: hydrated ? params.get('example') : null, params };
}
