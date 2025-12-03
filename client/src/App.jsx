import { useState, useEffect, useCallback } from 'react';
import Admin from './Admin';
import Dashboard from './Dashboard';
import Login from './Login';
import BookingModal from './BookingModal';
import Landing from './Landing'; // Importa a nova página
import { Scissors, Calendar, MapPin, Star, Shield, Clock, ChevronRight, Loader2, AlertCircle, Home } from 'lucide-react';

function App() {
  const DEV_KEY = "dev123"; 

  // MUDANÇA: O estado inicial agora é 'landing'
  const [view, setView] = useState('landing'); 
  const [slug, setSlug] = useState('barbearia');
  const [tenantsList, setTenantsList] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [selectedService, setSelectedService] = useState(null);

  const isDevMode = window.location.search.includes(`devkey=${DEV_KEY}`);

  // 1. Persistência de Sessão
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setSlug(payload.slug);
            setView('dashboard'); // Se já tiver login, vai pro Dashboard
            setLoading(false);
        } catch (e) {
            localStorage.removeItem('authToken');
            // Se token inválido, fica na landing
        }
    } else {
        setLoading(false); 
    }
  }, []);

  // 2. Lista de Clientes
  useEffect(() => {
    if (view !== 'client') return; 
    fetch('/api/tenants')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setTenantsList(data); })
      .catch(console.error);
  }, [view]);

  // 3. Configuração da Loja
  useEffect(() => {
    async function fetchConfig() {
      if (view !== 'client') return;
      setLoading(true);
      try {
        await new Promise(r => setTimeout(r, 400));
        const response = await fetch(`/api/config/${slug}`);
        if (!response.ok) throw new Error('Loja offline');
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, [slug, view, retry]);

  const handleLoginSuccess = useCallback((data) => {
    localStorage.setItem('authToken', data.token);
    setSlug(data.slug);
    setView('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    setSlug('barbearia');
    setView('landing'); // Logout volta para a Landing
  }, []);

  // Função de navegação da Landing Page
  const handleLandingNavigate = (target) => {
      if (target === 'login') setView('login');
      if (target === 'admin') setView('admin');
      if (target === 'demo_barber') {
          setSlug('barbearia');
          setView('client');
      }
      if (target === 'demo_events') {
          setSlug('eventos'); // Certifique-se de ter criado essa loja no setup.js
          setView('client');
      }
  };

  // --- ROTEAMENTO ---

  if (view === 'landing') {
      return <Landing onNavigate={handleLandingNavigate} />;
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center font-sans">
         <div className="w-full max-w-2xl relative">
            <button onClick={() => setView('landing')} className="fixed top-4 left-4 text-white hover:text-gray-300 flex items-center gap-2">← Voltar</button>
            <Admin onBack={() => setView('landing')} />
         </div>
      </div>
    );
  }

  if (view === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onCancel={() => setView('landing')} />;
  }

  if (view === 'dashboard') {
    return <Dashboard slug={slug} onBack={handleLogout} />;
  }

  // --- MODO CLIENTE (SITE) ---

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50"><Loader2 className="animate-spin text-neutral-400" size={32} /></div>;

  if (error) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"><AlertCircle className="text-red-500 mb-4" size={32} /><p>Erro ao carregar loja</p><button onClick={() => setView('landing')} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">Voltar ao Início</button></div>;

  const themeColor = config?.theme?.primary || 'bg-slate-900';
  const accentText = config?.theme?.accent || 'text-slate-600';

  return (
    <div className="min-h-screen bg-neutral-100 flex justify-center items-center font-sans antialiased sm:p-4 overflow-hidden">
      <div className="w-full max-w-md bg-white relative min-h-screen sm:min-h-0 sm:h-[80vh] sm:max-h-[800px] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-slate-900/5 transition-all">

        {/* Botões de Navegação */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
            {/* Botão HOME (Volta para Landing) */}
            <button onClick={() => setView('landing')} className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 border border-white/20 shadow-sm" title="Início">
                <Home size={14} />
            </button>
            
            {isDevMode && <button onClick={() => setView('admin')} className="w-8 h-8 bg-pink-600 hover:bg-pink-500 text-white rounded-full flex items-center justify-center shadow-md"><Shield size={14} /></button>}
            
            <button onClick={() => setView('login')} className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 border border-white/20 shadow-sm">
                <Calendar size={14} />
            </button>
        </div>

        <div className="absolute top-4 right-4 z-50">
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className="bg-white/90 backdrop-blur text-slate-800 text-xs py-1.5 px-3 rounded-full shadow-lg border-0 outline-none font-medium cursor-pointer hover:bg-white transition-colors">
                {tenantsList.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
            </select>
        </div>

        <header className={`${themeColor} text-white p-6 pt-24 shadow-lg transition-colors duration-500 rounded-b-3xl`}>
            <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                {slug.includes('barbearia') ? <Scissors size={32} /> : <Calendar size={32} />}
            </div>
            <div>
                <h1 className="text-2xl font-bold mb-1 leading-tight tracking-tight">{config.name}</h1>
                <p className="text-sm opacity-80">Agendamento Online</p>
            </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 bg-slate-50 scroll-smooth">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Serviços</h2>
                <span className="text-xs text-slate-400 font-medium">{config.services?.length || 0} opções</span>
            </div>

            <div className="space-y-3 pb-8">
                {config.services && config.services.map((service, index) => (
                    <div key={index} onClick={() => setSelectedService(service)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">{service.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {service.duration || 45} min</span>
                                </div>
                            </div>
                            <div className={`font-bold text-lg ${accentText}`}>R$ {service.price}</div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                            <button className={`text-sm font-medium ${accentText} flex items-center gap-1 group-hover:gap-2 transition-all`}>Agendar <ChevronRight size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </main>

        {selectedService && (
            <BookingModal service={selectedService} slug={slug} theme={config.theme} pixKey={config.pix_key} workStart={config.work_start} workEnd={config.work_end} onClose={() => setSelectedService(null)} />
        )}
      </div>
    </div>
  );
}

export default App;