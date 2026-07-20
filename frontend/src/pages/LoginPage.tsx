import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
};

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Register fields
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.register({
        business_name: businessName,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        name,
        email,
        password,
      });
      toast.success('Conta criada com sucesso!');
      // Auto login
      await login(email, password);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast.success('Instruções enviadas para seu email!');
      setMode('login');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar instruções');
    } finally {
      setLoading(false);
    }
  };

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputClientId, setInputClientId] = useState('');
  const [testEmail, setTestEmail] = useState('usuario.google@gmail.com');

  const executeGoogleOAuth = async (clientId: string) => {
    setLoading(true);
    try {
      await loadGoogleScript();
      const google = (window as any).google;

      if (!google?.accounts?.id) {
        throw new Error('Não foi possível carregar o serviço do Google');
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response.credential) {
            try {
              setLoading(true);
              await loginWithGoogle(response.credential);
              toast.success('Login com Google realizado com sucesso!');
            } catch (err: any) {
              toast.error(err.message || 'Erro ao autenticar com o Google');
            } finally {
              setLoading(false);
            }
          }
        },
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const parent = document.createElement('div');
          parent.style.display = 'none';
          document.body.appendChild(parent);
          google.accounts.id.renderButton(parent, { theme: 'outline', size: 'large' });
          const btn = parent.querySelector('div[role=button]') as HTMLElement | null;
          if (btn) btn.click();
          setTimeout(() => {
            if (parent.parentNode) parent.parentNode.removeChild(parent);
          }, 5000);
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('agendapro_google_client_id');

    if (!googleClientId) {
      setShowConfigModal(true);
      return;
    }

    await executeGoogleOAuth(googleClientId);
  };

  const handleSaveClientId = async () => {
    if (!inputClientId.trim()) {
      toast.error('Informe um Client ID válido');
      return;
    }
    localStorage.setItem('agendapro_google_client_id', inputClientId.trim());
    setShowConfigModal(false);
    toast.success('Client ID salvo com sucesso!');
    await executeGoogleOAuth(inputClientId.trim());
  };

  const handleDevGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(`dev_token_${Date.now()}`, testEmail, 'Usuário Google');
      toast.success('Login com Google (Modo de Teste) realizado!');
      setShowConfigModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro no login de teste');
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
          <p className="text-gray-400">
            {mode === 'login' ? 'Acesse seu painel de controle' : 'Crie sua conta gratuita'}
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
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

              {/* Divisor */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-gray-500 text-sm">ou</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Botão Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.03z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.68 1.06-2.86 0-5.29-1.93-6.16-4.53H3.82v2.84C5.55 21.47 8.48 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H3.82C3.16 8.43 2.82 9.94 2.82 11.5s.34 3.07.82 4.43l2.02-1.5z"/>
                  <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97.82 12 .82 8.48.82 5.55 2.37 3.82 4.87l2.02 1.56c.73-2.04 2.48-3.45 4.63-3.45z"/>
                  <path fill="#EA4335" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.68 1.06-2.86 0-5.29-1.93-6.16-4.53H3.82v2.84C5.55 21.47 8.48 23 12 23z"/>
                </svg>
                Entrar com Google
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome do negócio</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => {
                    setBusinessName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="Ex: Barbearia do Zé"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Link do seu site</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm whitespace-nowrap">agendapro.com/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                    placeholder="barbearia-do-ze"
                    className="input flex-1"
                    required
                  />
                </div>
              </div>

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
                  placeholder="Mínimo 6 caracteres"
                  className="input"
                  minLength={6}
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
                  'Criar Conta Grátis'
                )}
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-gray-400 text-sm mb-4">
                Informe seu email para receber instruções de redefinição de senha.
              </p>
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Enviar Instruções'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
            {mode === 'login' && (
              <>
                Não tem conta?{' '}
                <button onClick={() => setMode('register')} className="text-indigo-400 hover:text-indigo-300">
                  Criar agora
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Já tem conta?{' '}
                <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300">
                  Fazer login
                </button>
              </>
            )}
            {mode === 'reset' && (
              <>
                Lembrou a senha?{' '}
                <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300">
                  Fazer login
                </button>
              </>
            )}
          </div>
        </div>

        {/* Esqueci minha senha */}
        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode('reset')}
              className="text-sm text-gray-400 hover:text-indigo-400 transition"
            >
              Esqueci minha senha
            </button>
          </div>
        )}
        {/* Modal de Configuração / Teste Google OAuth */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span>🔑</span> Configurar Login com Google
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Para usar o login real do Google, informe o seu <strong>Client ID</strong> do Google Cloud.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Google Client ID (.apps.googleusercontent.com)
                  </label>
                  <input
                    type="text"
                    value={inputClientId}
                    onChange={e => setInputClientId(e.target.value)}
                    placeholder="Ex: 123456789-abc...apps.googleusercontent.com"
                    className="input w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="btn btn-primary w-full mt-2 text-sm py-2"
                  >
                    Salvar Client ID e Entrar
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-400">ou modo de desenvolvimento</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Email de Teste (para simular login sem Google Cloud)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    className="input w-full text-sm mb-2"
                  />
                  <button
                    type="button"
                    onClick={handleDevGoogleLogin}
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition"
                  >
                    🚀 Entrar no Modo de Teste Rápido
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
