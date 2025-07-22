// src/components/Sidebar.jsx - Navigation sidebar pour ITS Sénégal
import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import Navigation from './Navigation';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    // Protection if the user isn't loaded yet.
    // This prevents rendering issues if authentication is asynchronous.
    if (!user) {
        return null;
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true" // For accessibility
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:relative lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header with logo and close button */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            {/* Logo/Icon placeholder */}
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                                ⛵
                            </div>
                            <div className="ml-3">
                                <h2 className="text-lg font-semibold text-gray-900">ITS Sénégal</h2>
                                <p className="text-xs text-gray-500">Trading & Shipping</p>
                            </div>
                        </div>
                        {/* Close button for mobile */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Close sidebar"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Main Navigation Area */}
                    <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
                        {/* The Navigation component will receive the user's role/permissions
                            and render links accordingly. onNavigate is for mobile to close sidebar after selection. */}
                        <Navigation userRole={user.role} onNavigate={onClose} />
                    </nav>

                    {/* User Info Footer */}
                    <div className="border-t border-gray-200 p-4">
                        <div className="flex items-center">
                            {/* User initials avatar */}
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold uppercase">
                                {user.prenom?.[0] || ''}{user.nom?.[0] || ''}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                    {user.prenom} {user.nom}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {/* Display full role label based on the user's role */}
                                    {user.role === 'manager' ? 'Manager / Administrateur' :
                                        user.role === 'operator' ? 'Chef de Magasin / Magasinier' :
                                            'Rôle Inconnu'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;