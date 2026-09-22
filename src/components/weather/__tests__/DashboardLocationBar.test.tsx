import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLocationBar } from '../DashboardLocationBar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('DashboardLocationBar', () => {
  it('renders the current city', () => {
    render(<DashboardLocationBar currentCity="Nashik" />);
    expect(screen.getByText('Nashik')).toBeInTheDocument();
  });

  it('renders the breadcrumb link', () => {
    render(<DashboardLocationBar currentCity="Nashik" />);
    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
