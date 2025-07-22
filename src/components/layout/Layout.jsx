import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header onMenuClick={toggleSidebar} />

                {/* Page content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
                        <p>&copy; 2024 ITS Sénégal. Tous droits réservés.</p>
                        <p className="mt-2 sm:mt-0">
                            Version 1.0.0 - Système de Gestion de Stock
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;