import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UnitsPage from '../pages/UnitsPage';

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    request: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { api } from '../lib/api';

describe('UnitsPage', () => {
  it('shows loading state', () => {
    api.request.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <UnitsPage />
      </MemoryRouter>
    );
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state when no units', async () => {
    api.request.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <UnitsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma unidade/)).toBeInTheDocument();
    });
  });

  it('renders units list', async () => {
    api.request
      .mockResolvedValueOnce([
        { id: '1', name: 'Filial Centro', address: 'Rua Augusta, 1000', phone: '1133334444' },
        { id: '2', name: 'Filial Zona Sul', address: 'Av. Paulista, 2000', phone: '1155556666' },
      ])
      .mockResolvedValueOnce({ monthAppointments: 10, monthRevenue: 500, activeProfessionals: 2 })
      .mockResolvedValueOnce({ monthAppointments: 5, monthRevenue: 250, activeProfessionals: 1 });

    render(
      <MemoryRouter>
        <UnitsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Filial Centro')).toBeInTheDocument();
      expect(screen.getByText('Filial Zona Sul')).toBeInTheDocument();
    });
  });

  it('shows create button', async () => {
    api.request.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <UnitsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Criar Unidade/)).toBeInTheDocument();
    });
  });
});
