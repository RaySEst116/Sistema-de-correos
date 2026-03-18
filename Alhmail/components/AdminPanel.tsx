import React, { useState } from 'react';
import UserManagement from './UserManagement';
import ContactManagement from './ContactManagement';
import HealthStatus from './HealthStatus';

type AdminTab = 'users' | 'contacts' | 'health';

const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('users');

    const tabs = [
        { id: 'users' as AdminTab, label: 'Usuarios', icon: '👥' },
        { id: 'contacts' as AdminTab, label: 'Contactos', icon: '📇' },
        { id: 'health' as AdminTab, label: 'Estado', icon: '🏥' }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto py-6 px-4">
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'contacts' && <ContactManagement />}
                {activeTab === 'health' && <HealthStatus />}
            </div>
        </div>
    );
};

export default AdminPanel;
