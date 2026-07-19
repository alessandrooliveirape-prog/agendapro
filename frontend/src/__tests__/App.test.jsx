import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock the api module to avoid real fetch calls
vi.mock('../lib/api', () => ({
  api: {
    getToken: () => null,
    setToken: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn().mockRejectedValue(new Error('No token')),
  },
}));

describe('App', () => {
  it('renders login page at /login', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByText(/Acesse seu painel/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    // Should redirect to login
    expect(screen.getByText(/Acesse seu painel/i)).toBeInTheDocument();
  });

  it('shows 404 for unknown routes', () => {
    window.history.pushState({}, '', '/nonexistent-page');
    render(<App />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText(/Página não encontrada/i)).toBeInTheDocument();
  });
});
