import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AdminChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Assistant. How can I help you manage the system today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (text, history) => {
    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is the backend running?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), messages);
  };

  const handleOptionClick = (optionText) => {
    if (isLoading) return;
    sendMessage(optionText, messages);
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    const markdownLines = [];
    const optionLines = [];

    lines.forEach(line => {
      if (line.trim().startsWith('[OPTION]')) {
        optionLines.push(line.replace('[OPTION]', '').trim());
      } else {
        markdownLines.push(line);
      }
    });

    return (
      <div className="flex flex-col w-full">
        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-th:border prose-th:border-slate-300 prose-td:border prose-td:border-slate-300 prose-th:p-2 prose-td:p-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownLines.join('\n')}
          </ReactMarkdown>
        </div>
        {optionLines.length > 0 && (
          <div className="mt-4 flex flex-col space-y-2 w-full">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Choose an option:</span>
            {optionLines.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionClick(opt.replace(/[*_~`]/g, ''))}
                disabled={isLoading}
                className="w-full text-left px-4 py-3 bg-white hover:bg-blue-50 active:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-colors shadow-sm text-sm font-medium flex items-center group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 mr-2 text-blue-500 group-hover:translate-x-1 transition-transform shrink-0" />
                <span className="flex-1">{opt.replace(/[*_~`]/g, '')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 border border-slate-200 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between shadow-md relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">AI Assistant</h3>
              <p className="text-blue-100 text-xs">Langchain Powered</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-blue-100'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none overflow-x-auto'
                  }`}
                style={msg.role === 'user' ? { whiteSpace: 'pre-wrap' } : undefined}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  renderMessageContent(msg.content)
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask anything... (Shift+Enter for new line)"
              rows={3}
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-y min-h-[44px] max-h-[150px]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminChatbot;
