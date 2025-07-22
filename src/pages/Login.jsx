import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';

const LoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user } = useAuth();

    // Rediriger si déjà connecté
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            if (user && user.role === 'operator') {
                navigate('/magasinier-simple', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, isLoading, user, navigate]);

    // Gérer le succès de la connexion
    const handleLoginSuccess = (user) => {
        // Rediriger selon le rôle de l'utilisateur
        if (user && user.role === 'operator') {
            navigate('/magasinier-simple', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    };

    // Affichage du loader pendant la vérification
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-its-50 to-its-100">
                <div className="text-center">
                    <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Ne pas afficher la page de login si déjà connecté
    if (isAuthenticated) {
        return null;
    }

    return <LoginForm onSuccess={handleLoginSuccess} />;
};

export default LoginPage;