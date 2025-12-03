import { Calendar, Shield, Zap, CheckCircle, ArrowRight, Layout, Users, DollarSign } from 'lucide-react';

export default function Landing({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Navbar */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          UltraAgenda<span className="text-blue-500">.</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate('login')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Área do Cliente
          </button>
          <button 
            onClick={() => onNavigate('admin')} // Atalho direto para criar loja
            className="text-sm font-bold bg-white text-slate-900 px-4 py-2 rounded-full hover:bg-blue-50 transition-all"
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-4xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in">
          <Zap size={12} /> Novo: Integração com Pix
        </div>
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Seu negócio no piloto <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">automático</span>.
        </h1>
        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          A plataforma White-Label completa para barbearias, clínicas e centros de eventos. 
          Agendamento, pagamentos e gestão de equipe em um só lugar.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => onNavigate('demo_barber')}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-900/50 w-full sm:w-auto justify-center"
          >
            Ver Demo Barbearia <ArrowRight size={20} />
          </button>
          <button 
            onClick={() => onNavigate('demo_events')}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-lg flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
          >
            Ver Demo Eventos
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="bg-slate-800/50 py-24 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Layout} 
              title="Site Personalizado" 
              desc="Sua marca, suas cores. O cliente nem percebe que é uma plataforma terceirizada."
            />
            <FeatureCard 
              icon={DollarSign} 
              title="Pagamentos Pix" 
              desc="Receba sinais ou pagamentos integrais direto na sua conta, sem intermediários."
            />
            <FeatureCard 
              icon={Users} 
              title="Gestão de Equipe" 
              desc="Controle total sobre quem acessa o sistema, com permissões de Dono e Membro."
            />
          </div>
        </div>
      </section>

      {/* Pricing Simplificado */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-12">Simples e Transparente</h2>
        <div className="max-w-md mx-auto bg-gradient-to-b from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-xs font-bold px-3 py-1 rounded-bl-xl">POPULAR</div>
          <h3 className="text-xl text-slate-400 font-medium mb-2">Plano Pro</h3>
          <div className="text-5xl font-bold mb-6">R$ 97<span className="text-lg text-slate-500 font-normal">/mês</span></div>
          
          <ul className="space-y-4 text-left mb-8 text-slate-300">
            <li className="flex gap-3"><CheckCircle className="text-blue-500" size={20}/> Agendamentos Ilimitados</li>
            <li className="flex gap-3"><CheckCircle className="text-blue-500" size={20}/> Gestão Financeira</li>
            <li className="flex gap-3"><CheckCircle className="text-blue-500" size={20}/> Até 5 Membros na Equipe</li>
            <li className="flex gap-3"><CheckCircle className="text-blue-500" size={20}/> Suporte Prioritário</li>
          </ul>

          <button 
            onClick={() => onNavigate('admin')}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-colors"
          >
            Começar Agora
          </button>
          <p className="text-xs text-slate-500 mt-4">7 dias grátis. Cancele quando quiser.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 text-center text-slate-500 text-sm">
        <p>&copy; 2024 UltraAgenda SaaS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 transition-colors group">
      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="text-blue-500" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}