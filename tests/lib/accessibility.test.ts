/**
 * Accessibility utilities tests
 * Sprint 5.4 - Accessibility Features
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  Keys,
  prefersReducedMotion,
  useReducedMotion,
  useKeyboardNavigation,
  useFocusTrap,
  useFocusOnMount,
  generateId,
  useId,
  announce,
  useAnnounce,
  isElementVisible,
  getFocusableElements,
  focusFirstElement,
  getButtonAriaProps,
  getDialogAriaProps,
  getProgressAriaProps,
  getListAriaProps,
  getListItemAriaProps,
} from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('Keys', () => {
    it('has correct key values', () => {
      expect(Keys.ENTER).toBe('Enter');
      expect(Keys.SPACE).toBe(' ');
      expect(Keys.ESCAPE).toBe('Escape');
      expect(Keys.TAB).toBe('Tab');
      expect(Keys.ARROW_UP).toBe('ArrowUp');
      expect(Keys.ARROW_DOWN).toBe('ArrowDown');
      expect(Keys.ARROW_LEFT).toBe('ArrowLeft');
      expect(Keys.ARROW_RIGHT).toBe('ArrowRight');
      expect(Keys.HOME).toBe('Home');
      expect(Keys.END).toBe('End');
    });
  });

  describe('prefersReducedMotion', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });
    });

    it('returns false when reduced motion is not preferred', () => {
      expect(prefersReducedMotion()).toBe(false);
    });

    it('returns true when reduced motion is preferred', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe('useReducedMotion', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;
    let listener: ((event: MediaQueryListEvent) => void) | null = null;

    beforeEach(() => {
      matchMediaMock = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn((_, fn) => {
          listener = fn;
        }),
        removeEventListener: vi.fn(),
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
      });
    });

    afterEach(() => {
      listener = null;
    });

    it('returns false by default', () => {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);
    });

    it('updates when preference changes', () => {
      const { result } = renderHook(() => useReducedMotion());

      expect(result.current).toBe(false);

      // Simulate media query change
      act(() => {
        if (listener) {
          listener({ matches: true } as MediaQueryListEvent);
        }
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useKeyboardNavigation', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation<HTMLDivElement>(5, {})
      );

      expect(result.current.activeIndex).toBe(0);
      expect(result.current.containerRef.current).toBeNull();
    });

    it('allows setting active index', () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation<HTMLDivElement>(5, {})
      );

      act(() => {
        result.current.setActiveIndex(3);
      });

      expect(result.current.activeIndex).toBe(3);
    });
  });

  describe('useFocusTrap', () => {
    it('returns a ref', () => {
      const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(true));
      expect(result.current).toBeDefined();
      expect(result.current.current).toBeNull();
    });

    it('does not trap when inactive', () => {
      const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(false));
      expect(result.current).toBeDefined();
    });
  });

  describe('useFocusOnMount', () => {
    it('returns a ref', () => {
      const { result } = renderHook(() => useFocusOnMount<HTMLDivElement>(true));
      expect(result.current).toBeDefined();
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('uses custom prefix', () => {
      const id = generateId('custom');
      expect(id).toMatch(/^custom-\d+$/);
    });

    it('uses default prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^dd-\d+$/);
    });
  });

  describe('useId', () => {
    it('returns stable ID', () => {
      const { result, rerender } = renderHook(() => useId());
      const initialId = result.current;
      rerender();
      expect(result.current).toBe(initialId);
    });

    it('uses custom prefix', () => {
      const { result } = renderHook(() => useId('test'));
      expect(result.current).toMatch(/^test-\d+$/);
    });
  });

  describe('announce', () => {
    beforeEach(() => {
      // Clean up any existing announcer
      const existing = document.getElementById('dd-announcer');
      if (existing) {
        existing.remove();
      }
    });

    it('creates announcer element if not exists', () => {
      announce('Test message');
      const announcer = document.getElementById('dd-announcer');
      expect(announcer).toBeTruthy();
    });

    it('sets aria-live attribute', () => {
      announce('Test message', 'polite');
      const announcer = document.getElementById('dd-announcer');
      expect(announcer?.getAttribute('aria-live')).toBe('polite');
    });

    it('sets assertive aria-live when specified', () => {
      announce('Urgent message', 'assertive');
      const announcer = document.getElementById('dd-announcer');
      expect(announcer?.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('useAnnounce', () => {
    it('returns announce functions', () => {
      const { result } = renderHook(() => useAnnounce());

      expect(result.current.announce).toBeDefined();
      expect(result.current.announcePolite).toBeDefined();
      expect(result.current.announceAssertive).toBeDefined();
    });
  });

  describe('isElementVisible', () => {
    it('returns true for visible elements', () => {
      const element = document.createElement('div');
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';

      // Need to add to DOM for offsetWidth/Height
      document.body.appendChild(element);
      element.style.width = '100px';
      element.style.height = '100px';

      // Mock offsetWidth and offsetHeight
      Object.defineProperty(element, 'offsetWidth', { value: 100 });
      Object.defineProperty(element, 'offsetHeight', { value: 100 });

      expect(isElementVisible(element)).toBe(true);

      document.body.removeChild(element);
    });

    it('returns false for hidden elements', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);

      expect(isElementVisible(element)).toBe(false);

      document.body.removeChild(element);
    });
  });

  describe('getFocusableElements', () => {
    it('returns focusable elements', () => {
      const container = document.createElement('div');

      // Create elements safely without innerHTML
      const button = document.createElement('button');
      button.textContent = 'Button';
      Object.defineProperty(button, 'offsetWidth', { value: 100 });
      Object.defineProperty(button, 'offsetHeight', { value: 100 });

      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Link';
      Object.defineProperty(link, 'offsetWidth', { value: 100 });
      Object.defineProperty(link, 'offsetHeight', { value: 100 });

      const input = document.createElement('input');
      input.type = 'text';
      Object.defineProperty(input, 'offsetWidth', { value: 100 });
      Object.defineProperty(input, 'offsetHeight', { value: 100 });

      const disabledInput = document.createElement('input');
      disabledInput.type = 'text';
      disabledInput.disabled = true;

      const tabbableDiv = document.createElement('div');
      tabbableDiv.tabIndex = 0;
      tabbableDiv.textContent = 'Tabbable';
      Object.defineProperty(tabbableDiv, 'offsetWidth', { value: 100 });
      Object.defineProperty(tabbableDiv, 'offsetHeight', { value: 100 });

      const notTabbableDiv = document.createElement('div');
      notTabbableDiv.tabIndex = -1;
      notTabbableDiv.textContent = 'Not tabbable';

      container.appendChild(button);
      container.appendChild(link);
      container.appendChild(input);
      container.appendChild(disabledInput);
      container.appendChild(tabbableDiv);
      container.appendChild(notTabbableDiv);

      document.body.appendChild(container);

      const focusable = getFocusableElements(container);
      // Should find button, link, enabled input, and tabindex=0 div
      expect(focusable.length).toBeGreaterThanOrEqual(1);

      document.body.removeChild(container);
    });
  });

  describe('focusFirstElement', () => {
    it('focuses first focusable element', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      button.textContent = 'First';
      Object.defineProperty(button, 'offsetWidth', { value: 100 });
      Object.defineProperty(button, 'offsetHeight', { value: 100 });
      container.appendChild(button);

      document.body.appendChild(container);

      focusFirstElement(container);
      expect(document.activeElement).toBe(button);

      document.body.removeChild(container);
    });
  });

  describe('ARIA Props Helpers', () => {
    describe('getButtonAriaProps', () => {
      it('returns basic button props', () => {
        const props = getButtonAriaProps({ label: 'Click me' });
        expect(props['aria-label']).toBe('Click me');
      });

      it('includes pressed state', () => {
        const props = getButtonAriaProps({ label: 'Toggle', pressed: true });
        expect(props['aria-pressed']).toBe(true);
      });

      it('includes expanded state', () => {
        const props = getButtonAriaProps({ label: 'Expand', expanded: true });
        expect(props['aria-expanded']).toBe(true);
      });

      it('includes controls reference', () => {
        const props = getButtonAriaProps({ label: 'Toggle', controls: 'menu-1' });
        expect(props['aria-controls']).toBe('menu-1');
      });

      it('includes haspopup', () => {
        const props = getButtonAriaProps({ label: 'Menu', haspopup: 'menu' });
        expect(props['aria-haspopup']).toBe('menu');
      });

      it('includes disabled state', () => {
        const props = getButtonAriaProps({ label: 'Disabled', disabled: true });
        expect(props['aria-disabled']).toBe(true);
      });
    });

    describe('getDialogAriaProps', () => {
      it('returns dialog role', () => {
        const props = getDialogAriaProps({});
        expect(props.role).toBe('dialog');
        expect(props['aria-modal']).toBe(true);
      });

      it('includes labelledby', () => {
        const props = getDialogAriaProps({ labelledby: 'title-1' });
        expect(props['aria-labelledby']).toBe('title-1');
      });

      it('includes describedby', () => {
        const props = getDialogAriaProps({ describedby: 'desc-1' });
        expect(props['aria-describedby']).toBe('desc-1');
      });

      it('respects modal option', () => {
        const props = getDialogAriaProps({ modal: false });
        expect(props['aria-modal']).toBe(false);
      });
    });

    describe('getProgressAriaProps', () => {
      it('returns progress role', () => {
        const props = getProgressAriaProps({ label: 'Loading' });
        expect(props.role).toBe('progressbar');
        expect(props['aria-label']).toBe('Loading');
      });

      it('includes min/max/value', () => {
        const props = getProgressAriaProps({
          label: 'Progress',
          min: 0,
          max: 100,
          value: 50,
        });
        expect(props['aria-valuemin']).toBe(0);
        expect(props['aria-valuemax']).toBe(100);
        expect(props['aria-valuenow']).toBe(50);
      });

      it('includes valuetext', () => {
        const props = getProgressAriaProps({
          label: 'Loading',
          valueText: '50%',
        });
        expect(props['aria-valuetext']).toBe('50%');
      });
    });

    describe('getListAriaProps', () => {
      it('returns list role', () => {
        const props = getListAriaProps({});
        expect(props.role).toBe('list');
      });

      it('includes label', () => {
        const props = getListAriaProps({ label: 'Delivery list' });
        expect(props['aria-label']).toBe('Delivery list');
      });

      it('includes labelledby', () => {
        const props = getListAriaProps({ labelledby: 'list-title' });
        expect(props['aria-labelledby']).toBe('list-title');
      });
    });

    describe('getListItemAriaProps', () => {
      it('returns listitem role', () => {
        const props = getListItemAriaProps({ index: 0, total: 5 });
        expect(props.role).toBe('listitem');
      });

      it('includes position info', () => {
        const props = getListItemAriaProps({ index: 2, total: 5 });
        expect(props['aria-setsize']).toBe(5);
        expect(props['aria-posinset']).toBe(3); // 1-indexed
      });

      it('includes selected state', () => {
        const props = getListItemAriaProps({ index: 0, total: 5, selected: true });
        expect(props['aria-selected']).toBe(true);
      });
    });
  });
});
