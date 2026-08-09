import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NetworkStatusBanner from '@/components/layout/NetworkStatusBanner';

describe('NetworkStatusBanner', () => {
  it('renders testnet warning when on testnet', () => {
    render(<NetworkStatusBanner />);
    expect(screen.getByText(/Stellar Testnet/i)).toBeInTheDocument();
    expect(screen.getByText(/test XLM/i)).toBeInTheDocument();
  });
});
