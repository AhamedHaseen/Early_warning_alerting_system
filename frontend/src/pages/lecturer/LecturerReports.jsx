import React from 'react';
import { FileBarChart, Download, Calendar, BookOpen, AlertTriangle, TrendingUp, Filter } from 'lucide-react';

const LecturerReports = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Lecturer Reports</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-slate-400" /> Report Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
            <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option>All My Courses</option>
              <option>CS101 - Intro to Programming</option>
              <option>SE201 - Software Architecture</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Batch</label>
            <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white">
              <option>All Batches</option>
              <option>CS 2023/24 Group A</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
            <div className="flex items-center space-x-2">
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
              <span className="text-slate-400">-</span>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Attendance Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:border-blue-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Attendance Report</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">Generate comprehensive attendance records, identify patterns, and find students with low attendance.</p>
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> PDF
            </button>
            <button className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> Excel
            </button>
          </div>
        </div>

        {/* Assignment Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:border-purple-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Assignment Report</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">Submission statistics, grading averages, and missing assignment tracking across all your courses.</p>
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> PDF
            </button>
            <button className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> Excel
            </button>
          </div>
        </div>

        {/* Performance Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:border-indigo-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Performance Report</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">Overall course performance, GPA averages, exam results, and grade distribution analytics.</p>
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> PDF
            </button>
            <button className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> Excel
            </button>
          </div>
        </div>

        {/* Risk Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col hover:border-red-200 hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Risk Report</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">List of High/Medium risk students, early warning signals, and intervention history logs.</p>
          <div className="flex space-x-2">
            <button className="flex-1 px-3 py-2 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> PDF
            </button>
            <button className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center">
              <Download className="w-3 h-3 mr-1" /> Excel
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LecturerReports;
