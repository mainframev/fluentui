import { renderHook } from '@testing-library/react';
import { usePlacementObserver } from './usePlacementObserver';

type Entry = { target: Element; width: number; height: number };

let instances: FakeRO[] = [];

class FakeRO {
  public observed: Element[] = [];
  public disconnect = jest.fn();
  constructor(public callback: (entries: unknown[]) => void) {
    instances.push(this);
  }
  public observe(el: Element) {
    this.observed.push(el);
  }
  public unobserve() {
    /* noop */
  }
}

function emit(entries: Entry[]) {
  const ro = instances[instances.length - 1];
  ro.callback(entries.map(({ target, width, height }) => ({ target, contentRect: { width, height } })));
}

function makeRect(rect: Partial<DOMRect>): DOMRect {
  const { top = 0, left = 0, width = 0, height = 0 } = rect;
  return {
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('usePlacementObserver', () => {
  const originalRO = window.ResizeObserver;
  let addSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;
  let container: HTMLElement;
  let target: HTMLElement;

  const calledWith = (spy: jest.SpyInstance, type: string) => spy.mock.calls.some(call => call[0] === type);

  beforeEach(() => {
    instances = [];
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeRO;
    addSpy = jest.spyOn(window, 'addEventListener');
    removeSpy = jest.spyOn(window, 'removeEventListener');
    container = document.createElement('div');
    target = document.createElement('div');
  });

  afterEach(() => {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = originalRO;
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  const showBelow = () => {
    target.getBoundingClientRect = () => makeRect({ top: 100, left: 100, width: 100, height: 40 });
    container.getBoundingClientRect = () => makeRect({ top: 140, left: 100, width: 100, height: 50 });
  };

  it('attaches no window listeners while hidden', () => {
    renderHook(() => usePlacementObserver(container, target, document));
    emit([{ target: container, width: 0, height: 0 }]);

    expect(calledWith(addSpy, 'scroll')).toBe(false);
    expect(calledWith(addSpy, 'resize')).toBe(false);
  });

  it('attaches listeners and updates placement when shown', async () => {
    renderHook(() => usePlacementObserver(container, target, document));
    emit([{ target: container, width: 0, height: 0 }]);

    showBelow();
    emit([{ target: container, width: 100, height: 50 }]);
    await Promise.resolve();

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.objectContaining({ capture: true }));
    expect(calledWith(addSpy, 'resize')).toBe(true);
    expect(container.getAttribute('data-placement')).toMatch(/^below/);
  });

  it('removes listeners when hidden again', () => {
    renderHook(() => usePlacementObserver(container, target, document));
    showBelow();
    emit([{ target: container, width: 100, height: 50 }]);
    expect(calledWith(removeSpy, 'scroll')).toBe(false);

    emit([{ target: container, width: 0, height: 0 }]);

    expect(calledWith(removeSpy, 'scroll')).toBe(true);
    expect(calledWith(removeSpy, 'resize')).toBe(true);
  });

  it('never overwrites a correct placement while hidden', async () => {
    renderHook(() => usePlacementObserver(container, target, document));
    container.setAttribute('data-placement', 'below-start');
    container.getBoundingClientRect = () => makeRect({});
    target.getBoundingClientRect = () => makeRect({});

    emit([{ target: container, width: 0, height: 0 }]);
    await Promise.resolve();

    expect(container.getAttribute('data-placement')).toBe('below-start');
  });

  it('falls back to immediate listeners without ResizeObserver', () => {
    delete (window as unknown as { ResizeObserver?: unknown }).ResizeObserver;

    renderHook(() => usePlacementObserver(container, target, document));

    expect(calledWith(addSpy, 'scroll')).toBe(true);
  });

  it('removes everything on unmount', () => {
    const { unmount } = renderHook(() => usePlacementObserver(container, target, document));
    showBelow();
    emit([{ target: container, width: 100, height: 50 }]);

    unmount();

    expect(calledWith(removeSpy, 'scroll')).toBe(true);
    expect(calledWith(removeSpy, 'resize')).toBe(true);
    expect(instances[0].disconnect).toHaveBeenCalled();
  });
});
