import React from 'react';
import { Package, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

const SimplifiedInterface = ({ user, data, actions }) => {
    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm">
            {/* Header simplifié */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                <h2 className="text-lg font-semibold">ITS Sénégal</h2>
                <p className="text-sm opacity-90">Bonjour {user?.prenom}</p>
            </div>

            {/* Actions principales */}
            <div className="p-4 space-y-3">
                {actions?.map((action, index) => (
                    <button
                        key={index}
                        onClick={action.onClick}
                        className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                            action.primary 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                                : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <action.icon className="h-6 w-6 mr-3" />
                        <div className="text-left">
                            <div className="font-medium">{action.title}</div>
                            {action.subtitle && (
                                <div className="text-sm opacity-75">{action.subtitle}</div>
                            )}
                        </div>
                        {action.badge && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                {action.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Informations importantes */}
            {data && (
                <div className="p-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">Résumé</h3>
                    <div className="grid grid-cols-2 gap-3 text-center">
                        {data.stats?.map((stat, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                                <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                                <div className="text-xs text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alertes */}
            {data?.alerts && data.alerts.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1 text-orange-500" />
                        Alertes
                    </h3>
                    <div className="space-y-2">
                        {data.alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`p-2 rounded text-sm ${
                                    alert.type === 'warning' 
                                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                            >
                                {alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer avec heure */}
            <div className="p-3 bg-gray-50 rounded-b-lg text-center">
                <p className="text-xs text-gray-500">
                    Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
                </p>
            </div>
        </div>
    );
};

export default SimplifiedInterface;