import React, { useState, useRef, useEffect } from 'react';
import { Workflow, WorkflowStatus, WizardStep } from '../types';
import { generateAutomationPlan, generateScript, transcribeAudio } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkflowWizardProps {
  workflow: Workflow;
  onUpdate: (updatedWorkflow: Workflow) => void;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  "Notify me when my manager emails me about 'Budget'...",
  "Save Typeform responses to a Google Sheet automatically...",
  "Generate a weekly report from Drive files every Friday...",
  "Create a calendar event when a row is added to Sheets...",
];

export const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ workflow, onUpdate, onClose }) => {
  const [step, setStep] = useState<WizardStep>(
    workflow.script ? WizardStep.Deploy : 
    workflow.plan ? WizardStep.Review : 
    WizardStep.Describe
  );
  
  const [loading, setLoading] = useState(false);
  
  // Conversation State
  const [promptText, setPromptText] = useState(workflow.prompt);
  const [conversationHistory, setConversationHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Typing Effect State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Auto-scroll to latest message in clarification mode
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clarificationQuestion) {
      historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clarificationQuestion, conversationHistory]);

  // Typing Logic
  useEffect(() => {
    if (promptText) return; // Don't animate if user typed
    
    let currentText = EXAMPLE_PROMPTS[placeholderIndex];
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
        if (charIndex <= currentText.length) {
            setDisplayedPlaceholder(currentText.substring(0, charIndex));
            charIndex++;
        } else {
            clearInterval(typeInterval);
            setIsTyping(false);
            setTimeout(() => {
                setIsTyping(true);
                setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
            }, 3000);
        }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [placeholderIndex, promptText]);


  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setLoading(true);
        try {
            const text = await transcribeAudio(audioBlob);
            setPromptText(prev => (prev ? prev + " " + text : text));
        } finally { setLoading(false); }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("Mic access denied."); }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setClarificationQuestion(null); // Clear previous question while loading

    try {
      // Prepare history context string
      const historyStr = conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`);
      
      const result = await generateAutomationPlan(promptText, historyStr);

      if (result.isValid && result.plan) {
         // Success! Move to next step
         const finalPromptContext = [...conversationHistory, { role: 'user', text: promptText }]
            .map(m => m.text).join(' '); // Flatten history for the record

         onUpdate({ 
             ...workflow, 
             prompt: finalPromptContext, 
             name: result.plan.name, 
             description: result.plan.description, 
             plan: result.plan, 
             status: WorkflowStatus.Draft 
         });
         setStep(WizardStep.Review);
      } else if (result.question) {
         // Needs Clarification
         const newHistory = [
             ...conversationHistory, 
             { role: 'user' as const, text: promptText },
             { role: 'model' as const, text: result.question }
         ];
         setConversationHistory(newHistory);
         setClarificationQuestion(result.question);
         setPromptText(""); // Clear input for user reply
      }
    } finally { setLoading(false); }
  };

  const handleGenerateScript = async () => {
    if (!workflow.plan) return;
    setLoading(true);
    try {
      const code = await generateScript(workflow.plan, workflow.prompt);
      onUpdate({ ...workflow, script: code, status: WorkflowStatus.Generated });
      setStep(WizardStep.Deploy);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#0B0C10]">
      {/* Top Navigation Bar */}
      <nav className="flex-none px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0B0C10]/80 backdrop-blur-md z-20">
        <button 
          onClick={onClose} 
          className="group flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <div className="p-1 rounded-md group-hover:bg-slate-100 dark:group-hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          <span className="font-medium text-sm hidden sm:inline">Back to Dashboard</span>
        </button>
        
        <div className="flex items-center space-x-4 sm:space-x-8">
           {[
             { id: WizardStep.Describe, label: 'Prompt' },
             { id: WizardStep.Review, label: 'Plan' },
             { id: WizardStep.Deploy, label: 'Code' }
           ].map((s) => (
             <div key={s.id} className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step === s.id ? 'bg-brand-500 shadow-glow scale-125' : step > s.id ? 'bg-brand-300' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${step === s.id ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{s.label}</span>
             </div>
           ))}
        </div>
        
        <div className="w-10 sm:w-32 flex justify-end"></div>
      </nav>

      <div className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* STEP 1: DESCRIBE */}
        {step === WizardStep.Describe && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center p-6 sm:p-8 max-w-4xl mx-auto"
          >
            <div className="w-full space-y-6">
               <div className="text-center space-y-3">
                 <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">What shall we build?</h2>
                 <p className="text-lg text-slate-500 dark:text-slate-400 font-light">Describe your workflow in plain English.</p>
               </div>

               {/* Conversation History Display */}
               {conversationHistory.length > 0 && (
                   <div className="w-full bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 space-y-4 max-h-60 overflow-y-auto">
                       {conversationHistory.map((msg, idx) => (
                           <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                               <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                   msg.role === 'user' 
                                   ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-br-sm' 
                                   : 'bg-brand-500 text-white rounded-bl-sm shadow-lg shadow-brand-500/20'
                               }`}>
                                   {msg.text}
                               </div>
                           </motion.div>
                       ))}
                       <div ref={historyEndRef} />
                   </div>
               )}

               {/* Clarification Alert */}
               <AnimatePresence>
                {clarificationQuestion && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/30 rounded-2xl p-4 flex items-start space-x-3"
                    >
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-700 dark:text-brand-300 text-sm uppercase tracking-wide">FlowAI Needs Details</h3>
                            <p className="text-brand-900 dark:text-brand-100 font-medium mt-1">{clarificationQuestion}</p>
                        </div>
                    </motion.div>
                )}
               </AnimatePresence>

               {/* Main Input Area */}
               <div className="relative group w-full">
                 <div className="absolute -inset-1 bg-gradient-to-r from-brand-300 to-indigo-300 dark:from-brand-600 dark:to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                 <div className="relative bg-white dark:bg-[#15171B] rounded-2xl shadow-2xl dark:shadow-none overflow-hidden border border-slate-200 dark:border-white/10">
                    <textarea
                        className="block w-full h-56 p-8 text-xl sm:text-2xl bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none focus:ring-0 resize-none z-10 font-medium"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder={clarificationQuestion ? "Type your answer here..." : ""}
                        autoFocus
                    />
                    
                    {/* Animated Placeholder Overlay */}
                    {!promptText && !clarificationQuestion && (
                        <div className="absolute top-8 left-8 right-8 pointer-events-none text-slate-400 dark:text-slate-600 text-xl sm:text-2xl">
                             {displayedPlaceholder}
                             <span className="animate-pulse text-brand-500">|</span>
                        </div>
                    )}

                    <div className="absolute bottom-6 right-6 flex items-center space-x-4">
                        <button 
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`relative p-4 rounded-full transition-all duration-300 flex items-center justify-center overflow-hidden ${
                                isRecording 
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 ring-2 ring-red-500' 
                                : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                            title="Voice Input"
                        >
                            {isRecording && (
                                <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75"></span>
                            )}
                            <svg className={`w-6 h-6 z-10 ${isRecording ? 'text-red-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    </div>
                 </div>
               </div>

               <div className="flex justify-center pt-8">
                  <button 
                    onClick={handleGeneratePlan} 
                    disabled={loading || !promptText.trim()} 
                    className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white transition-all duration-300 bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full hover:scale-105 hover:shadow-2xl hover:shadow-brand-500/20 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                       <span className="flex items-center space-x-3">
                         <svg className="animate-spin -ml-1 h-5 w-5 text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         <span>Analyzing Request...</span>
                       </span>
                    ) : (
                       <span className="flex items-center">
                         {clarificationQuestion ? 'Submit Answer' : 'Design Workflow'}
                         <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                       </span>
                    )}
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: REVIEW */}
        {step === WizardStep.Review && workflow.plan && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full max-w-6xl mx-auto p-6 sm:p-12 overflow-y-auto scrollbar-hide"
          >
             <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Review Blueprint</h2>
               <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Our AI architect proposes the following logic flow.</p>
             </div>

             <div className="bg-white dark:bg-[#15171B] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="p-8 sm:p-10 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 backdrop-blur">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{workflow.plan.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-3xl text-lg font-light">{workflow.plan.description}</p>
                </div>

                <div className="p-8 sm:p-10 space-y-8 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-[59px] sm:left-[67px] top-10 bottom-10 w-0.5 bg-slate-100 dark:bg-white/5 z-0"></div>

                  {workflow.plan.steps.map((s, i) => (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="group relative flex items-start z-10"
                    >
                       <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/10 flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 shadow-sm group-hover:border-brand-500 group-hover:text-brand-500 group-hover:shadow-glow transition-all duration-300">
                         {i + 1}
                       </div>
                       
                       <div className="ml-6 sm:ml-8 flex-1 bg-white dark:bg-[#1A1D21] border border-slate-200 dark:border-white/5 p-6 rounded-2xl shadow-sm hover:shadow-lg dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-800 transition-all duration-300">
                         <div className="flex items-center justify-between mb-3">
                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20">
                                {s.service} Service
                             </span>
                         </div>
                         <h4 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-2">Technical Specification</h4>
                         <p className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed">{s.action}</p>
                       </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 sm:p-10 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-white/5 gap-4">
                  <button onClick={() => setStep(WizardStep.Describe)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium px-4 py-2 transition-colors">
                    ← Refine Instructions
                  </button>
                  <button 
                    onClick={handleGenerateScript} 
                    disabled={loading}
                    className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Generating Logic...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Script</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>
                      </>
                    )}
                  </button>
                </div>
             </div>
          </motion.div>
        )}

        {/* STEP 3: DEPLOY (MAC STYLE) */}
        {step === WizardStep.Deploy && workflow.script && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-start pt-8 px-4 sm:px-6 bg-slate-50 dark:bg-[#0B0C10]"
          >
             <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wide mb-4 border border-green-200 dark:border-green-900/50">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>System Generated</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Script is Ready</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Ready for deployment to Google Apps Script.</p>
             </div>

             {/* MacOS Window */}
             <div className="w-full max-w-5xl flex-1 mb-12 flex flex-col rounded-xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/60 border border-slate-300 dark:border-white/10 bg-[#1e1e1e] ring-1 ring-white/10">
                {/* Title Bar */}
                <div className="h-11 bg-[#2d2d2d] border-b border-black/50 flex items-center px-4 justify-between select-none bg-opacity-95 backdrop-blur">
                   <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors border border-black/20"></div>
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors border border-black/20"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors border border-black/20"></div>
                   </div>
                   <div className="text-xs text-slate-400 font-mono flex items-center space-x-2 opacity-70">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      <span>Code.gs</span>
                   </div>
                   <div className="w-12"></div>
                </div>

                {/* Code Area */}
                <div className="flex-1 relative group bg-[#1e1e1e]">
                   <button 
                     onClick={() => { navigator.clipboard.writeText(workflow.script!); alert("Copied to clipboard!"); }}
                     className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 flex items-center space-x-2"
                   >
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                     <span>Copy</span>
                   </button>
                   <pre className="p-6 text-sm font-mono text-[#a9b7c6] overflow-auto h-[500px] leading-relaxed selection:bg-brand-500/30 font-light">
                     {workflow.script}
                   </pre>
                </div>
             </div>
             
             <div className="pb-12">
               <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-colors border-b border-transparent hover:border-slate-300 pb-0.5">
                 Return to Dashboard
               </button>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};