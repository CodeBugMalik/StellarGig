import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState title="No jobs found" description="Try searching again." />
    );
    expect(screen.getByText('No jobs found')).toBeInTheDocument();
    expect(screen.getByText('Try searching again.')).toBeInTheDocument();
  });

  it('renders optional action', () => {
    render(
      <EmptyState
        title="No data"
        description="Nothing here"
        action={<button>Go back</button>}
      />
    );
    expect(screen.getByText('Go back')).toBeInTheDocument();
  });
});
