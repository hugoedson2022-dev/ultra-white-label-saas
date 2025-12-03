import { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Loader2, CheckCircle, QrCode, Copy, ChevronLeft, AlertCircle } from 'lucide-react';

export default function BookingModal({ service, slug, theme, pixKey, workStart, workEnd, breakStart, breakEnd, onClose }) {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', 
    phone: '', 
    date: new Date().toISOString().split('T')[0], 
    time: ''
  });

  const [busySlots, setBusySlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  // 1. GERADOR DE HORÁRIOS DINÂMICOS (Com Intervalo)
  useEffect(() => {
      const startHour = parseInt((workStart || '09:00').split(':')[0]);
      const endHour = parseInt((workEnd || '18:00').split(':')[0]);
      
      const slots = [];
      
      for (let i = startHour; i < endHour; i++) {
          // Formata 9 -> "09"
          const hourStr = i.toString().padStart(2, '0');
          
          // Gera slots de :00 e :30
          ['00', '30'].forEach(minute => {
              const currentTime = `${hourStr}:${minute}`;
              
              // Lógica de Intervalo (Break)
              let isBreak = false;
              if (breakStart && breakEnd) {
                  // Se o horário atual estiver dentro do intervalo de pausa
                  if (currentTime >= breakStart && currentTime < breakEnd) {
                      isBreak = true;
                  }
              }
              
              if (!isBreak) {
                  slots.push(currentTime);
              }
          });
      }
      setTimeSlots(slots);
  }, [workStart, workEnd, breakStart, breakEnd]);

  // 2. Busca Disponibilidade
  useEffect(() => {
    async function fetchAvailability() {
      if (!formData.date) return;
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/availability?slug=${slug}&date=${formData.date}`);
        const data = await res.json();
        setBusySlots(data || []);
      } catch (err) { console.error(err); } 
      finally { setLoadingSlots(false); }
    }
    fetchAvailability();
  }, [formData.date, slug]);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if(!formData.time) return setErrorMessage("Selecione um horário.");
    
    // Se tiver chave Pix válida, vai para pagamento
    if (pixKey && pixKey.length > 3) setStep('payment');
    else submitBooking();
  };

  async function submitBooking() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_slug: slug,
          service_name: service.name,
          customer_name: formData.name,
          customer_phone: formData.phone,
          booking_date: formData.date,
          booking_time: formData.time
        })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) throw new Error("Horário já reservado.");
        throw new Error(data.error || 'Erro.');
      }
      setStep('success');
    } catch (err) {
      setErrorMessage(err.message);
      if (err.message.includes('reservado')) setBusySlots(prev => [...prev, formData.time]);
    } finally { setLoading(false); }
  }

  // Componente de Cabeçalho Reutilizável
  const Header = ({ title, subtitle, showBack }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {showBack && <button onClick={() => setStep('form')} className="-ml-2 p-1 text-slate-400 hover:text-slate-600"><ChevronLeft/></button>}
        <div>
            <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
      </div>
      <button onClick={onClose} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><X size={18}/></button>
    </div>
  );

  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-slide-up">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Confirmado!</h2>
          <p className="text-slate-500 mb-8 text-sm">Agendamento para <strong>{formData.date.split('-').reverse().join('/')}</strong> às <strong>{formData.time}</strong>.</p>
          <button onClick={onClose} className={`w-full py-4 rounded-xl font-bold text-white shadow-lg bg-green-600 hover:bg-green-700 active:scale-95 transition-all`}>Entendido</button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up flex flex-col">
            <Header title="Pagamento" subtitle="Faça o Pix" showBack={true} />
            <div className="flex-1 flex flex-col items-center justify-center py-4">
                <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-6 cursor-pointer" onClick={() => navigator.clipboard.writeText(pixKey)}>
                    <QrCode size={160} className="text-slate-800" />
                </div>
                <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between gap-3 mb-6">
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Chave Pix</p>
                        <p className="text-sm font-mono font-medium text-slate-700 truncate">{pixKey}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 p-2" onClick={() => navigator.clipboard.writeText(pixKey)}><Copy size={20}/></button>
                </div>
            </div>
            <button onClick={submitBooking} disabled={loading} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 ${theme?.primary || 'bg-slate-900'} active:scale-95 transition-all`}>
                {loading ? <Loader2 className="animate-spin"/> : 'Já fiz o pagamento'}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto animate-slide-up flex flex-col">
        <Header title={service.name} subtitle={`Duração: ${service.duration || 45} min`} />
        
        <form onSubmit={handlePreSubmit} className="space-y-6 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Data</label>
            <div className="relative">
                <input type="date" required value={formData.date} className="w-full bg-slate-50 border-0 p-4 pl-12 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    onChange={e => setFormData({...formData, date: e.target.value, time: ''})} />
                <Calendar className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20}/>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Horário</label>
                {loadingSlots && <Loader2 size={12} className="animate-spin text-blue-500"/>}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(slot => {
                const isBusy = busySlots.includes(slot);
                const isSelected = formData.time === slot;
                return (
                  <button key={slot} type="button" disabled={isBusy} onClick={() => setFormData({...formData, time: slot})}
                    className={`py-2.5 text-sm font-medium rounded-lg transition-all border ${isBusy ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed decoration-slice line-through' : isSelected ? `${theme?.primary || 'bg-slate-900'} text-white border-transparent shadow-lg scale-105` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                    {slot}
                  </button>
                )
              })}
            </div>
            {timeSlots.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Nenhum horário disponível (Loja Fechada).</p>}
          </div>

          <div className="space-y-3">
            <div className="relative">
                <input required type="text" placeholder="Seu Nome" className="w-full bg-slate-50 border-0 p-4 pl-12 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                <User className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20}/>
            </div>
            <div className="relative">
                <input required type="tel" placeholder="Seu WhatsApp" className="w-full bg-slate-50 border-0 p-4 pl-12 rounded-xl text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                <Phone className="absolute left-4 top-4 text-slate-400 pointer-events-none" size={20}/>
            </div>
          </div>

          {errorMessage && <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm flex items-center gap-2 border border-red-100"><AlertCircle size={16}/> {errorMessage}</div>}

          <button type="submit" disabled={loading || !formData.time} className={`w-full py-4 rounded-xl font-bold text-white shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${theme?.primary || 'bg-slate-900'}`}>
            {loading ? <Loader2 className="animate-spin"/> : (pixKey ? 'Continuar' : 'Confirmar Reserva')}
          </button>
        </form>
      </div>
    </div>
  );
}