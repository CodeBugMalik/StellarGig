import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EscrowStatusBar from '@/components/jobs/EscrowStatusBar';

describe('EscrowStatusBar', () => {
  it('renders zero state correctly', () => {
    render(<EscrowStatusBar totalAmount="0" releasedAmount="0" />);
    // All three values are 0.00, so multiple elements match — use getAllByText
    const zeroElements = screen.getAllByText(/0\.00/);
    expect(zeroElements.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/released/)).toBeInTheDocument();
    expect(screen.getByText(/locked/)).toBeInTheDocument();
    expect(screen.getByText(/total/)).toBeInTheDocument();
  });

  it('renders partial release correctly', () => {
    render(<EscrowStatusBar totalAmount="100.0000000" releasedAmount="30.0000000" />);
    expect(screen.getByText('30.00 XLM')).toBeInTheDocument();
    expect(screen.getByText(/70\.00 XLM locked/)).toBeInTheDocument();
    expect(screen.getByText(/100\.00 XLM total/)).toBeInTheDocument();
  });

  it('renders full release correctly', () => {
    render(<EscrowStatusBar totalAmount="50.0000000" releasedAmount="50.0000000" />);
    expect(screen.getByText('50.00 XLM')).toBeInTheDocument();
    expect(screen.getByText(/0\.00 XLM locked/)).toBeInTheDocument();
  });

  it('handles non-numeric strings gracefully', () => {
    render(<EscrowStatusBar totalAmount="abc" releasedAmount="xyz" />);
    // parseFloat('abc') = NaN → falls back to 0, so all values are 0.00
    const zeroElements = screen.getAllByText(/0\.00/);
    expect(zeroElements.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/released/)).toBeInTheDocument();
  });
});
