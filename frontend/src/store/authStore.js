import { create } from 'zustand';
import api from '../services/api';

const parseJwt = (token) => {
    try {
        if (!token) return null;
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

const getInitialUser = () => {
    try {
        const stored = localStorage.getItem('auth_user');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === 'object') return parsed;
        }
    } catch {
        // ignore
    }

    try {
        const token = localStorage.getItem('auth_token');
        if (token) {
            const jwtUser = parseJwt(token);
            if (jwtUser) {
                return {
                    id: jwtUser.id,
                    name: jwtUser.name,
                    email: jwtUser.email,
                    role: jwtUser.role,
                    roles: jwtUser.roles || [jwtUser.role].filter(Boolean),
                    permissions: jwtUser.permissions || []
                };
            }
        }
    } catch {
        // ignore
    }

    return null;
};

const useAuthStore = create((set) => ({
    user: getInitialUser(),
    token: localStorage.getItem('auth_token') || null,
    isAuthenticated: !!localStorage.getItem('auth_token'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });
            const { access_token, user } = response.data;
            
            localStorage.setItem('auth_token', access_token);
            if (user) {
                localStorage.setItem('auth_user', JSON.stringify(user));
            }
            set({ 
                user, 
                token: access_token, 
                isAuthenticated: true, 
                loading: false 
            });
            return true;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Login failed', 
                loading: false 
            });
            return false;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },

    fetchUser: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        try {
            const response = await api.get('/user');
            const userData = response.data;
            if (userData) {
                localStorage.setItem('auth_user', JSON.stringify(userData));
                set({ user: userData, isAuthenticated: true });
            }
        } catch (error) {
            // Only remove auth if 401 Unauthorized
            if (error.response?.status === 401) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                set({ user: null, token: null, isAuthenticated: false });
            }
        }
    },
}));

export default useAuthStore;


