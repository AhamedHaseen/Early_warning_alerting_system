import React, { useState } from 'react';
import { FileText, Download, FileSpreadsheet, Users, Activity, BookOpen, X } from 'lucide-react';
import Swal from 'sweetalert2';

const reportTypes = [
  { id: 'attendance', title: 'Attendance Report', description: 'Comprehensive student attendance records across all courses.', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'performance', title: 'Student Performance Report', description: 'Detailed academic performance metrics and grades.', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'semester', title: 'Semester Result Report', description: 'Final compiled results for the concluded semester.', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'risk', title: 'Risk Report', description: 'Analysis of students at academic or attendance risk.', icon: Activity, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'lecturer', title: 'Lecturer Report', description: 'Lecturer workload, assigned courses, and evaluation metrics.', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'batch', title: 'Batch Report', description: 'Overall performance and statistics for specific student batches.', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
];

const Reports = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadFormat, setDownloadFormat] = useState(null); // 'pdf' or 'excel'

  const handleDownloadClick = (report, format) => {
    setSelectedReport(report);
    setDownloadFormat(format);
    setIsModalOpen(true);
  };

  const processDownload = (targetGroup) => {
    setIsModalOpen(false);
    Swal.fire('Generating Report...', `Your ${selectedReport.title} for ${targetGroup} is being downloaded as ${downloadFormat.toUpperCase()}.`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports Generation</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <p className="text-slate-600 mb-6">Select a report type to generate and download. You can export data in PDF or Excel formats for further analysis.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <div key={report.id} className="border border-slate-100 rounded-xl p-5 hover:shadow-md transition-shadow group bg-slate-50/50 hover:bg-white cursor-pointer flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 rounded-lg ${report.bg} flex items-center justify-center mr-3`}>
                  <report.icon className={`w-5 h-5 ${report.color}`} />
                </div>
                <h3 className="font-semibold text-slate-800">{report.title}</h3>
              </div>
              <p className="text-sm text-slate-500 flex-1 mb-6">{report.description}</p>
              
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleDownloadClick(report, 'pdf')} className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors group-hover:border-red-200 group-hover:text-red-600">
                  <Download className="w-4 h-4 mr-2" /> PDF
                </button>
                <button onClick={() => handleDownloadClick(report, 'excel')} className="flex-1 flex items-center justify-center px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors group-hover:border-emerald-200 group-hover:text-emerald-600">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">Select Target Group</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <p className="text-sm text-slate-600 mb-6">Who is this {selectedReport?.title} for?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => processDownload('Students')} className="w-full py-3 px-4 bg-blue-50 text-blue-700 font-medium rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
                For Students
              </button>
              <button onClick={() => processDownload('Lecturers')} className="w-full py-3 px-4 bg-emerald-50 text-emerald-700 font-medium rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200">
                For Lecturers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
