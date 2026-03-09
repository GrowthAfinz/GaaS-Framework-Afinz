import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
    const { signInWithPassword, loading } = useAuth();
    const [emailInput, setEmailInput] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError(null);
        try {
            await signInWithPassword(emailInput, passwordInput);
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center bg-slate-900"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    }

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 text-center">

                    {/* Modern CSS Logo */}
                    {/* GaaS Brand - Refined */}
                    <div className="mb-10 flex flex-col items-center justify-center animate-fade-in select-none">
                        <div className="bg-black p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-1">
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent leading-none tracking-tight">
                                GaaS
                            </h1>
                            <span className="text-sm font-bold text-white tracking-widest uppercase leading-tight opacity-90 pl-0.5">
                                AFINZ
                            </span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Login Corporativo</h2>
                    <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                        Acesse a área segura para sincronizar dados e gerenciar arquivos na nuvem.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="text-left group">
                            <label className="block text-xs font-bold text-blue-400 uppercase mb-2 tracking-wider ml-1">Email <span className="opacity-50">(@afinz.com.br)</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="seu.nome@afinz.com.br"
                                    value={emailInput}
                                    onChange={e => setEmailInput(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="text-left group">
                            <label className="block text-xs font-bold text-blue-400 uppercase mb-2 tracking-wider ml-1">Senha</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={passwordInput}
                                    onChange={e => setPasswordInput(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs text-red-200 bg-red-500/20 p-3 rounded-lg flex items-center gap-2 border border-red-500/30">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    Entrar
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-1.5 opacity-60">
                        <ShieldCheck size={12} />
                        Ambiente Seguro & Criptografado
                    </p>
                </div>
            </div>
        </div>
    );
};
