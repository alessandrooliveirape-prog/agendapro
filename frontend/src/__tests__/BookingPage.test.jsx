import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookingPage from '../pages/BookingPage';

// Mock fetch
global.fetch = vi.fn();

function renderWithRouter(ui, { route = '/agendar/test-slug' } = {}) {
  window.history.pushState({}, '', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe('BookingPage', () => {
  it('shows loading state initially', () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    renderWithRouter(<BookingPage />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows error when business not found', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    renderWithRouter(<BookingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Negócio não encontrado/)).toBeInTheDocument();
    });
  });

  it('renders services list when business loads', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        business: { name: 'Test Business', working_hours: {} },
        services: [
          { id: '1', name: 'Corte', price: 50, duration_minutes: 30, color: '#6366f1' },
          { id: '2', name: 'Barba', price: 30, duration_minutes: 20, color: '#8b5cf6' },
        ],
        professionals: [],
      }),
    });

    renderWithRouter(<BookingPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Business')).toBeInTheDocument();
      expect(screen.getByText('Corte')).toBeInTheDocument();
      expect(screen.getByText('Barba')).toBeInTheDocument();
    });
  });

  it('shows service selection step', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        business: { name: 'Barber Shop', working_hours: {} },
        services: [
          { id: '1', name: 'Haircut', price: 50, duration_minutes: 30, color: '#6366f1' },
        ],
        professionals: [],
      }),
    });

    renderWithRouter(<BookingPage />);

    await waitFor(() => {
      expect(screen.getByText(/Escolha o serviço/)).toBeInTheDocument();
    });
  });
});
