import React, { useState, useRef, useEffect } from 'react';
import { chatWithFlowAI } from '../services/geminiService';
import { ChatMessage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const FlowAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello. I am FlowAI. How can I assist with your automation architecture today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Click outside to close
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (chatRef.current && !chatRef.current.contains(event.target as Node) && isOpen) {
              setIsOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);


  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const responseText = await chatWithFlowAI(history, userMsg.text);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: 'I encountered an error. Please try again.', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setIsOpen(true)} 
            className="fixed bottom-6 right-6 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-full shadow-2xl shadow-brand-500/40 flex items-center justify-center text-white z-50 group border border-white/20"
          >
            <span className="font-bold text-xl group-hover:animate-pulse">F</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
            <motion.div 
                ref={chatRef}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[70vh] sm:h-[600px] max-h-[85vh] bg-white/95 dark:bg-[#15171B]/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/50 flex flex-col border border-white/20 dark:border-white/5 z-50 overflow-hidden"
            >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-[#15171b]/50 flex-shrink-0">
                <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm">FlowAI Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-transparent scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                        ? 'bg-brand-600 text-white rounded-br-sm' 
                        : 'bg-slate-50 dark:bg-[#1f2228] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-bl-sm'
                    } ${m.isError ? 'bg-red-50 text-red-600 border-red-100' : ''}`}>
                    {m.text}
                    </div>
                </div>
                ))}
                {loading && (
                <div className="flex justify-start">
                    <div className="bg-slate-50 dark:bg-[#1f2228] px-4 py-3 rounded-2xl rounded-bl-sm border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/50 dark:bg-[#15171b]/50 border-t border-slate-200/50 dark:border-white/5 flex-shrink-0">
                <div className="flex items-center bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-brand-500/50 transition-all shadow-inner">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-none focus:ring-0 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()}
                    className="p-2 bg-white dark:bg-white/10 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
                </div>
            </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
