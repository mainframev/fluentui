# RFC: Pointer Interactions

---

@anthropic-assistant

## Contributors

- _Add contributors here_

## Stakeholders

- Fluent UI React v9 consumers
- Component authors
- Accessibility team

## Timeline

- **Authored:** January 2026
- **Feedback deadline:** _TBD_

---

## Summary

This RFC proposes adding interaction hooks to `@fluentui/react-utilities` for handling pointer interactions in a modality-aware way. The primary goal is to solve the "sticky hover" problem on touch devices while providing a comprehensive, semantically correct interaction model across mouse, touch, pen, and keyboard inputs.

The solution is inspired by and based on React Aria's `@react-aria/interactions` package, which has proven effective in production at scale.

## Background

### The Sticky Hover Problem

On touch devices, tapping an element triggers the following browser event sequence:

```
touchstart → touchend → mouseover → mouseenter → mousemove → mousedown → mouseup → click
```

The emulated `mouseenter` event causes CSS `:hover` styles to activate and **persist** until the user taps elsewhere. This creates a poor user experience where buttons appear "stuck" in their hover state after being tapped.

### Current State in Fluent UI v9

Fluent UI v9 components use CSS `:hover` pseudo-selectors extensively. For example, `Button` has 80+ hover-related style rules in `useButtonStyles.styles.ts`:

```ts
// Current approach - problematic on touch devices
':hover': {
  backgroundColor: tokens.colorNeutralBackground1Hover,
  borderColor: tokens.colorNeutralStroke1Hover,
  color: tokens.colorNeutralForeground1Hover,
},
```

### How React Aria Solves This

React Aria's `@react-aria/interactions` package provides hooks that:

1. **Separate hover from press semantically** - Hover is mouse/pen-specific; press is universal
2. **Use `pointerType` to distinguish input modalities** - `'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual'`
3. **Ignore emulated mouse events after touch** - Uses a global flag with 50ms timeout
4. **Handle browser quirks** - iOS double pointerEnter, Safari scroll issues, etc.

Key insight: **Touch devices don't have a hover concept.** Your finger is either touching or not - there's no "floating over" state. React Aria correctly models this by never firing hover events for touch interactions.

### References

