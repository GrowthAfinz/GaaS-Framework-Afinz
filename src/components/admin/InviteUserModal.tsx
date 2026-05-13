import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, User, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { inviteUser } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'growth_b2c' | 'analista_plurix'>('growth_b2c');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!fullName.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteUser(email, fullName, role);
      setSuccess(true);
      setTimeout(() => {
        setEmail('');
        setFullName('');
        setRole('growth_b2c');
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao convidar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Convidar Usuário</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-emerald-400 font-bold mb-2">Convite enviado com sucesso!</p>
            <p className="text-slate-400 text-sm">Um link de acesso foi enviado para {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="usuario@afinz.com.br"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
                  placeholder="João Silva"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Papel</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'growth_b2c' | 'analista_plurix')}
                className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
              >
                <option value="growth_b2c">Growth B2C</option>
                <option value="analista_plurix">Analista Plurix</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-200 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Convidar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
