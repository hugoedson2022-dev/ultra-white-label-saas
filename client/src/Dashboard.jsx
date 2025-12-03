import { useState, useEffect, useCallback } from 'react';
// A importação está correta se o arquivo TeamManager.jsx estiver na mesma pasta (./src)
import TeamManager from './TeamManager';
import { Calendar, User, ArrowLeft, Loader2, CheckCircle, X, Clock, Users, ListChecks, Phone, Star, MapPin, DollarSign, BarChart2, AlertCircle } from 'lucide-react';

export default function Dashboard({ slug, onBack }) {
  // Estado para controle de abas: 'agenda' ou 'team'
  const [activeTab, setActiveTab] = useState('agenda');
  
  // Dados da Agenda
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NOVO: Dados de Estatísticas
  const [stats, setStats] = useState({ totalRevenue: "0.00", totalBookings: 0, stats: { confirmed: 0, cancelled: 0, completed: 0 } });
  const [statsError, setStatsError] = useState(null); // Novo estado para erro das estatísticas

  // Informações do Usuário logado
  const [userData, setUserData] = useState(null);

  // 1. CARREGA DADOS DO USUÁRIO E DA AGENDA
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserData(payload);
            
            if (payload.slug === slug) {
                if (activeTab === 'agenda') {
                    fetchBookings(token, slug);
                    fetchStats(token, slug); // Busca as estatísticas junto
                }
            }
        } catch (e) {
            console.error("Token inválido ou expirado. Desconectando.", e);
            localStorage.removeItem('authToken');
            onBack(); 
        }
    } else {
        onBack();
    }
  }, [slug, onBack, activeTab]);

  // 2. BUSCA DAS ESTATÍSTICAS (Função protegida)
  const fetchStats = useCallback((token, currentSlug) => {
    setStatsError(null);
    fetch(`/api/stats/${currentSlug}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      if (res.status === 401 || res.status === 403) throw new Error('Acesso negado para estatísticas.');
      // CORREÇÃO: Trata 404/500 que devolve HTML
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro do Servidor:", errorText);
        throw new Error(`Falha ao carregar estatísticas. (Status: ${res.status})`);
      }
      return res.json();
    })
    .then(data => setStats(data))
    .catch(err => setStatsError(err.message));
  }, []);

  // 3. BUSCA DA AGENDA (função protegida)
  const fetchBookings = useCallback((token, currentSlug) => {
    setLoading(true);
    
    fetch(`/api/bookings/${currentSlug}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) throw new Error('Sessão expirada.');
        return res.json();
      })
      .then(data => setBookings(data))
      .catch((err) => {
          console.error("Erro ao carregar agenda:", err);
          setBookings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // 4. ATUALIZA STATUS (função protegida)
  const updateStatus = async (id, newStatus) => {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));

      const token = localStorage.getItem('authToken');

      try {
        const response = await fetch(`/api/bookings/${id}`, {
          method: 'PATCH',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error('Ação não autorizada. Sessão expirada.');
        }

      } catch (err) {
        console.error("Erro ao atualizar status:", err);
        // Em caso de falha, forçamos a recarga completa (agenda e stats)
        const token = localStorage.getItem('authToken');
        fetchBookings(token, slug);
        fetchStats(token, slug); 
      }
      
      // Se a atualização for bem-sucedida, atualizamos as estatísticas
      fetchStats(token, slug); 
  };
  
  const canManageTeam = userData?.role === 'owner';
  
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans flex justify-center items-start">
      <div className="w-full max-w-2xl">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20}/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{userData.name}</h1>
                    {/* CORREÇÃO CRÍTICA: Verificação segura de role */}
                    <p className="text-sm text-slate-500">
                        Painel de Gestão ({userData.role ? userData.role.toUpperCase() : 'MEMBRO'})
                    </p>
                </div>
            </div>
            
            <button 
                onClick={() => {
                    localStorage.removeItem('authToken'); // Logout
                    onBack();
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
                Sair
            </button>
        </div>
        
        {/* ABAS DE NAVEGAÇÃO */}
        <div className="flex border-b border-slate-200 mb-6">
            <button 
                onClick={() => setActiveTab('agenda')}
                className={`py-3 px-6 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'agenda' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <ListChecks size={18}/> Agenda
            </button>
            
            {canManageTeam && (
                <button 
                    onClick={() => setActiveTab('team')}
                    className={`py-3 px-6 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'team' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <Users size={18}/> Equipe
                </button>
            )}
        </div>
        
        {/* --- CONTEÚDO DA ABA (RENDERIZAÇÃO CONDICIONAL) --- */}
        
        {activeTab === 'team' && (
            <TeamManager 
                slug={slug} 
                userRole={userData.role} 
                token={localStorage.getItem('authToken')}
            />
        )}
        
        {activeTab === 'agenda' && (
            <div className="space-y-8">
                {statsError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
                        <AlertCircle size={20}/> Falha ao carregar estatísticas: {statsError}
                    </div>
                )}
                {/* Cartões de Estatísticas */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <DollarSign className="text-green-500 mx-auto mb-2" size={24}/>
                        <p className="text-xs text-slate-500 font-medium">Valor Total</p>
                        <h3 className="font-bold text-lg text-slate-800">R$ {stats.totalRevenue}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <BarChart2 className="text-blue-500 mx-auto mb-2" size={24}/>
                        <p className="text-xs text-slate-500 font-medium">Total Agend.</p>
                        <h3 className="font-bold text-lg text-slate-800">{stats.totalBookings}</h3>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                        <CheckCircle className="text-purple-500 mx-auto mb-2" size={24}/>
                        <p className="text-xs text-slate-500 font-medium">Concluídos</p>
                        <h3 className="font-bold text-lg text-slate-800">{stats.stats.completed}</h3>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-4">Próximos Agendamentos</h3>

                {loading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                )}
                
                {!loading && bookings.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-4"/>
                        <p className="text-slate-500 font-medium">Nenhum agendamento encontrado.</p>
                    </div>
                )}

                <div className="space-y-4 pb-10">
                    {bookings.map((booking) => {
                        const statusConfig = {
                            confirmed: { color: 'bg-green-100 text-green-700', label: 'Confirmado' },
                            cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelado' },
                            completed: { color: 'bg-slate-100 text-slate-500', label: 'Concluído' }
                        };
                        const status = booking.status || 'confirmed';
                        const config = statusConfig[status] || statusConfig.confirmed;
                        
                        const dateObj = new Date(booking.booking_date);
                        const dayString = dateObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                        const timeString = booking.booking_time; 

                        return (
                        <div key={booking.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-l-4 border-blue-500/50 transition-all ${status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}>
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            
                            <div className="flex gap-4">
                                <div className="bg-blue-50 p-3 rounded-xl text-center min-w-[75px] h-fit">
                                    <span className="block text-xl font-bold text-blue-700">{timeString}</span>
                                    <span className="text-xs text-blue-500 font-bold uppercase">{dayString.slice(0,5)}</span>
                                </div>
                                
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        {booking.customer_name}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium mb-2">{booking.service_name}</p>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${config.color}`}>
                                            {config.label}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                            <Phone size={10}/> {booking.customer_phone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            {status === 'confirmed' && (
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button 
                                        onClick={() => updateStatus(booking.id, 'completed')}
                                        className="flex-1 sm:flex-none p-2 bg-slate-100 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                                        title="Concluir Atendimento"
                                    >
                                        <CheckCircle size={20}/>
                                    </button>
                                    
                                    <button 
                                        onClick={() => updateStatus(booking.id, 'cancelled')}
                                        className="flex-1 sm:flex-none p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                        title="Cancelar Reserva"
                                    >
                                        <X size={20}/>
                                    </button>
                                </div>
                            )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        )}
        
      </div>
    </div>
  );
}