import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

export type Role = 'admin' | 'growth_b2c' | 'analista_plurix';
export type BU = 'B2C' | 'B2B2C' | 'Plurix';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

interface UserRoleContextType {
  profile: UserProfile | null;
  role: Role | null;
  isAdmin: boolean;
  isGrowthB2C: boolean;
  isPlurixAnalyst: boolean;
  isBULocked: boolean;
  lockedBUs: BU[];
  canSeeTab: (tabId: string) => boolean;
  loadingProfile: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setProfile(data as UserProfile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        setProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user]);

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isGrowthB2C = role === 'growth_b2c';
  const isPlurixAnalyst = role === 'analista_plurix';
  const isBULocked = isPlurixAnalyst;
  const lockedBUs: BU[] = isPlurixAnalyst ? ['Plurix'] : [];

  const canSeeTab = (tabId: string): boolean => {
    // Analista Plurix não vê a aba de Originação B2C
    if (isPlurixAnalyst && tabId === 'originacao-b2c') {
      return false;
    }
    return true;
  };

  return (
    <UserRoleContext.Provider
      value={{
        profile,
        role,
        isAdmin,
        isGrowthB2C,
        isPlurixAnalyst,
        isBULocked,
        lockedBUs,
        canSeeTab,
        loadingProfile,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within UserRoleProvider');
  }
  return context;
};
