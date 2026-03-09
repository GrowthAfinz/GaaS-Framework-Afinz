import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUpEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    inviteUser: (email: string, fullName: string, role: 'admin' | 'growth_b2c' | 'analista_plurix') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for persisted Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                setUser(session.user);
            }
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setSession(session);
                setUser(session.user);
            } else {
                setSession(null);
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithEmail = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.href,
            },
        });
        if (error) throw error;
    };

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUpEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const resetPassword = async (email: string) => {
        console.log('🔐 resetPassword INICIADO para:', email);

        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/#type=recovery`;
        console.log('🔗 Redirect URL:', redirectUrl);

        const result = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        console.log('📨 Resposta Supabase:', result);

        if (result.error) {
            console.error('❌ Erro do Supabase:', result.error.message);
            throw result.error;
        }

        console.log('✅ resetPassword SUCESSO');
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const inviteUser = async (email: string, fullName: string, role: 'admin' | 'growth_b2c' | 'analista_plurix') => {
        console.log('👤 inviteUser INICIADO para:', email, 'role:', role);

        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/#type=invite`;
        console.log('🔗 Redirect URL:', redirectUrl);

        const result = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl,
            },
        });

        console.log('📨 Resposta Supabase:', result);

        if (result.error) {
            console.error('❌ Erro do Supabase:', result.error.message);
            throw result.error;
        }

        console.log('✅ inviteUser SUCESSO');
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signInWithPassword, signUpEmail, signOut, resetPassword, updatePassword, inviteUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
