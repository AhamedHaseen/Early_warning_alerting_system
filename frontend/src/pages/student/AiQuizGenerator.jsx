import React, { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AiQuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsLoading(true);
    setQuiz([]);
    setSelectedAnswers({});
    setShowResults(false);
    try {
      const res = await fetch(`${API_URL}/api/ai/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: questionCount })
      });
      const data = await res.json();
      if (data.status === 'success' && data.quiz) {
        setQuiz(data.quiz);
      } else {
        throw new Error(data.error || 'Invalid response');
      }
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to generate quiz', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qIndex, option) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  let score = 0;
  if (showResults) {
    quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.answer) score++;
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[800px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-purple-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2 font-bold"><BrainCircuit className="w-5 h-5"/> AI Quiz Generator</div>
      </div>
      <div className="p-4 bg-white border-b border-slate-100">
        <form onSubmit={handleGenerate} className="flex gap-2">
          <input 
            type="text" value={topic} onChange={e => setTopic(e.target.value)} 
            placeholder="Enter a topic (e.g. History of Rome)..." 
            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm shadow-inner"
          />
          <select 
            value={questionCount} 
            onChange={e => setQuestionCount(Number(e.target.value))}
            className="px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-purple-500 text-sm shadow-inner bg-white"
          >
            <option value={5}>5 Questions</option>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={20}>20 Questions</option>
            <option value={50}>50 Questions</option>
          </select>
          <button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 text-sm flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin"/>} Generate Quiz
          </button>
        </form>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {quiz.length > 0 ? (
          <div className="space-y-8 max-w-3xl mx-auto">
            {quiz.map((q, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5 text-lg">{i + 1}. {q.question}</h3>
                <div className="space-y-3">
                  {q.options.map((opt, j) => {
                    const isSelected = selectedAnswers[i] === opt;
                    const isCorrect = showResults && opt === q.answer;
                    const isWrong = showResults && isSelected && opt !== q.answer;
                    
                    let btnClass = "w-full text-left p-4 rounded-xl border text-sm transition-all ";
                    if (showResults) {
                      if (isCorrect) btnClass += "bg-emerald-100 border-emerald-300 text-emerald-800 font-bold shadow-sm";
                      else if (isWrong) btnClass += "bg-red-100 border-red-300 text-red-800 shadow-sm";
                      else btnClass += "bg-slate-50 border-slate-200 opacity-50";
                    } else {
                      if (isSelected) btnClass += "bg-purple-50 border-purple-300 text-purple-700 font-medium shadow-sm";
                      else btnClass += "bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50";
                    }

                    return (
                      <button key={j} onClick={() => handleSelect(i, opt)} className={btnClass}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {showResults && (
                  <div className="mt-5 p-4 bg-blue-50 text-blue-800 text-sm rounded-xl border border-blue-100">
                    <span className="font-bold">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <BrainCircuit className="w-16 h-16 mb-4 opacity-50 text-purple-400"/>
            <p className="text-lg">{isLoading ? 'Generating your personalized quiz...' : 'Enter a topic above to generate a quick quiz.'}</p>
          </div>
        )}
      </div>
      {quiz.length > 0 && !showResults && (
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
          <button onClick={() => setShowResults(true)} disabled={Object.keys(selectedAnswers).length < quiz.length} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50">
            Submit Answers
          </button>
        </div>
      )}
      {showResults && (
        <div className="p-4 bg-emerald-50 border-t border-emerald-200 flex justify-between items-center">
          <div className="font-bold text-emerald-800 text-lg">Your Score: {score} / {quiz.length} ({Math.round((score/quiz.length)*100)}%)</div>
          <button onClick={() => { setQuiz([]); setTopic(''); setShowResults(false); }} className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-6 py-3 rounded-xl font-medium text-sm transition-colors">
            Try Another Topic
          </button>
        </div>
      )}
    </div>
  );
};

export default AiQuizGenerator;
