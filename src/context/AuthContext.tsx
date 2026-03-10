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
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSession(session);
                setUser(session.user);
            }
            setLoading(false);
        });

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

    const getBaseAppUrl = () => {
        const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
        if (configuredUrl && configuredUrl.trim().length > 0) {
            return configuredUrl.trim();
        }

        const isGithubPagesHost = window.location.hostname.endsWith('github.io');
        const isRootPath = window.location.pathname === '/' || window.location.pathname === '';

        if (isGithubPagesHost && isRootPath) {
            return `${window.location.origin}/GaaS-Framework-Afinz/`;
        }

        return `${window.location.origin}${window.location.pathname}`;
    };

    const getAuthRedirectUrl = (flow: 'recovery' | 'invite' | 'signin') => {
        const baseUrl = getBaseAppUrl();
        return `${baseUrl}#type=${flow}`;
    };

    const signInWithEmail = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: getAuthRedirectUrl('signin'),
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
                emailRedirectTo: getBaseAppUrl()
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
        const redirectUrl = getAuthRedirectUrl('recovery');

        const result = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
        });

        if (result.error) {
            throw result.error;
        }
    };

    const updatePassword = async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    };

    const inviteUser = async (email: string, fullName: string, role: 'admin' | 'growth_b2c' | 'analista_plurix') => {
        void fullName;
        void role;

        const redirectUrl = getAuthRedirectUrl('invite');

        const result = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl,
            },
        });

        if (result.error) {
            throw result.error;
        }
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
