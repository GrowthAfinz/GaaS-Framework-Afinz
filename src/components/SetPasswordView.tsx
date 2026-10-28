import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { AfinzLogo } from '../modules/paid-media-afinz/components/AfinzLogo';

export const SetPasswordView: React.FC<{ onPasswordSet?: () => void }> = ({ onPasswordSet }) => {
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.hash = '';
    }
  }, [user]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);

      setTimeout(() => {
        window.location.hash = '';
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
      console.error('Password update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-cyan-500 w-8 h-8" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-emerald-50 text-emerald-700 p-8 rounded-xl border border-emerald-200 text-center">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-lg font-bold mb-2">Senha definida com sucesso!</p>
          <p className="text-sm text-emerald-600 opacity-80">Redirecionando para a aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
        <div className="text-center">
          {/* Afinz Brand */}
          <div className="mb-8 flex flex-col items-center gap-3 select-none">
            <div className="flex items-center gap-3" style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}>
              <AfinzLogo height={32} />
              <div className="flex items-center gap-2">
                <div className="h-5 w-0.5 rounded-full bg-[#00C6CC]" />
                <span className="font-black text-2xl text-slate-800 tracking-tight">Growth as a Service</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Defina sua Senha</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Crie uma senha segura para acessar a plataforma
          </p>

          <form onSubmit={handleSetPassword} className="space-y-5">
            <div className="text-left group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider ml-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-white border border-slate-300 text-slate-900 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="text-left group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider ml-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-white border border-slate-300 text-slate-900 pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg flex items-center gap-2 border border-red-200">
                <AlertCircle size={14} className="text-red-500" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <>
                  Definir Senha
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-widest font-bold">
            <ShieldCheck size={12} />
            Ambiente Seguro & Criptografado
          </p>
        </div>
      </div>
    </div>
  );
};
