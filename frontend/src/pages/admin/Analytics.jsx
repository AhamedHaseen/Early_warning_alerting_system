import React from 'react';
import { TrendingUp, Users, Activity, Award, BarChart3, PieChart } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">System Analytics</h1>
        <div className="flex space-x-3">
          <select className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-600 font-medium">
            <option>Current Semester</option>
            <option>Last Semester</option>
            <option>Academic Year 2023/24</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Attendance</p>
            <h3 className="text-2xl font-bold text-slate-800">84.5%</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. GPA</p>
            <h3 className="text-2xl font-bold text-slate-800">3.12</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">High Risk Students</p>
            <h3 className="text-2xl font-bold text-slate-800">42</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pass Rate</p>
            <h3 className="text-2xl font-bold text-slate-800">92.8%</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-slate-400" /> Attendance Trend
            </h3>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [Line Chart Placeholder: Attendance over weeks]
          </div>
        </div>

        {/* Performance Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-slate-400" /> Performance Trend
            </h3>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [Bar Chart Placeholder: Avg grades per batch]
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-slate-400" /> Risk Distribution
            </h3>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [Donut Chart Placeholder: Low/Medium/High Risk]
          </div>
        </div>

        {/* Department Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-96">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-slate-400" /> Department Comparison
            </h3>
          </div>
          <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400">
            [Radar Chart Placeholder: KPIs per department]
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
