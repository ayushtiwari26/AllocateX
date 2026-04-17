
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organisation } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
    user: User | null;
    organisation: Organisation | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildAvatarUrl = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4c6ef5&color=fff`;

const hydrateUser = (rawUser: User): User => {
    const fallbackName = rawUser.fullName?.trim() || rawUser.displayName || rawUser.email.split('@')[0] || 'AllocateX User';
    const avatar = rawUser.avatar && rawUser.avatar.trim().length > 0 ? rawUser.avatar : buildAvatarUrl(fallbackName);

    return {
        ...rawUser,
        fullName: fallbackName,
        displayName: rawUser.displayName || fallbackName,
        avatar,
    };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedUser = localStorage.getItem('allocx_user_session');
        const savedOrg = localStorage.getItem('allocx_org_session');
        const savedAvatar = localStorage.getItem('allocx_user_avatar');
        
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser) as User;
                // Override avatar with saved one if exists
                if (savedAvatar) {
                    parsedUser.avatar = savedAvatar;
                }
                setUser(hydrateUser(parsedUser));
            } catch (error) {
                console.error('Failed to parse stored user session', error);
            }
        }

        if (savedOrg) {
            try {
                setOrganisation(JSON.parse(savedOrg));
            } catch (error) {
                console.error('Failed to parse stored organisation session', error);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (creds: any) => {
        try {
            const response = await authApi.login({
                email: creds.email,
                password: creds.password,
            });

            const employeeProfile = response.user.employee;
            const fullNameFromEmployee = employeeProfile
                ? `${employeeProfile.firstName ?? ''} ${employeeProfile.lastName ?? ''}`.trim()
                : '';

            const fallbackName = response.user.displayName || fullNameFromEmployee || response.user.email?.split('@')[0] || 'User';
            const fullName = fullNameFromEmployee || response.user.displayName || fallbackName;

            const avatar = employeeProfile?.photoUrl || response.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}`;

            const userData: User = {
                id: response.user.id,
                email: response.user.email,
                displayName: fallbackName,
                fullName,
                role: response.user.role || 'employee',
                organisationId: response.user.organizationId || '',
                avatar,
                employeeId: employeeProfile?.id,
            };

            const hydratedUser = hydrateUser(userData);
            setUser(hydratedUser);

            const org: Organisation = {
                id: response.user.organizationId || 'default-org',
                name: response.organisation?.name || 'AllocateX',
                industry: response.organisation?.industry || 'Technology',
                size: response.organisation?.size || 'medium',
                createdAt: response.organisation?.createdAt || new Date().toISOString(),
                logo: response.organisation?.logo,
            };
            setOrganisation(org);

            localStorage.setItem('allocx_user_session', JSON.stringify(hydratedUser));
            localStorage.setItem('allocx_org_session', JSON.stringify(org));
            localStorage.setItem('allocx_auth_token', response.token);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const signup = async (data: any) => {
        try {
            await authApi.register({
                email: data.email,
                displayName: data.organisationName || data.email.split('@')[0],
                role: 'admin',
                firstName: data.firstName || 'User',
                lastName: data.lastName || 'Name',
                designation: 'Administrator',
                department: 'Management',
            });
            
            // Auto login after signup
            await login({ email: data.email, password: data.password });
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setOrganisation(null);
        localStorage.removeItem('allocx_user_session');
        localStorage.removeItem('allocx_org_session');
        localStorage.removeItem('allocx_auth_token');
        window.location.href = '/signin';
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        
        const updatedUser = hydrateUser({
            ...user,
            ...updates,
        });
        
        setUser(updatedUser);
        localStorage.setItem('allocx_user_session', JSON.stringify(updatedUser));
        
        // Also save avatar separately for persistence
        if (updates.avatar) {
            localStorage.setItem('allocx_user_avatar', updates.avatar);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            organisation,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

