import { create } from 'zustand';
import api from '../services/api';

const getInitialUser = () => {
    try {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
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
        if (!localStorage.getItem('auth_token')) return;
        
        try {
            const response = await api.get('/user');
            const userData = response.data;
            if (userData) {
                localStorage.setItem('auth_user', JSON.stringify(userData));
            }
            set({ user: userData, isAuthenticated: true });
        } catch (error) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));

export default useAuthStore;

