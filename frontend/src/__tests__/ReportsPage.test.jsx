import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportsPage from '../pages/ReportsPage';

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    request: vi.fn(),
  },
}));

import { api } from '../lib/api';

const mockDashboard = {
  period: { start: '2026-07-01', end: '2026-07-31' },
  totalAppointments: 25,
  todayAppointments: 3,
  totalRevenue: 2500,
  paidRevenue: 2000,
  pendingRevenue: 500,
  totalClients: 15,
  newClients: 5,
  totalServices: 8,
  topServices: [
    { name: 'Corte', count: 15, revenue: 750 },
    { name: 'Barba', count: 10, revenue: 300 },
  ],
  revenueChange: 12,
  appointmentsChange: -5,
  statusCounts: { pending: 5, confirmed: 10, completed: 8, cancelled: 2, no_show: 0 },
};

describe('ReportsPage', () => {
  it('shows loading state', () => {
    api.request.mockResolvedValueOnce({});
    api.request.mockResolvedValueOnce({ busyHours: [] });
    api.request.mockResolvedValueOnce({ topClients: [] });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders dashboard data', async () => {
    api.request
      .mockResolvedValueOnce(mockDashboard)
      .mockResolvedValueOnce({ busyHours: [{ hour: '10:00', count: 5 }] })
      .mockResolvedValueOnce({ topClients: [{ name: 'João', phone: '1199999', visits: 10, spent: 500 }] });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('R$ 2.500')).toBeInTheDocument();
    });
  });

  it('shows date range presets', async () => {
    api.request
      .mockResolvedValueOnce(mockDashboard)
      .mockResolvedValueOnce({ busyHours: [] })
      .mockResolvedValueOnce({ topClients: [] });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Esta semana')).toBeInTheDocument();
      expect(screen.getByText('Este mês')).toBeInTheDocument();
      expect(screen.getByText('Último mês')).toBeInTheDocument();
    });
  });

  it('shows revenue change indicator', async () => {
    api.request
      .mockResolvedValueOnce(mockDashboard)
      .mockResolvedValueOnce({ busyHours: [] })
      .mockResolvedValueOnce({ topClients: [] });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/12% vs período anterior/)).toBeInTheDocument();
    });
  });

  it('shows export buttons', async () => {
    api.request
      .mockResolvedValueOnce(mockDashboard)
      .mockResolvedValueOnce({ busyHours: [] })
      .mockResolvedValueOnce({ topClients: [] });

    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Agendamentos/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Receita/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Clientes/).length).toBeGreaterThan(0);
    });
  });
});
