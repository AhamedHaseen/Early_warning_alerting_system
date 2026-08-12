import React, { useState } from 'react';
import { Database, BrainCircuit, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RagAssistant = () => {
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProcess = async () => {
    if (!notes.trim()) return;
    setIsLoading(true);
    try {
      // For now, RAG uses the summarize endpoint or a separate RAG endpoint if we had one.
      // We will use summarize endpoint for text processing.
      const res = await fetch(`${API_URL}/api/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: "Extract key entities, facts, and structure from this text for RAG retrieval:\n\n" + notes })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSummary(data.summary);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to process', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[800px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2 font-bold"><Database className="w-5 h-5"/> RAG Knowledge Assistant</div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4 md:flex-row">
        <div className="flex-1 flex flex-col gap-2">
          <label className="font-bold text-slate-700 text-sm">Input Document Text:</label>
          <textarea 
            value={notes} onChange={e => setNotes(e.target.value)}
            className="flex-1 w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-teal-500 resize-none text-sm shadow-inner"
            placeholder="Paste document text here to extract facts..."
          />
          <button onClick={handleProcess} disabled={isLoading || !notes.trim()} className="mt-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>} 
            Process Document
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
          <label className="font-bold text-slate-700 text-sm">Extracted Knowledge:</label>
          <div className="flex-1 w-full p-6 border border-slate-200 rounded-xl bg-white overflow-y-auto text-sm shadow-inner">
            {summary ? (
              <div className="prose prose-sm max-w-none prose-h1:text-lg prose-h2:text-base prose-h3:text-sm">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-slate-400 italic text-center mt-20">Extracted facts will appear here</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RagAssistant;
