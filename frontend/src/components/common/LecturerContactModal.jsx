import React from 'react';
import { Mail, MessageCircle, X, UserCheck } from 'lucide-react';

const LecturerContactModal = ({ isOpen, onClose, lecturer }) => {
  if (!isOpen || !lecturer) return null;

  const handleWhatsApp = () => {
    const cleanPhone = lecturer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-indigo-600" />
            Lecturer Profile
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mb-3">
              {lecturer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <h3 className="text-xl font-bold text-slate-800">{lecturer.name}</h3>
            <p className="text-sm font-medium text-slate-500">Lecturer {lecturer.department ? `• ${lecturer.department}` : ''}</p>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 font-medium">Email</span>
              <span className="text-sm text-slate-800">{lecturer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500 font-medium">Phone Number</span>
              <span className="text-sm text-slate-800">{lecturer.phone}</span>
            </div>
            <div className="flex flex-col mt-2 pt-2 border-t border-slate-200">
              <span className="text-sm text-slate-500 font-medium mb-1">Office Hours</span>
              <span className="text-sm text-slate-800">{lecturer.officeHours || 'Mon-Wed 10:00 AM - 12:00 PM'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`mailto:${lecturer.email}`}
              className="flex items-center justify-center p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              <span className="font-medium">Send Email</span>
            </a>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-200"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerContactModal;
