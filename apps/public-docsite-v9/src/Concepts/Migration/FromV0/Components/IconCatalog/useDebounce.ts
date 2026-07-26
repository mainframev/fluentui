import * as React from 'react';

export const useDebounce = <TArgs extends unknown[]>(fn: (...args: TArgs) => void, duration: number) => {
  const timeoutRef = React.useRef(0);

  return React.useCallback(
    (...args: TArgs) => {
      // eslint-disable-next-line @nx/workspace-no-restricted-globals
      window.clearTimeout(timeoutRef.current);
      // eslint-disable-next-line @nx/workspace-no-restricted-globals
      timeoutRef.current = window.setTimeout(() => {
        fn(...args);
      }, duration);
    },
    [duration, fn],
  );
};
