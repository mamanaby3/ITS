import React, { useState, useEffect } from 'react';
import { 
    UserCircleIcon, 
    EnvelopeIcon, 
    PhoneIcon, 
    BuildingOfficeIcon,
    KeyIcon,
    ShieldCheckIcon,
    CalendarIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '../components/ui/SimpleIcons';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { ROLE_LABELS } from '../utils/constants';
import { formatDate } from '../utils/formatters';
import { useMagasins } from '../hooks/useMagasins';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const { magasins } = useMagasins();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [formData, setFormData] = useState({
        nom: user?.nom || '',
        prenom: user?.prenom || '',
        email: user?.email || '',
        telephone: user?.telephone || '',
        adresse: user?.adresse || ''
    });
    
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                nom: user.nom || '',
                prenom: user.prenom || '',
                email: user.email || '',
                telephone: user.telephone || '',
                adresse: user.adresse || ''
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'newPassword') {
            checkPasswordStrength(value);
        }
    };
    
    const checkPasswordStrength = (password) => {
        let score = 0;
        let feedback = [];
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 2) feedback.push('Très faible');
        else if (score < 3) feedback.push('Faible');
        else if (score < 5) feedback.push('Moyen');
        else feedback.push('Fort');
        
        if (password.length < 8) feedback.push('Au moins 8 caractères');
        if (!/[a-z]/.test(password)) feedback.push('Une minuscule');
        if (!/[A-Z]/.test(password)) feedback.push('Une majuscule');
        if (!/[0-9]/.test(password)) feedback.push('Un chiffre');
        if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Un caractère spécial');
        
        setPasswordStrength({
            score: Math.min(score, 6),
            feedback: feedback.join(' • ')
        });
    };
    
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            // Simuler la mise à jour du profil
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mettre à jour le contexte utilisateur
            if (updateProfile) {
                updateProfile({ ...user, ...formData });
            }
            
            setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
            setIsEditing(false);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
            return;
        }
        
        if (passwordStrength.score < 3) {
            setMessage({ type: 'error', text: 'Le mot de passe est trop faible' });
            return;
        }
        
        setLoading(true);
        setMessage({ type: '', text: '' });
        
        try {
            // Simuler le changement de mot de passe
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors du changement de mot de passe' });
        } finally {
            setLoading(false);
        }
    };

    const getUserMagasin = () => {
        if (user?.magasin) {
            const magasin = magasins?.find(m => m.id === user.magasin);
            return magasin ? magasin.nom : user.magasin;
        }
        return 'Tous les magasins';
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
                <p className="text-gray-600">Gérez vos informations personnelles et vos paramètres de sécurité</p>
            </div>

            {/* Message de notification */}
            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                    ) : (
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Informations du compte */}
            <Card className="mb-6">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Informations du compte</h2>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                nom: user?.nom || '',
                                                prenom: user?.prenom || '',
                                                email: user?.email || '',
                                                telephone: user?.telephone || '',
                                                adresse: user?.adresse || ''
                                            });
                                        }}
                                    >
                                        Annuler
                                    </Button>
                                    <Button 
                                        variant="primary"
                                        onClick={handleUpdateProfile}
                                        disabled={loading}
                                    >
                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-900">{user?.nom || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="prenom"
                                    value={formData.prenom}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-900">{user?.prenom || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                                Email
                            </label>
                            {isEditing ? (
                                <Input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-900">{user?.email || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <PhoneIcon className="h-4 w-4 inline mr-1" />
                                Téléphone
                            </label>
                            {isEditing ? (
                                <Input
                                    type="tel"
                                    name="telephone"
                                    value={formData.telephone}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-900">{user?.telephone || '-'}</p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                                Adresse
                            </label>
                            {isEditing ? (
                                <Input
                                    type="text"
                                    name="adresse"
                                    value={formData.adresse}
                                    onChange={handleInputChange}
                                    className="w-full"
                                />
                            ) : (
                                <p className="text-gray-900">{user?.adresse || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Informations professionnelles */}
            <Card className="mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Informations professionnelles</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                                Rôle
                            </label>
                            <p className="text-gray-900 font-medium">
                                {ROLE_LABELS[user?.role] || user?.role}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                                Magasin
                            </label>
                            <p className="text-gray-900">{getUserMagasin()}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <UserCircleIcon className="h-4 w-4 inline mr-1" />
                                Nom d'utilisateur
                            </label>
                            <p className="text-gray-900">{user?.username || user?.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <CalendarIcon className="h-4 w-4 inline mr-1" />
                                Membre depuis
                            </label>
                            <p className="text-gray-900">
                                {user?.created_at ? formatDate(user.created_at) : 'Information non disponible'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Sécurité */}
            <Card>
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Sécurité</h2>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="flex items-center">
                                    <KeyIcon className="h-5 w-5 text-gray-500 mr-2" />
                                    <h3 className="font-medium text-gray-900">Mot de passe</h3>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Dernière modification : {user?.password_changed_at ? formatDate(user.password_changed_at) : 'Jamais'}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowPasswordModal(true)}
                            >
                                Changer
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Modal de changement de mot de passe */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    });
                    setMessage({ type: '', text: '' });
                }}
                title="Changer le mot de passe"
            >
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mot de passe actuel
                        </label>
                        <Input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nouveau mot de passe
                        </label>
                        <Input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            required
                            className="w-full"
                        />
                        {passwordData.newPassword && (
                            <div className="mt-2">
                                <div className="flex gap-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded ${
                                                i < passwordStrength.score
                                                    ? passwordStrength.score <= 2
                                                        ? 'bg-red-500'
                                                        : passwordStrength.score <= 4
                                                        ? 'bg-yellow-500'
                                                        : 'bg-green-500'
                                                    : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{passwordStrength.feedback}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmer le mot de passe
                        </label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            required
                            className="w-full"
                        />
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded text-sm ${
                            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordData({
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                });
                                setMessage({ type: '', text: '' });
                            }}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            {loading ? 'Changement...' : 'Changer le mot de passe'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Profile;