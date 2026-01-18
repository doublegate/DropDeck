/**
 * Card component tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/render-with-providers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
  describe('Card', () => {
    it('renders with children', () => {
      render(<Card>Card content</Card>);

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(<Card>Content</Card>);

      const card = screen.getByText('Content');
      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('shadow-md');
    });

    it('merges custom className', () => {
      render(<Card className="custom-class">Content</Card>);

      const card = screen.getByText('Content');
      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('rounded-xl'); // Still has default
    });

    it('forwards ref', () => {
      const ref = { current: null } as React.RefObject<HTMLDivElement | null>;
      render(<Card ref={ref}>Content</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('spreads additional props', () => {
      render(<Card data-testid="my-card">Content</Card>);

      expect(screen.getByTestId('my-card')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('renders with children', () => {
      render(<CardHeader>Header content</CardHeader>);

      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(<CardHeader>Header</CardHeader>);

      const header = screen.getByText('Header');
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('flex-col');
      expect(header).toHaveClass('p-6');
    });

    it('merges custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);

      const header = screen.getByText('Header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3', () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Title');
    });

    it('applies default styles', () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-semibold');
    });

    it('merges custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);

      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders as p', () => {
      render(<CardDescription>Description text</CardDescription>);

      const desc = screen.getByText('Description text');
      expect(desc.tagName).toBe('P');
    });

    it('applies default styles', () => {
      render(<CardDescription>Description</CardDescription>);

      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-sm');
    });

    it('merges custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);

      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders with children', () => {
      render(<CardContent>Main content</CardContent>);

      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(<CardContent>Content</CardContent>);

      const content = screen.getByText('Content');
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('merges custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);

      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('renders with children', () => {
      render(<CardFooter>Footer content</CardFooter>);

      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(<CardFooter>Footer</CardFooter>);

      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
    });

    it('merges custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);

      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Complete Card', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button type="button">Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
      expect(screen.getByText('Card description text')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });
  });
});
