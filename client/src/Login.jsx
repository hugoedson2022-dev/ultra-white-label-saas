import { useState, useCallback } from 'react'; 
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // CORREÇÃO CRÍTICA: Funções de manipulação de estado memoizadas (estáveis)
  // O useCallback impede que a função seja recriada a cada renderização, evitando a perda de foco do input
  const handleEmailChange = useCallback(e => setEmail(e.target.value), []);
  const handlePasswordChange = useCallback(e => setPassword(e.target.value), []);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Falha no login');

      onLoginSuccess(data); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [email, password, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-800 w-full max-w-sm p-8 rounded-3xl shadow-2xl border border-slate-700 animate-slide-up">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Área do Parceiro</h1>
          <p className="text-slate-400 text-sm">Gerencie sua agenda com segurança</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors"
                placeholder="seu@email.com"
                value={email}
                onChange={handleEmailChange} // <<--- USANDO FUNÇÃO ESTÁVEL
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 p-3 rounded-xl focus:border-blue-500 outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange} // <<--- USANDO FUNÇÃO ESTÁVEL
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18}/></>}
          </button>

          <button type="button" onClick={onCancel} className="w-full text-slate-500 text-sm hover:text-white transition-colors py-2">
            Voltar ao site
          </button>
        </form>
      </div>
    </div>
  );
}