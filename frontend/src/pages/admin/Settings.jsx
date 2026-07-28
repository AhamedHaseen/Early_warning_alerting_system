import React, { useState } from 'react';
import { Shield, Mail, Database, History, Settings2, Save } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('roles');

  const tabs = [
    { id: 'roles', name: 'User Roles & Permissions', icon: Shield },
    { id: 'risk', name: 'Risk Thresholds', icon: Settings2 },
    { id: 'email', name: 'Email Settings', icon: Mail },
    { id: 'backup', name: 'Backup & Restore', icon: Database },
    { id: 'audit', name: 'Audit Logs', icon: History },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">System Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            >
              <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          
          {activeTab === 'roles' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Role Management</h2>
              <div className="space-y-4 text-sm text-slate-600">
                <p>Manage permissions for Admin, Lecturer, and Student roles.</p>
                {/* Simplified placeholder for role settings */}
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  Settings interface to toggle specific module access per role.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Risk Threshold Configuration</h2>
              <form className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">High Risk Attendance Threshold (%)</label>
                  <input type="number" defaultValue="50" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medium Risk Attendance Threshold (%)</label>
                  <input type="number" defaultValue="75" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">High Risk GPA Threshold</label>
                  <input type="number" step="0.1" defaultValue="2.0" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="pt-4">
                  <button type="button" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-200 flex items-center">
                    <Save className="w-4 h-4 mr-2" /> Save Thresholds
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">SMTP Configuration</h2>
              <form className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Server</label>
                  <input type="text" placeholder="smtp.example.com" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                  <input type="number" placeholder="587" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="pt-4">
                  <button type="button" className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-200 flex items-center">
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'backup' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">Database Backup</h2>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Manual Backup</h3>
                    <p className="text-sm text-blue-700 mt-1">Generate a full backup of the current database state.</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-blue-700 font-medium rounded-lg shadow-sm hover:bg-blue-50 transition-colors">Generate Backup</button>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between mt-4">
                  <div>
                    <h3 className="font-medium text-orange-900">Restore System</h3>
                    <p className="text-sm text-orange-700 mt-1">Upload a backup file to restore the system state.</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-orange-700 font-medium rounded-lg shadow-sm hover:bg-orange-50 transition-colors">Upload & Restore</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-4">System Audit Logs</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3">2026-06-22 10:45:12</td>
                      <td className="px-4 py-3 font-medium text-slate-800">Admin</td>
                      <td className="px-4 py-3">Updated Risk Thresholds</td>
                      <td className="px-4 py-3">192.168.1.105</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3">2026-06-22 09:30:05</td>
                      <td className="px-4 py-3 font-medium text-slate-800">Dr. Turing</td>
                      <td className="px-4 py-3">Created Assignment ASN002</td>
                      <td className="px-4 py-3">10.0.0.45</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
