import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MilestoneTracker from '@/components/jobs/MilestoneTracker';
import type { Milestone } from '@/lib/types';

const milestones: Milestone[] = [
  { description: 'Design mockups', amount: '100.0000000', status: 'approved' },
  { description: 'Build frontend', amount: '200.0000000', status: 'submitted' },
  { description: 'Deploy to prod', amount: '150.0000000', status: 'pending' },
];

describe('MilestoneTracker', () => {
  it('renders all milestones', () => {
    render(<MilestoneTracker milestones={milestones} />);
    expect(screen.getByText('Milestone 1')).toBeInTheDocument();
    expect(screen.getByText('Milestone 2')).toBeInTheDocument();
    expect(screen.getByText('Milestone 3')).toBeInTheDocument();
  });

  it('shows correct completion count', () => {
    render(<MilestoneTracker milestones={milestones} />);
    expect(screen.getByText('1/3 completed')).toBeInTheDocument();
  });

  it('renders milestone descriptions', () => {
    render(<MilestoneTracker milestones={milestones} />);
    expect(screen.getByText('Design mockups')).toBeInTheDocument();
    expect(screen.getByText('Build frontend')).toBeInTheDocument();
  });
});
