import { useState, useCallback, useEffect } from 'react';
import { Mail, User, Lock, Loader2, CheckCircle, Plus, Trash2, Shield, UserCheck, AlertTriangle } from 'lucide-react';

// Constantes de Role (Função)
const ROLES = [
    { value: 'manager', label: 'Gerente' },
    { value: 'member', label: 'Membro da Equipe' },
];

export default function TeamManager({ slug, userRole, token }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formStatus, setFormStatus] = useState('idle'); // idle, loading, success, error
    const [formError, setFormError] = useState(null);
    const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'member' });
    const [memberToDelete, setMemberToDelete] = useState(null); // Estado para o modal de confirmação

    // 1. Funções de Manipulação de Input ESTÁVEIS (CORREÇÃO DE FOCO)
    // Usamos useCallback para garantir que a função onChange não mude a cada render.
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setNewMember(p => ({ ...p, [name]: value }));
    }, []);
    
    // 2. Fetch Lista de Membros (ao carregar)
    const fetchMembers = useCallback(() => {
        setLoading(true);
        fetch('/api/team-members', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                 setMembers(data);
            } else {
                setFormError(data.error || "Erro ao carregar lista de membros.");
            }
        })
        .catch(err => setFormError("Erro ao comunicar com o servidor: " + err.message))
        .finally(() => setLoading(false));
    }, [token]);

    useEffect(() => {
        if (token) fetchMembers();
    }, [token, fetchMembers]);

    // 3. Submissão do Novo Membro
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setFormStatus('loading');
        setFormError(null);

        // Validação básica de campo
        if (!newMember.password || newMember.password.length < 6) {
             setFormError("A senha deve ter pelo menos 6 caracteres.");
             setFormStatus('error');
             setTimeout(() => setFormStatus('idle'), 3000);
             return;
        }

        const payload = { ...newMember }; 

        try {
            const response = await fetch('/api/team-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (response.status !== 204 && response.status !== 201) {
                const data = await response.json().catch(() => ({ error: 'Erro de rede desconhecido' }));
                if (response.status === 409) throw new Error("Este email já está cadastrado.");
                if (response.status === 403) throw new Error("Ação não permitida pelo seu cargo (Owner necessário).");
                throw new Error(data.error || 'Falha ao criar membro (Status: ' + response.status + ').');
            }

            // --- Sucesso: Limpa o formulário e recarrega a lista ---
            setFormStatus('success');
            setNewMember({ name: '', email: '', password: '', role: 'member' }); // Limpa formulário
            fetchMembers(); // Recarrega a lista
            
        } catch (err) {
            setFormError(err.message);
            setFormStatus('error');
        } finally {
            // Volta ao estado inicial após 3 segundos
            setTimeout(() => setFormStatus('idle'), 3000);
        }
    }, [newMember, token, fetchMembers]);

    // 4. Função de Exclusão (Chama a API DELETE)
    const handleConfirmDelete = useCallback(async () => {
        if (!memberToDelete) return;
        setFormStatus('loading');

        try {
            const response = await fetch(`/api/team-members/${memberToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 403) throw new Error("Permissão negada.");
            if (response.status !== 204) throw new Error("Erro ao excluir. O membro pode não existir.");
            
            fetchMembers(); // Recarrega a lista
            setMemberToDelete(null); // Fecha o modal
            setFormStatus('idle');

        } catch (err) {
            setFormError(err.message);
            setMemberToDelete(null);
            setFormStatus('error');
        }
    }, [memberToDelete, token, fetchMembers]);


    const isOwner = userRole === 'owner';

    return (
        <div className="space-y-8">
            {/* Modal de Confirmação de Exclusão */}
            {memberToDelete && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
                        <AlertTriangle size={40} className="mx-auto text-red-500 mb-4"/>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Confirma Exclusão?</h3>
                        <p className="text-slate-500 mb-6">
                            Você está prestes a remover o acesso de <strong>{memberToDelete.name}</strong> ({memberToDelete.email}). Esta ação é irreversível.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setMemberToDelete(null)} className="flex-1 py-3 rounded-lg font-bold bg-slate-100 hover:bg-slate-200">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmDelete} disabled={formStatus === 'loading'} className="flex-1 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-all">
                                {formStatus === 'loading' ? <Loader2 className="animate-spin mx-auto"/> : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Form de Cadastro de Novo Membro */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Plus className="text-blue-600" size={20}/>
                    Adicionar Novo Membro
                </h3>
                
                {!isOwner && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <Shield size={16}/> Seu cargo não permite adicionar novos usuários.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4" style={{ pointerEvents: isOwner ? 'auto' : 'none', opacity: isOwner ? 1 : 0.6 }}>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Nome */}
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input 
                                required type="text" placeholder="Nome" name="name" value={newMember.name}
                                onChange={handleInputChange} 
                                className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        {/* Email */}
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input 
                                required type="email" placeholder="Email" name="email" value={newMember.email}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Senha */}
                        <div className="relative col-span-2">
                            <Lock size={18} className="absolute left-3 top-3 text-slate-400"/>
                            <input 
                                required type="password" placeholder="Senha inicial (Mín. 6 caracteres)" name="password" value={newMember.password}
                                onChange={handleInputChange}
                                className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        {/* Cargo */}
                        <select 
                            name="role"
                            value={newMember.role}
                            onChange={handleInputChange} 
                            className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 focus:ring-blue-500 outline-none"
                        >
                            {ROLES.map(role => (
                                <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Mensagens de Status */}
                    {formStatus === 'success' && (
                        <div className="p-3 bg-green-50 text-green-700 font-semibold rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle size={16}/> Membro criado com sucesso! A lista foi atualizada.
                        </div>
                    )}
                    {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{formError}</div>}
                    
                    <button 
                        type="submit" disabled={formStatus === 'loading' || formStatus === 'success' || !isOwner}
                        className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {formStatus === 'loading' ? <Loader2 className="animate-spin"/> : 'Convidar e Criar Acesso'}
                    </button>
                </form>
            </div>

            {/* Lista de Membros Existentes */}
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserCheck className="text-slate-600" size={20}/>
                Equipe Atual ({members.length + 1}) {/* +1 para contar o Owner */}
            </h3>
            
            {loading && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-slate-400"/></div>}

            <div className="space-y-3">
                {/* O dono da loja não vem desta API, mas deve ser exibido como um card fixo */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center opacity-80">
                    <div>
                        <p className="font-bold text-blue-800 flex items-center gap-2">
                            Proprietário da Loja 
                        </p>
                        <p className="text-sm text-blue-600 font-mono">{slug} (Acesso Total)</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white">Owner</span>
                </div>

                {Array.isArray(members) && members.map(member => (
                    <div key={member.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-800">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                {ROLES.find(r => r.value === member.role)?.label || 'Membro'}
                            </span>
                            {/* Botão de exclusão visível apenas se for o Dono (isOwner) */}
                            {isOwner && (
                                <button 
                                    disabled={!isOwner}
                                    title="Remover Acesso"
                                    className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                    onClick={() => setMemberToDelete(member)}
                                >
                                    <Trash2 size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}