import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationSearch } from '../LocationSearch';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Navigation: () => <div data-testid="navigation-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch for geocoding API
global.fetch = vi.fn();

describe('LocationSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders input field with placeholder', () => {
    render(<LocationSearch placeholder="Search location..." />);
    expect(screen.getByPlaceholderText('Search location...')).toBeInTheDocument();
  });

  it('performs search and displays results on typing', async () => {
    // Mock successful fetch
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            name: 'Nashik',
            admin1: 'Maharashtra',
            country: 'India',
            latitude: 20,
            longitude: 73
          }
        ]
      })
    });

    render(<LocationSearch />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Nash' } });
    
    // Wait for debounce and fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('name=Nash'),
        expect.any(Object)
      );
    });
    
    expect(await screen.findByText(/Nashik/)).toBeInTheDocument();
    expect(screen.getByText(/Maharashtra, India/)).toBeInTheDocument();
  });

  it('handles empty results', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] })
    });

    render(<LocationSearch />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'UnknownCityX' } });
    
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when a result is clicked', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { id: 1, name: 'Mumbai', admin1: 'MH', country: 'India', latitude: 19, longitude: 72 }
        ]
      })
    });

    const onSelectMock = vi.fn();
    render(<LocationSearch onSelect={onSelectMock} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mumb' } });
    
    const resultItem = await screen.findByText(/Mumbai/);
    fireEvent.click(resultItem);
    
    expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Mumbai' }));
  });
});
