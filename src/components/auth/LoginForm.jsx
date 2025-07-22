import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Schéma de validation
const loginSchema = yup.object().shape({
    email: yup
        .string()
        .required('Email requis')
        .email('Email invalide'),
    password: yup
        .string()
        .required('Mot de passe requis')
        .min(6, 'Minimum 6 caractères')
});

const LoginForm = ({ onSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const response = await login(data.email, data.password);
            toast.success('Connexion réussie !');
            if (onSuccess) {
                onSuccess(response.user);
            }
        } catch (error) {
            console.error('Erreur connexion:', error);
            toast.error(error.message || 'Erreur de connexion');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fillDemoAccount = (email, password) => {
        setValue('email', email);
        setValue('password', password);
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            {/* Colonne gauche - Formulaire */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8 bg-white">
                <div className="w-full max-w-sm">
                    {/* Logo et Titre */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-4">
                            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">ITS SÉNÉGAL</h1>
                        <p className="mt-2 text-sm text-gray-600">Système de Gestion de Stock Maritime</p>
                    </div>

                    {/* Titre du formulaire */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900">Bon retour !</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Connectez-vous pour accéder à votre espace
                        </p>
                    </div>

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse email
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-0 focus:border-blue-500 transition-colors ${
                                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                                placeholder="nom@its-sn.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Mot de passe */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-0 focus:border-blue-500 transition-colors ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input type="checkbox" className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-0" />
                                <span className="ml-2 text-sm text-gray-700">Se souvenir</span>
                            </label>
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                Mot de passe oublié ?
                            </a>
                        </div>

                        {/* Bouton connexion */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Connexion...' : 'Se connecter'}
                        </button>
                    </form>

                    {/* Comptes démo */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center mb-4">COMPTES DE DÉMONSTRATION</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => fillDemoAccount('admin@its-senegal.com', 'admin123')}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">Administrateur Système</p>
                                        <p className="text-xs text-gray-500">CRUD utilisateurs</p>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => fillDemoAccount('manager.dakar@its-senegal.com', 'manager123')}
                                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-xl transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">Resp. Contrôle Interne</p>
                                        <p className="text-xs text-gray-500">Supervision & validation</p>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <button
                                onClick={() => fillDemoAccount('operator.port@its-senegal.com', 'operator123')}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-900">Magasinier</p>
                                        <p className="text-xs text-gray-500">Opérateur terrain</p>
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne droite - Image/Info */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                {/* Image de fond */}
                <img
                    src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&q=80"
                    alt="Port maritime avec navires cargo"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay gradient maritime */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-cyan-800/90 to-teal-700/85"></div>

                {/* Motif de vagues animées */}
                <div className="absolute bottom-0 left-0 right-0 h-64 overflow-hidden">
                    <svg className="absolute bottom-0 w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 1440 320">
                        <path fill="white" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                {/* Contenu */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white">
                    <div>
                        {/* Badge */}
                        <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
                            <span className="text-sm font-medium">Système opérationnel 24/7</span>
                        </div>

                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            Naviguez vers l'excellence<br/>
                            <span className="text-cyan-300">maritime</span>
                        </h2>
                        <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                            Gérez vos stocks portuaires avec précision et efficacité grâce à notre plateforme dédiée au secteur maritime.
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-300">500+</div>
                                <div className="text-sm text-blue-200">Navires traités</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-300">98%</div>
                                <div className="text-sm text-blue-200">Satisfaction</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-cyan-300">24/7</div>
                                <div className="text-sm text-blue-200">Support</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <div className="flex items-center mb-4">
                                <svg className="w-6 h-6 text-cyan-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <h3 className="text-lg font-semibold">Fonctionnalités clés</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-400/20 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <span className="text-sm">Traçabilité complète des conteneurs maritimes</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-400/20 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <span className="text-sm">Gestion des quais et zones de stockage</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-400/20 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <span className="text-sm">Intégration avec les systèmes portuaires</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-400/20 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-cyan-300" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                    <span className="text-sm">Alertes automatiques et notifications</span>
                                </li>
                            </ul>
                        </div>

                        <div className="text-center">
                            <div className="flex items-center justify-center mb-3">
                                <svg className="w-5 h-5 text-cyan-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-sm font-medium text-cyan-200">
                                    Port Autonome de Dakar
                                </p>
                            </div>
                            <p className="text-xs text-blue-200">
                                © 2024 ITS Sénégal - Solutions Maritimes
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                                Immeuble ITS, Rue 19x06, Point E, Dakar | +221 33 869 45 67
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;