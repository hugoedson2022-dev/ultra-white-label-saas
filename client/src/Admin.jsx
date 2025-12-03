import { useState, useCallback, memo, useMemo, useRef } from 'react';
import { Save, Loader2, CheckCircle, Plus, DollarSign, Store, Globe, ArrowLeft, Layout, Mail, Lock, Clock } from 'lucide-react';

const ThemeSelector = ({ currentTheme, onSelect }) => {
    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'slate'];
    return (
        <div className="grid grid-cols-6 gap-2">
            {colors.map(color => (
                <div key={color} onClick={() => onSelect(color)}
                     className={`h-10 rounded-lg cursor-pointer border-2 transition-all bg-${color}-600 ${currentTheme.primary.includes(color) ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`} />
            ))}
        </div>
    );
};

const AdminContent = ({ onBack }) => {
  // Refs para inputs
  const nameRef = useRef(null);
  const slugRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const whatsappRef = useRef(null);
  const pixKeyRef = useRef(null);
  const servicesRef = useRef(null);
  // Novos Refs de Horário
  const startRef = useRef(null);
  const endRef = useRef(null);

  const [themeState, setThemeState] = useState({ primary: 'bg-blue-600', accent: 'text-blue-500', background: 'bg-slate-50' });
  const [status, setStatus] = useState('idle');
  const theme = useMemo(() => themeState, [themeState]); 

  const handleThemeChange = useCallback((color) => {
    setThemeState({ primary: `bg-${color}-600`, accent: `text-${color}-500`, background: color === 'slate' ? 'bg-slate-100' : `bg-${color}-50` });
  }, []); 

  const handleSlugBlur = useCallback((e) => {
      if (slugRef.current) slugRef.current.value = e.target.value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }, []); 

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatus('loading'); 
    
    const name = nameRef.current?.value || '';
    const slug = slugRef.current?.value || '';
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    const whatsapp = whatsappRef.current?.value || '';
    const pixKey = pixKeyRef.current?.value || '';
    const servicesInput = servicesRef.current?.value || '';
    
    const work_start = startRef.current?.value || '09:00';
    const work_end = endRef.current?.value || '18:00';

    if (!email || !password || !name || !slug) {
        setStatus('error');
        alert("Preencha obrigatórios.");
        setTimeout(() => setStatus('idle'), 3000);
        return;
    }

    const servicesArray = servicesInput.split(',').map(s => s.trim()).filter(s => s !== '').map(name => ({ name: name, price: 50, duration: 45 }));
    
    const payload = { name, slug, email, password, whatsapp, pix_key: pixKey, theme, services: servicesArray, work_start, work_end };

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (response.status !== 204) throw new Error("Erro ao salvar");

      setStatus('success');
      // Limpa form
      [nameRef, slugRef, emailRef, passwordRef, whatsappRef, pixKeyRef, servicesRef].forEach(r => r.current.value = '');
      startRef.current.value = '09:00'; endRef.current.value = '18:00';
      
    } catch (err) {
      setStatus('error');
      alert(err.message);
    } finally { setTimeout(() => setStatus('idle'), 3000); }
  }, [theme]); 

  const InputGroup = ({ label, icon: Icon, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            {Icon && <Icon size={14} className="text-blue-500"/>} {label}
        </label>
        {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8 font-sans flex justify-center items-start">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-slate-800 text-slate-400 rounded-full hover:bg-slate-700 transition-colors"><ArrowLeft size={20}/></button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Novo Cliente</h1>
                    <p className="text-slate-400 text-sm">Cadastro completo</p>
                </div>
            </div>
        </div>

        <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid sm:grid-cols-2 gap-6">
              <InputGroup label="Nome" icon={Store}>
                <input ref={nameRef} required type="text" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" placeholder="Ex: Barbearia" />
              </InputGroup>
              <InputGroup label="Slug" icon={Globe}>
                <input ref={slugRef} required type="text" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" onBlur={handleSlugBlur} placeholder="ex: barbearia" />
              </InputGroup>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700 space-y-4">
                <p className="text-xs text-blue-400 font-bold uppercase mb-2">Acesso</p>
                <div className="grid sm:grid-cols-2 gap-6">
                    <InputGroup label="Email" icon={Mail}>
                        <input ref={emailRef} required type="email" className="w-full bg-slate-800 border border-slate-600 p-3 rounded-xl text-white outline-none" placeholder="admin@loja.com" />
                    </InputGroup>
                    <InputGroup label="Senha" icon={Lock}>
                        <input ref={passwordRef} required type="password" className="w-full bg-slate-800 border border-slate-600 p-3 rounded-xl text-white outline-none" placeholder="••••••" />
                    </InputGroup>
                </div>
            </div>

            {/* NOVO: CONFIGURAÇÃO DE HORÁRIO */}
            <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Abertura" icon={Clock}>
                    <input ref={startRef} type="time" defaultValue="09:00" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" />
                </InputGroup>
                <InputGroup label="Fechamento" icon={Clock}>
                    <input ref={endRef} type="time" defaultValue="18:00" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" />
                </InputGroup>
            </div>

            <InputGroup label="Pix" icon={DollarSign}>
                <input ref={pixKeyRef} type="text" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-green-400 outline-none font-mono" placeholder="Chave Pix" />
            </InputGroup>

            <InputGroup label="Serviços" icon={Plus}>
                <input ref={servicesRef} required type="text" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" placeholder="Corte, Barba..." />
            </InputGroup>

            <InputGroup label="Tema" icon={Layout}>
                <ThemeSelector currentTheme={theme} onSelect={handleThemeChange} />
            </InputGroup>

            <InputGroup label="WhatsApp" icon={null}>
                <input ref={whatsappRef} type="text" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white outline-none" placeholder="5511..." />
            </InputGroup>

            <div className="pt-4 border-t border-slate-700">
                <button disabled={status === 'loading'} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
                {status === 'loading' ? <Loader2 className="animate-spin"/> : 'Criar Loja'}
                </button>
                {status === 'success' && <div className="mt-4 p-3 bg-green-500/10 text-green-400 rounded-lg text-center text-sm flex justify-center gap-2"><CheckCircle size={16}/> Sucesso!</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default memo(AdminContent);