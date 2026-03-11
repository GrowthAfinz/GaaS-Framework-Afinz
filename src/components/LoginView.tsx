import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { AfinzLogo } from '../modules/paid-media-afinz/components/AfinzLogo';

type AuthMode = 'login' | 'signup' | 'reset';

export const LoginView: React.FC = () => {
    const { signInWithPassword, signUpEmail, resetPassword, loading } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (mode === 'login') {
                await signInWithPassword(email, password);
            } else if (mode === 'signup') {
                if (password.length < 6) {
                    throw new Error('A senha deve ter no mínimo 6 caracteres.');
                }
                await signUpEmail(email, password);
                setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar a conta (pode cair no Spam).');
            } else if (mode === 'reset') {
                await resetPassword(email);
                setSuccessMsg('As instruções de redefinição foram enviadas para seu e-mail.');
            }
        } catch (err: any) {
            if (err.message.includes('Invalid login credentials')) {
                setError('E-mail ou senha incorretos.');
            } else if (err.message.includes('User already registered')) {
                setError('Este e-mail já está cadastrado.');
            } else {
                setError(err.message || 'Ocorreu um erro ao processar a solicitação.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                    {/* Afinz Brand */}
                    <div className="mb-8 flex flex-col items-center gap-4 select-none">
                        <div className="flex items-center gap-4" style={{ fontFamily: "Calibri, 'Trebuchet MS', sans-serif" }}>
                            <AfinzLogo height={48} />
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 rounded-full bg-[#00C6CC]" />
                                <span className="font-black text-3xl text-slate-800 tracking-tight">Growth as a Service</span>
                            </div>
                        </div>
                    </div>

                    {mode !== 'login' && (
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                            {mode === 'signup' ? 'Novo Cadastro' : 'Redefinir Senha'}
                        </h2>
                    )}
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        {mode === 'login' && 'Autentique-se para gerenciar o painel de planejamento, dashboards e ferramentas do sistema GaaS.'}
                        {mode === 'signup' && 'Crie sua conta corporativa para acessar a nuvem.'}
                        {mode === 'reset' && 'Enviaremos um link para você redefinir sua senha de acesso.'}
                    </p>

                    {successMsg ? (
                        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl text-sm border border-emerald-200 text-left mb-6">
                            <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700">
                                <CheckCircle size={18} />
                                <span>Sucesso!</span>
                            </div>
                            <p className="leading-relaxed">{successMsg}</p>
                            <button
                                onClick={() => { setMode('login'); setSuccessMsg(null); }}
                                className="mt-6 w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                            >
                                Voltar para o Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 text-left">
                            <div className="group">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-widest ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-white border border-slate-300 text-slate-900 pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="seu.email@afinz.com.br"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {mode !== 'reset' && (
                                <div className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha</label>
                                        {mode === 'login' && (
                                            <button
                                                type="button"
                                                onClick={() => setMode('reset')}
                                                className="text-[11px] font-bold text-slate-400 hover:text-cyan-600 transition-colors tracking-wide"
                                            >
                                                Esqueceu a senha?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-cyan-500 transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-white border border-slate-300 text-slate-900 pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 outline-none transition-all placeholder:text-slate-400 font-medium tracking-widest"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="text-xs text-red-700 bg-red-50 p-3.5 rounded-xl flex items-start gap-2.5 border border-red-200">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                                    <span className="leading-relaxed font-medium">{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                    <>
                                        {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar e Acessar' : 'Enviar Link de Recuperação'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {!successMsg && (
                        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-3">
                            {mode === 'login' ? (
                                <button
                                    type="button"
                                    onClick={() => setMode('signup')}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors tracking-wide flex items-center justify-center gap-2 mx-auto"
                                >
                                    Não possui conta? Cadastre-se agora
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors tracking-wide flex items-center justify-center gap-2 mx-auto"
                                >
                                    <KeyRound size={14} />
                                    Já possui cadastro? Fazer Login
                                </button>
                            )}
                        </div>
                    )}

                    <p className="mt-8 text-[10px] text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-widest font-bold">
                        <ShieldCheck size={14} />
                        Conexão Criptografada e Segura
                    </p>
                </div>
            </div>
        </div>
    );
};