- [React Aria: Building a Button Part 2](https://react-spectrum.adobe.com/blog/building-a-button-part-2.html) - Detailed explanation of the problem and solution
- [React Aria useHover source](https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/interactions/src/useHover.ts)
- [React Aria usePress source](https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/interactions/src/usePress.ts)

## Problem Statement

1. **Sticky hover on touch devices** - CSS `:hover` persists after tap, causing visual bugs
2. **No semantic distinction between hover and press** - Components conflate preview (hover) with activation (press)
3. **Inconsistent behavior across input types** - Mouse, touch, pen, and keyboard handled differently
4. **No unified interaction modality tracking** - Hard to implement focus-visible correctly

These issues affect all interactive components: Button, Link, Input, Checkbox, Radio, Switch, Tab, MenuItem, Slider, and more.

## Detailed Design or Proposal

### Location in react-utilities

Add interaction hooks to `@fluentui/react-utilities` under the `hooks` directory:

```
@fluentui/react-utilities
└── src/
    └── hooks/
        ├── index.ts
        ├── useHover.ts          # Mouse/pen hover only (excludes touch)
        └── ... (other hooks)
```

**Note:** The hook is exported as `useHover_unstable` to indicate its experimental status.

### Opt-in via FluentProvider

The new behavior will be **opt-in** via a feature flag on `FluentProvider`:

```tsx
import { FluentProvider } from '@fluentui/react-components';

function App() {
  return (
    // Opt-in to pointer-aware interactions
    <FluentProvider UNSTABLE_usePointerHover>
      <Button>Touch-safe hover behavior</Button>
    </FluentProvider>
  );
}
```

When the flag is enabled:

- Components use `useHover` and `usePress` hooks
- Hover only fires for mouse/pen, never touch
- Components render `data-hovered` and `data-pressed` attributes
- Styles target data attributes instead of `:hover`

When the flag is disabled (default):

- Current CSS `:hover` behavior is preserved
- No breaking changes for existing consumers

### Hook APIs

#### `useHover_unstable`

```ts
/**
 * The type of pointer that triggered the hover event.
 * Touch is intentionally excluded as hover is not a valid interaction for touch devices.
 */
export type PointerType = 'mouse' | 'pen';

/**
 * Event object passed to hover event handlers.
 */
export interface HoverEvent {
  /** The type of hover event. */
  type: 'hoverstart' | 'hoverend';
  /** The pointer type that triggered the event. */
  pointerType: PointerType;
  /** The target element. */
  target: HTMLElement;
}

/**
 * Props for the useHover hook.
 */
export interface HoverProps {
  /** Whether hover events should be disabled. */
  isDisabled?: boolean;
  /** Handler called when a hover interaction starts. */
  onHoverStart?: (e: HoverEvent) => void;
  /** Handler called when a hover interaction ends. */
  onHoverEnd?: (e: HoverEvent) => void;
  /** Handler called when the hover state changes. */
  onHoverChange?: (isHovered: boolean) => void;
}

/**
 * Result returned by the useHover hook.
 */
export interface HoverResult {
  /** Props to spread on the target element. */
  hoverProps: React.DOMAttributes<HTMLElement>;
  /** Whether the element is currently hovered. */
  isHovered: boolean;
}

function useHover_unstable(props: HoverProps): HoverResult;
```

#### `usePress` (Future)

```ts
interface PressProps {
  /** Whether press events should be disabled. */
  isDisabled?: boolean;
  /** Handler called when press starts. */
  onPressStart?: (e: PressEvent) => void;
  /** Handler called when press ends. */
  onPressEnd?: (e: PressEvent) => void;
  /** Handler called on press up. */
  onPressUp?: (e: PressEvent) => void;
  /** Handler called when a press is released over the target. */
  onPress?: (e: PressEvent) => void;
  /** Handler called when press state changes. */
  onPressChange?: (isPressed: boolean) => void;
  /** Whether the target should not receive focus on press. */
  preventFocusOnPress?: boolean;
}

interface PressResult {
  /** Props to spread on the target element. */
  pressProps: React.HTMLAttributes<HTMLElement>;
  /** Whether the element is currently pressed. */
  isPressed: boolean;
}

interface PressEvent {
  /** The type of press event. */
  type: 'pressstart' | 'pressend' | 'pressup' | 'press';
  /** The pointer type that triggered the event. */
  pointerType: 'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual';
  /** The target element. */
  target: HTMLElement;
  /** Modifier keys. */
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

function usePress(props: PressProps): PressResult;
```

#### `useInteractionModality` (Future)

```ts
type Modality = 'keyboard' | 'pointer' | 'virtual';

/** Returns the current interaction modality (keyboard, pointer, or virtual). */
function useInteractionModality(): Modality;

/** Returns whether focus should be visible (keyboard navigation). */
function useFocusVisible(): boolean;

/** Programmatically set the interaction modality. */
function setInteractionModality(modality: Modality): void;
```

### Implementation: `useHover_unstable`

The implementation is based on React Aria's approach with the following key features:

1. **Global touch event tracking** - A `pointerup` listener on `document` sets a flag when touch interactions end
2. **50ms ignore window** - After touch, emulated mouse events are ignored for 50ms (handles iOS quirks)
3. **Element removal handling** - A `pointerover` listener detects when hovered elements are removed from DOM
4. **SSR-safe** - Uses `canUseDOM()` to avoid running in server environments
5. **Cleanup on unmount** - Properly removes event listeners

```ts
// packages/react-components/react-utilities/src/hooks/useHover.ts

// Global state for ignoring emulated mouse events after touch.
// iOS fires onPointerEnter twice: once with pointerType="touch" and again with pointerType="mouse".
let globalIgnoreEmulatedMouseEvents = false;
let hoverCount = 0;

function setGlobalIgnoreEmulatedMouseEvents() {
  globalIgnoreEmulatedMouseEvents = true;
  setTimeout(() => {
    globalIgnoreEmulatedMouseEvents = false;
  }, 50);
}

function handleGlobalPointerEvent(e: PointerEvent) {
  if (e.pointerType === 'touch') {
    setGlobalIgnoreEmulatedMouseEvents();
  }
}

function setupGlobalTouchEvents() {
  if (!canUseDOM()) {
    return;
  }

  if (hoverCount === 0) {
    document.addEventListener('pointerup', handleGlobalPointerEvent);
  }

  hoverCount++;

  return () => {
    hoverCount--;
    if (hoverCount === 0) {
      document.removeEventListener('pointerup', handleGlobalPointerEvent);
    }
  };
}

export function useHover_unstable(props: HoverProps): HoverResult {
  const { onHoverStart, onHoverChange, onHoverEnd, isDisabled } = props;

  const [isHovered, setHovered] = React.useState(false);
  const state = React.useRef({
    isHovered: false,
    pointerType: '' as string,
    target: null as HTMLElement | null,
  });

  // Setup/teardown global touch event listener
  React.useEffect(setupGlobalTouchEvents, []);

  const hoverProps = React.useMemo<React.DOMAttributes<HTMLElement>>(
    () => ({
      onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
        // Ignore emulated mouse events after touch
        if (globalIgnoreEmulatedMouseEvents && e.pointerType === 'mouse') {
          return;
        }
        // Never trigger hover for touch
        if (e.pointerType === 'touch' || isDisabled || state.current.isHovered) {
          return;
        }
        // ... trigger hover start
      },
      onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
        if (!isDisabled && e.pointerType !== 'touch') {
          // ... trigger hover end
        }
      },
    }),
    [isDisabled /* callbacks */],
  );

  return { hoverProps, isHovered };
}
```

### Context Integration

A new context was added to `@fluentui/react-shared-contexts`:

```ts
// packages/react-components/react-shared-contexts/library/src/PointerInteractionsContext/PointerInteractionsContext.ts

/**
 * Context value for pointer-aware interaction behavior.
 * @internal
 */
export type PointerInteractionsContextValue = {
  /**
   * Whether pointer-aware hover behavior is enabled.
   * When enabled, hover only fires for mouse/pen interactions, not touch.
   * This fixes "sticky hover" on touch devices.
   */
  usePointerHover: boolean;
};

const defaultValue: PointerInteractionsContextValue = {
  usePointerHover: false,
};

export const PointerInteractionsContext = React.createContext<PointerInteractionsContextValue>(defaultValue);
export const PointerInteractionsProvider = PointerInteractionsContext.Provider;

export function usePointerInteractions(): PointerInteractionsContextValue {
  return React.useContext(PointerInteractionsContext);
}
```

Exported from `@fluentui/react-shared-contexts` with `_unstable` suffix:

- `PointerInteractionsProvider_unstable`
- `usePointerInteractions_unstable`
- `PointerInteractionsContextValue_unstable`

Update `FluentProvider`:

```ts
// packages/react-components/react-provider/library/src/components/FluentProvider/FluentProvider.types.ts
export type FluentProviderProps = {
  // ... existing props

  /**
   * Enables pointer-aware hover behavior. When enabled, hover only fires for
   * mouse/pen interactions, not touch. This fixes "sticky hover" on touch devices.
   * @default false
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  UNSTABLE_usePointerHover?: boolean;
};

// The context is integrated in:
// - useFluentProvider.ts: reads the prop and passes to state
// - useFluentProviderContextValues.ts: creates memoized context value
// - renderFluentProvider.tsx: wraps children with PointerInteractionsProvider
```

### Component Integration: Button

The Button component was updated to integrate with the pointer-aware hover system:

```tsx
// packages/react-components/react-button/library/src/components/Button/useButtonBase.ts
import { useHover_unstable } from '@fluentui/react-utilities';
import { usePointerInteractions_unstable } from '@fluentui/react-shared-contexts';

export const useButtonBase_unstable = (
  props: ButtonBaseProps,
  ref: React.Ref<HTMLButtonElement | HTMLAnchorElement>,
): ButtonBaseState => {
  const { disabled = false, disabledFocusable = false /* ... */ } = props;

  // Check if pointer-aware hover behavior is enabled via FluentProvider
  const { usePointerHover } = usePointerInteractions_unstable();

  // Use pointer-aware hover hook - disabled when feature flag is off or button is disabled
  const { hoverProps, isHovered } = useHover_unstable({
    isDisabled: !usePointerHover || disabled || disabledFocusable,
  });

  // Get base ARIA button props
  const ariaButtonProps = useARIAButtonProps(props.as, props);

  // Merge hover props with ARIA button props when pointer hover is enabled
  const mergedProps = usePointerHover
    ? {
        ...ariaButtonProps,
        ...hoverProps,
        // Merge event handlers - ensure both hover and aria handlers are called
        onPointerEnter: e => {
          hoverProps.onPointerEnter?.(e);
          ariaButtonProps.onPointerEnter?.(e);
        },
        onPointerLeave: e => {
          hoverProps.onPointerLeave?.(e);
          ariaButtonProps.onPointerLeave?.(e);
        },
        // Add data-hovered attribute for CSS styling when hovered
        'data-hovered': isHovered ? '' : undefined,
      }
    : ariaButtonProps;

  return {
    disabled,
    disabledFocusable,
    isHovered,
    // ...
    root: slot.always(getIntrinsicElementProps(as, mergedProps), {
      /* ... */
    }),
  };
};
```

The `isHovered` state is added to `ButtonState` and `ButtonBaseState` types:

```ts
// packages/react-components/react-button/library/src/components/Button/Button.types.ts
export type ButtonState = ComponentState<ButtonSlots> &
  Required<Pick<ButtonProps /* ... */>> & {
    iconOnly: boolean;
    /**
     * Whether the button is currently hovered (via pointer-aware hover detection).
     * This is used when `UNSTABLE_usePointerHover` is enabled on FluentProvider.
     * @default false
     */
    isHovered: boolean;
  };
```

### Styling with Data Attributes

The Button styles were updated to include `&[data-hovered]` selectors that mirror the existing `:hover` styles:

```ts
// packages/react-components/react-button/library/src/components/Button/useButtonStyles.styles.ts

const useRootBaseClassName = makeResetStyles({
  // ... base styles

  ':hover': {
    backgroundColor: tokens.colorNeutralBackground1Hover,
    borderColor: tokens.colorNeutralStroke1Hover,
    color: tokens.colorNeutralForeground1Hover,
    cursor: 'pointer',
  },

  // Pointer-aware hover styles (used when UNSTABLE_usePointerHover is enabled)
  '&[data-hovered]': {
    backgroundColor: tokens.colorNeutralBackground1Hover,
    borderColor: tokens.colorNeutralStroke1Hover,
    color: tokens.colorNeutralForeground1Hover,
    cursor: 'pointer',
  },

  // High contrast styles also include &[data-hovered]
  '@media (forced-colors: active)': {
    ':hover': {
      backgroundColor: 'HighlightText',
      borderColor: 'Highlight',
      color: 'Highlight',
      forcedColorAdjust: 'none',
    },
    '&[data-hovered]': {
      backgroundColor: 'HighlightText',
      borderColor: 'Highlight',
      color: 'Highlight',
      forcedColorAdjust: 'none',
    },
  },
});

// Appearance-specific styles (outline, primary, subtle, transparent)
// also include &[data-hovered] selectors mirroring :hover
const useRootStyles = makeStyles({
  primary: {
    ':hover': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      // ...
    },
    '&[data-hovered]': {
      backgroundColor: tokens.colorBrandBackgroundHover,
      // ...
    },
  },
  // ... other appearances
});

// Disabled styles override hover to prevent visual feedback
const useRootDisabledStyles = makeStyles({
  base: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackgroundDisabled,
      cursor: 'not-allowed',
    },
    '&[data-hovered]': {
      backgroundColor: tokens.colorNeutralBackgroundDisabled,
      cursor: 'not-allowed',
    },
  },
});
```

**Note:** The styles file does NOT conditionally apply styles based on the feature flag. Both `:hover` and `&[data-hovered]` styles are always present. This approach:

- Avoids runtime style computation overhead
- Allows smooth transition when flag is enabled/disabled
- Ensures consistent bundle size regardless of feature flag

### Phased Rollout

#### Phase 1: Foundation (MVP) - COMPLETED

- [x] Add `useHover_unstable` hook to `@fluentui/react-utilities`
- [x] Add `UNSTABLE_usePointerHover` flag to FluentProvider
- [x] Add `PointerInteractionsContext` to `@fluentui/react-shared-contexts`
- [x] Integrate with `Button` component (including all variants via `useButtonBase_unstable`)
- [x] Update Button styles with `&[data-hovered]` selectors

#### Phase 2: Core Interactions (Future)

- Implement `usePress` hook
- Implement `useLongPress` hook
- Integrate with all button variants (ToggleButton, CompoundButton, SplitButton, MenuButton)
- Integrate with Link component

#### Phase 3: Form Controls

- Integrate with Input, Textarea, Select, Combobox, Dropdown
- Integrate with Checkbox, Radio, Switch
- Integrate with Slider, SpinButton

#### Phase 4: Complex Components

- Integrate with Tab, MenuItem, TreeItem
- Integrate with Card (when interactive)
- Implement `useMove` for drag interactions
- Implement `useInteractionModality` for focus-visible coordination

#### Phase 5: Stabilization

- Remove `UNSTABLE_` prefix after sufficient testing
- Make pointer-aware hover the default behavior
- Deprecate CSS `:hover` approach in documentation

### Affected Components

All interactive components will need updates:

| Component       | Priority | Notes                    |
| --------------- | -------- | ------------------------ |
| Button          | High     | Primary proof of concept |
| ToggleButton    | High     | Same as Button           |
| CompoundButton  | High     | Same as Button           |
| SplitButton     | High     | Same as Button           |
| MenuButton      | High     | Same as Button           |
| Link            | High     | Similar to Button        |
| Input           | Medium   | Focus + hover states     |
| Textarea        | Medium   | Same as Input            |
| Select          | Medium   | Dropdown hover           |
| Combobox        | Medium   | Input + dropdown         |
| Dropdown        | Medium   | Similar to Select        |
| Checkbox        | Medium   | Toggle interaction       |
| Radio           | Medium   | Same as Checkbox         |
| Switch          | Medium   | Same as Checkbox         |
| Slider          | Medium   | Thumb hover + drag       |
| SpinButton      | Medium   | Buttons + input          |
| Tab             | Medium   | Tab hover                |
| MenuItem        | Medium   | Menu item hover          |
| TreeItem        | Low      | Tree node hover          |
| Card            | Low      | When interactive         |
| Tooltip trigger | Low      | Hover-triggered          |

### Pros and Cons

#### Pros

- **Fixes sticky hover** - The primary goal is achieved
- **Semantically correct** - Hover and press have distinct meanings
- **Proven approach** - Based on React Aria's battle-tested implementation
- **Opt-in** - No breaking changes for existing consumers
- **Comprehensive** - Provides foundation for future interaction improvements
- **Modality-aware** - Can correctly handle mouse, touch, pen, and keyboard
- **Accessibility-ready** - Enables better focus-visible implementation

#### Cons

- **Implementation effort** - Requires updating all interactive components
- **Style duplication** - Need both CSS `:hover` and `[data-hovered]` styles during transition
- **Testing complexity** - Touch interactions are harder to test
- **Learning curve** - Contributors need to understand new patterns
- **Coordination with Tabster** - Need to ensure compatibility with existing focus management

## Discarded Solutions

### CSS-only: `@media (hover: hover)`

```css
@media (hover: hover) {
  .button:hover {
    background-color: var(--hover-color);
  }
}
```

**Why discarded:**

- Doesn't work on hybrid devices (laptops with touchscreens)
- The media query reflects device capability, not current interaction modality
- A touch-capable laptop would still show hover on touch

### CSS-only: `:hover:not(:active)`

```css
.button:hover:not(:active) {
  background-color: var(--hover-color);
}
```

**Why discarded:**

- Only partially works - hover still persists after touch ends
- Doesn't distinguish between mouse hover and touch-emulated hover

### Always use JS hover (breaking change)

**Why discarded:**

- Would be a breaking change for all consumers
- Some consumers may have CSS customizations that depend on `:hover`
- Risk of regression in existing applications

## Open Issues

### 1. Styling approach

Should hover state be indicated via:

- **Data attribute:** `data-hovered` (recommended)
- **CSS class:** `.fui-hovered`
- **CSS variable:** `--fui-hovered: 1`

**Recommendation:** Data attribute for semantic clarity and CSS specificity.

### 2. Coordination with Tabster

Fluent UI already has `useFocusVisible` and `useFocusWithin` in `@fluentui/react-tabster`. How should the interaction hooks in `@fluentui/react-utilities` coordinate with these?

Options:

- Keep focus hooks in react-tabster, interaction hooks in react-utilities
- Move all interaction-related hooks to react-utilities
- Create shared modality tracking used by both

### 3. Testing strategy

How to test touch interactions in unit tests?

- JSDOM doesn't support PointerEvents well
- May need custom test utilities
- React Aria uses a test-specific fallback branch

### 4. Migration path

When the feature is stabilized:

- Should pointer-aware hover become the default?
- How long to support the CSS `:hover` fallback?
- How to communicate the change to consumers?

### 5. Server-side rendering

The global event listeners for touch detection need SSR-safe initialization. Need to ensure:

- No errors during SSR
- Proper hydration
- Event listeners attached only on client

---

## References

- [React Aria Interactions](https://react-spectrum.adobe.com/react-aria/interactions.html)
- [Building a Button Part 2 - React Spectrum Blog](https://react-spectrum.adobe.com/blog/building-a-button-part-2.html)
- [Fluent UI Button styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/src/components/Button/useButtonStyles.styles.ts)
- [CSS :hover media query issues](https://css-tricks.com/touch-devices-not-quite-hover/)
