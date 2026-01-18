/**
 * Button component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../utils/render-with-providers';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);

      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders button with children', () => {
      render(
        <Button>
          <span data-testid="icon">Icon</span>
          Click me
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-brand-cyan');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-error');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-brand-cyan');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies default size styles', () => {
      render(<Button>Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-4');
    });

    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-3');
    });

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
      expect(button).toHaveClass('px-8');
    });

    it('applies icon size styles', () => {
      render(<Button size="icon">Icon</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('w-10');
    });
  });

  describe('States', () => {
    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      fireEvent.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled styles and prevents clicks', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports type attribute', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('asChild', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Button className="custom-class">Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-brand-cyan'); // Still has default styles
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('has visible focus ring', () => {
      render(<Button>Focus me</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });
});
