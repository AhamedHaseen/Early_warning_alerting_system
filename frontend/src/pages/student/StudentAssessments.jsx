import React, { useState, useEffect } from 'react';
import { Award, FileText, Download, GraduationCap, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';

const mockSemesterResults = [
  { id: 1, subject: 'Programming (CS101)', credits: 4, grade: 'A', gpa: 4.0, status: 'Pass' },
  { id: 2, subject: 'Databases (CS102)', credits: 3, grade: 'A-', gpa: 3.7, status: 'Pass' },
  { id: 3, subject: 'Software Eng (SE201)', credits: 4, grade: 'B+', gpa: 3.3, status: 'Pass' },
  { id: 4, subject: 'Mathematics (MA101)', credits: 3, grade: 'C', gpa: 2.0, status: 'Pass' },
];

const StudentAssessments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('exams');
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchExamResults();
    }
  }, [user]);

  const fetchExamResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exam_results')
        .select('*, modules(name)')
        .eq('student_id', user.id)
        .eq('released', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExamResults(data || []);
    } catch (err) {
      console.error('Failed to fetch exam results:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Results</h1>
        <div className="bg-slate-100 p-1 rounded-xl inline-flex">
          <button 
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'exams' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Exam Results
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'results' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Semester Results
          </button>
        </div>
      </div>

      {activeTab === 'exams' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-500" /> Released Exam Results
              </h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center p-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Module</th>
                      <th className="px-6 py-4 text-center">Marks</th>
                      <th className="px-6 py-4 text-center">Grade</th>
                      <th className="px-6 py-4 text-center">Date Released</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examResults.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-slate-500">
                          No exam results released yet.
                        </td>
                      </tr>
                    ) : (
                      examResults.map((result) => (
                        <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-800">{result.modules?.name || 'Unknown Module'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-bold text-slate-800">{result.marks}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                              result.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                              result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                              result.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-500">
                            {new Date(result.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Award className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <p className="text-blue-100 font-medium text-sm mb-1">Current CGPA</p>
                <p className="text-5xl font-bold">3.42</p>
                <p className="text-sm text-blue-200 mt-2">Upper Second-Class Honors</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-1">Semester 1 GPA</p>
              <p className="text-2xl font-bold text-slate-800">3.40</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500 mb-1">Total Credits Earned</p>
              <p className="text-2xl font-bold text-slate-800">14 <span className="text-sm font-medium text-slate-400">/ 14</span></p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
              <button className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center mb-3 shadow-sm">
                <Download className="w-4 h-4 mr-2" /> Download Transcript
              </button>
              <p className="text-xs text-slate-400">Official verified copy</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-400" /> Semester 1 Results
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 text-center">Credits</th>
                    <th className="px-6 py-4 text-center">Grade</th>
                    <th className="px-6 py-4 text-center">Subject GPA</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockSemesterResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{result.subject}</td>
                      <td className="px-6 py-4 text-center font-medium">{result.credits}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
                          result.grade.includes('A') ? 'bg-emerald-100 text-emerald-700' :
                          result.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-700">{result.gpa.toFixed(1)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          {result.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default StudentAssessments;
