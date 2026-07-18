import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold mb-2">
            Agenda<span className="gradient-text">Pro</span>
          </div>
          <p className="text-gray-400">Acesse seu painel de controle</p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            Não tem conta?{' '}
            <a href="#" className="text-indigo-400 hover:text-indigo-300">
              Criar agora
            </a>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 glass rounded-xl text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Conta de teste:</p>
          <p>Email: ze@barbearia.com</p>
          <p>Senha: 123456</p>
        </div>
      </div>
    </div>
  );
}
