// src/services/auth.js
import AuthApiService from './auth-api';
import MockApiService from './mockApi';
import { USE_MOCK_API } from '../utils/constants';

// Sélectionner le service approprié selon la configuration
const authService = USE_MOCK_API ? MockApiService : AuthApiService;

// Exporter le service par défaut
export default authService;

// Exporter aussi les méthodes individuellement pour la compatibilité
export const login = (email, password) => authService.login(email, password);
export const logout = () => authService.logout();
export const register = (userData) => authService.register ? authService.register(userData) : Promise.reject(new Error('Registration not supported'));
export const getCurrentUser = () => authService.getCurrentUser();
export const changePassword = (oldPassword, newPassword) => authService.changePassword(oldPassword, newPassword);
export const isAuthenticated = () => authService.isAuthenticated();
export const getToken = () => authService.getToken();
export const getCurrentUserData = () => authService.getCurrentUserData();
export const getUserRole = () => authService.getUserRole();
export const getUserPermissions = () => authService.getUserPermissions();
export const hasPermission = (permission) => authService.hasPermission(permission);
export const hasRole = (...roles) => authService.hasRole(...roles);