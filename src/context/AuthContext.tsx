import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithEmail: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
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

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    const resetPassword = async (email: string) => {
        try {
            console.log('resetPassword chamado para:', email);
            // Get the current URL without hash and add recovery redirect
            const redirectUrl = new URL(window.location.href);
            redirectUrl.hash = 'type=recovery';
            console.log('redirectUrl:', redirectUrl.toString());

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl.toString(),
            });

            console.log('Supabase response - error:', error);
            if (error) {
                console.error('Supabase resetPasswordForEmail error:', error);
                throw error;
            }
            console.log('resetPassword completado com sucesso');
        } catch (err: any) {
            console.error('Erro em resetPassword:', err);
            throw err;
        }
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const inviteUser = async (email: string, fullName: string, role: 'admin' | 'growth_b2c' | 'analista_plurix') => {
        // Get the current URL and add invite redirect
        const redirectUrl = new URL(window.location.href);
        redirectUrl.hash = 'type=invite';

        // Send magic link to invite the user
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl.toString(),
            },
        });
        if (otpError) throw otpError;
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signInWithPassword, signOut, resetPassword, updatePassword, inviteUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
