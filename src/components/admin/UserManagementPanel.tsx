import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { InviteUserModal } from './InviteUserModal';
import { Users, Plus, Loader2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../../context/UserRoleContext';

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (err) throw err;
      loadUsers(); // Reload users
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar role');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'growth_b2c': 'Growth B2C',
      'analista_plurix': 'Analista Plurix',
      'user': 'Usuário'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin': 'bg-red-500/10 text-red-300 border-red-500/20',
      'growth_b2c': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      'analista_plurix': 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      'user': 'bg-slate-500/10 text-slate-300 border-slate-500/20'
    };
    return colors[role] || colors['user'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-blue-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Gerenciar Usuários</h3>
            <p className="text-xs text-slate-400">{users.length} usuário(s) no sistema</p>
          </div>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg transition-all"
        >
          <Plus size={18} />
          Convidar Usuário
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-200 bg-red-500/20 p-4 rounded-lg border border-red-500/30">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Users size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">Nenhum usuário no sistema</p>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Convidar primeiro usuário
          </button>
        </div>
      ) : (
        /* Users Table */
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-300">Email</th>
                <th className="px-4 py-3 text-left font-bold text-slate-300">Nome</th>
                <th className="px-4 py-3 text-left font-bold text-slate-300">Papel</th>
                <th className="px-4 py-3 text-left font-bold text-slate-300">Criado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors">
                  <td className="px-4 py-3 text-slate-200">{user.email}</td>
                  <td className="px-4 py-3 text-slate-200">{user.full_name || '-'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all bg-slate-900/50 border-slate-700 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none`}
                    >
                      <option value="growth_b2c">Growth B2C</option>
                      <option value="analista_plurix">Analista Plurix</option>
                      <option value="admin">Administrador</option>
                      <option value="user">Usuário</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(user.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
};
