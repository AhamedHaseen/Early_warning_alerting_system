import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Save, Key, Mail, Smartphone } from 'lucide-react';

const StudentSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Settings Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-24">
            <nav className="flex flex-col p-2 space-y-1">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <User className={`w-5 h-5 mr-3 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} />
                Profile Information
              </button>
              <button 
                onClick={() => setActiveTab('password')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'password' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Lock className={`w-5 h-5 mr-3 ${activeTab === 'password' ? 'text-blue-600' : 'text-slate-400'}`} />
                Security & Password
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Bell className={`w-5 h-5 mr-3 ${activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400'}`} />
                Notification Preferences
              </button>
              <button 
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'privacy' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Shield className={`w-5 h-5 mr-3 ${activeTab === 'privacy' ? 'text-blue-600' : 'text-slate-400'}`} />
                Privacy
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            
            {activeTab === 'profile' && (
              <div className="animate-in fade-in">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Profile Information</h2>
                  <p className="text-sm text-slate-500">Update your personal details and public profile.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                      <User className="w-10 h-10 text-slate-400" />
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm mb-2">
                        Change Picture
                      </button>
                      <p className="text-xs text-slate-500">JPG, GIF or PNG. Max size of 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input type="text" defaultValue="John" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input type="text" defaultValue="Doe" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" defaultValue="john.doe@student.university.edu" disabled className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">University emails cannot be changed directly.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" defaultValue="+94 77 123 4567" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Tagline</label>
                      <input type="text" placeholder="Computer Science Undergrad | Coding Enthusiast" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                        <input type="text" defaultValue="Robert Doe" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                        <input type="text" defaultValue="Father" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Contact</label>
                        <input type="tel" defaultValue="+94 77 987 6543" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Email</label>
                        <input type="email" defaultValue="robert.doe@example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="animate-in fade-in">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Security & Password</h2>
                  <p className="text-sm text-slate-500">Manage your password and security settings.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-4">
                    <Key className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Password Requirements</h4>
                      <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Minimum 8 characters long</li>
                        <li>At least one uppercase and one lowercase letter</li>
                        <li>At least one number and one special character</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50" />
                    </div>
                  </div>

                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="animate-in fade-in">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Choose what updates you want to receive and how.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Academic Alerts</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Assignment Deadlines</p>
                        <p className="text-xs text-slate-500">Get notified 24 hours before an assignment is due.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Attendance Warnings</p>
                        <p className="text-xs text-slate-500">Receive an alert if attendance drops below 80%.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">New Grades Published</p>
                        <p className="text-xs text-slate-500">Notify me immediately when new marks are entered.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">University Events & News</h3>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Events and Workshops</p>
                        <p className="text-xs text-slate-500">Invitations to academic seminars and career fairs.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="animate-in fade-in">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Privacy Settings</h2>
                  <p className="text-sm text-slate-500">Control who can see your information.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Public Profile</p>
                      <p className="text-xs text-slate-500">Allow other students to find you in the directory.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentSettings;
