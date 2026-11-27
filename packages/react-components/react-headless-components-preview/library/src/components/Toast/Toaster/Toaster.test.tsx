import * as React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { useToastController } from '@fluentui/react-toast';
import { isConformant } from '../../../testing/isConformant';
import { Toaster } from './Toaster';

describe('Toaster', () => {
  isConformant({
    Component: Toaster,
    displayName: 'Toaster',
    disabledTests: [
      // Toaster is a wrapper that does not expose a single root element.
      'component-has-root-ref',
      'component-handles-ref',
      'component-handles-classname',
      'component-has-static-classnames-object',
      'make-styles-overrides-win',
      // Toaster is exported from `toast.ts` rather than top-level `toaster.ts`.
      'has-top-level-file-extra',
      'export-map-entry-exists',
    ],
  });

  it('mounts an aria-live region on document.body by default', () => {
    // AriaLiveAnnouncer attaches its live region directly to document.body
    // (not inside the Toaster's React tree) so a single shared region serves
    // the whole app. The DOM fallback path only renders an assertive region;
    // polite messages on browsers without `ariaNotify` are announced assertively.
    const { baseElement } = render(<Toaster />);

    expect(baseElement.querySelector('[aria-live="assertive"]')).not.toBeNull();
  });

  it('does not render position containers when there are no toasts', () => {
    const { container } = render(<Toaster />);

    expect(container.querySelector('[data-toaster-position]')).toBeNull();
  });

  it('does not mount its own live region when a custom `announce` prop is supplied', () => {
    const before = document.body.querySelectorAll('[aria-live]').length;

    render(<Toaster announce={jest.fn()} />);

    expect(document.body.querySelectorAll('[aria-live]').length).toBe(before);
  });

  it('uses list semantics with native block-axis focusgroup navigation', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const Test = () => {
      dispatchToast = useToastController().dispatchToast;
      return <Toaster />;
    };
    const { getByRole } = render(<Test />);

    act(() => {
      dispatchToast('toast', { timeout: -1 });
    });

    expect(getByRole('list')).toHaveAttribute('focusgroup', 'toolbar block itemcontrols');
  });

  it('limits the number of rendered toasts', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const toasterId = 'limited-toaster';
    const Test = () => {
      dispatchToast = useToastController(toasterId).dispatchToast;
      return <Toaster toasterId={toasterId} limit={1} />;
    };
    const { getAllByRole } = render(<Test />);

    act(() => {
      dispatchToast('first toast', { toastId: 'first', timeout: -1 });
      dispatchToast('second toast', { toastId: 'second', timeout: -1 });
    });

    const items = getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('first toast');
  });

  it('shows a queued toast after the visible one is dismissed', () => {
    let controller: ReturnType<typeof useToastController>;
    const toasterId = 'queue-toaster';
    const Test = () => {
      controller = useToastController(toasterId);
      return <Toaster toasterId={toasterId} limit={1} />;
    };
    const { getAllByRole } = render(<Test />);

    act(() => {
      controller.dispatchToast('first toast', { toastId: 'first', timeout: -1 });
      controller.dispatchToast('second toast', { toastId: 'second', timeout: -1 });
    });
    act(() => {
      controller.dismissToast('first');
    });

    const items = getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('second toast');
  });

  it('does not report dismissed for a queued toast', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const onStatusChange = jest.fn();
    const toasterId = 'queued-status-toaster';
    const Test = () => {
      dispatchToast = useToastController(toasterId).dispatchToast;
      return <Toaster toasterId={toasterId} limit={1} />;
    };
    render(<Test />);

    act(() => {
      dispatchToast('first toast', { toastId: 'first', timeout: -1 });
      dispatchToast('second toast', { toastId: 'second', timeout: -1, onStatusChange });
    });

    expect(onStatusChange).toHaveBeenCalledWith(null, expect.objectContaining({ status: 'queued' }));
    expect(onStatusChange).not.toHaveBeenCalledWith(null, expect.objectContaining({ status: 'dismissed' }));
  });

  it('reports dismissed once when a toast closes', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const onStatusChange = jest.fn();
    const toasterId = 'dismissed-once-toaster';
    const Test = () => {
      dispatchToast = useToastController(toasterId).dispatchToast;
      return <Toaster toasterId={toasterId} />;
    };
    const { getByRole } = render(<Test />);

    act(() => {
      dispatchToast('toast', { toastId: 'once', timeout: -1, onStatusChange });
    });
    act(() => {
      fireEvent.keyDown(getByRole('listitem'), { key: 'Delete' });
    });

    const dismissed = onStatusChange.mock.calls.filter(([, data]) => data?.status === 'dismissed');
    expect(dismissed).toHaveLength(1);
  });

  it('reports dismissed once when dismissed through the controller', () => {
    let controller: ReturnType<typeof useToastController>;
    const onStatusChange = jest.fn();
    const toasterId = 'dismissed-controller-toaster';
    const Test = () => {
      controller = useToastController(toasterId);
      return <Toaster toasterId={toasterId} />;
    };
    render(<Test />);

    act(() => {
      controller.dispatchToast('toast', { toastId: 'ctl', timeout: -1, onStatusChange });
    });
    act(() => {
      controller.dismissToast('ctl');
    });

    const dismissed = onStatusChange.mock.calls.filter(([, data]) => data?.status === 'dismissed');
    expect(dismissed).toHaveLength(1);
  });

  it('reports dismissed once when Escape closes the toasts', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const onStatusChange = jest.fn();
    const toasterId = 'dismissed-escape-toaster';
    const Test = () => {
      dispatchToast = useToastController(toasterId).dispatchToast;
      return <Toaster toasterId={toasterId} />;
    };
    const { getByRole } = render(<Test />);

    act(() => {
      dispatchToast('toast', { toastId: 'esc', timeout: -1, onStatusChange });
    });
    act(() => {
      fireEvent.keyDown(getByRole('listitem'), { key: 'Escape' });
    });

    const dismissed = onStatusChange.mock.calls.filter(([, data]) => data?.status === 'dismissed');
    expect(dismissed).toHaveLength(1);
  });

  it('does not start the countdown of a queued toast until it is shown', () => {
    // jsdom has no Web Animations API, which backs the toast countdown; record play() calls instead.
    const timeouts: number[] = [];
    const playedTimeouts: number[] = [];
    class FakeKeyframeEffect {
      constructor(_target: unknown, _keyframes: unknown, public timeout: number) {}
    }
    class FakeAnimation {
      public onfinish: (() => void) | null = null;
      private timeout: number;
      constructor(effect: FakeKeyframeEffect) {
        this.timeout = effect.timeout;
        timeouts.push(effect.timeout);
      }
      public play() {
        playedTimeouts.push(this.timeout);
      }
      public pause() {
        /* noop */
      }
      public cancel() {
        /* noop */
      }
    }
    const win = window as unknown as Record<string, unknown>;
    const original = { Animation: win.Animation, KeyframeEffect: win.KeyframeEffect };
    win.Animation = FakeAnimation;
    win.KeyframeEffect = FakeKeyframeEffect;

    try {
      let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
      let dismissToast: ReturnType<typeof useToastController>['dismissToast'];
      const toasterId = 'queued-timer-toaster';
      const Test = () => {
        ({ dispatchToast, dismissToast } = useToastController(toasterId));
        return <Toaster toasterId={toasterId} limit={1} />;
      };
      render(<Test />);

      act(() => {
        dispatchToast('first toast', { toastId: 'first', timeout: 5000 });
        dispatchToast('second toast', { toastId: 'second', timeout: 1000 });
      });

      // A toast that holds focus pauses the countdown; release it so the visible toast can run.
      act(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });

      expect(timeouts).toEqual(expect.arrayContaining([5000, 1000]));
      expect(playedTimeouts).toContain(5000);
      expect(playedTimeouts).not.toContain(1000);

      act(() => {
        dismissToast('first');
      });

      expect(playedTimeouts).toContain(1000);
    } finally {
      win.Animation = original.Animation;
      win.KeyframeEffect = original.KeyframeEffect;
    }
  });

  it('does not forward toaster options to toast container elements', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const toasterId = 'options-toaster';
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const Test = () => {
        dispatchToast = useToastController(toasterId).dispatchToast;
        return <Toaster toasterId={toasterId} limit={1} shortcuts={{ focus: () => false }} />;
      };
      const { getByRole } = render(<Test />);

      act(() => {
        dispatchToast('toast', { toastId: 'options-toast', timeout: -1 });
      });

      const toast = getByRole('listitem');
      expect(toast).not.toHaveAttribute('limit');
      expect(toast).not.toHaveAttribute('shortcuts');
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it('forwards default toast options to toast state', () => {
    let dispatchToast: ReturnType<typeof useToastController>['dispatchToast'];
    const onStatusChange = jest.fn();
    const toasterId = 'default-options-toaster';
    const Test = () => {
      dispatchToast = useToastController(toasterId).dispatchToast;
      return (
        <Toaster
          toasterId={toasterId}
          position="top"
          timeout={1000}
          pauseOnWindowBlur
          pauseOnHover={false}
          priority={1}
          offset={{ horizontal: 10 }}
        />
      );
    };
    render(<Test />);

    act(() => {
      dispatchToast('toast with defaults', { toastId: 'defaults', onStatusChange });
    });

    expect(onStatusChange).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        position: 'top',
        timeout: 1000,
        pauseOnWindowBlur: true,
        pauseOnHover: false,
        priority: 1,
      }),
    );
    expect(onStatusChange.mock.calls[0][1]).not.toHaveProperty('offset');
  });
});
