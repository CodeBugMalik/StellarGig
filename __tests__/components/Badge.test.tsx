import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders the correct label for open status', () => {
    render(<Badge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders the correct label for completed status', () => {
    render(<Badge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders the correct label for disputed status', () => {
    render(<Badge status="disputed" />);
    expect(screen.getByText('Disputed')).toBeInTheDocument();
  });
});
