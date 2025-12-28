import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkflowWizard } from './components/WorkflowWizard';
import { FlowAIAssistant } from './components/FluAIAssistant';
import { Workflow, WorkflowStatus } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sidebar Components ---

const SidebarItem = ({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) => (
  <button 
    onClick={onClick}
    className={`group flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
      active 
        ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-white font-semibold shadow-lg shadow-slate-200/50 dark:shadow-none' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeSidebar"
        className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    )}
    <div className={`transition-transform duration-200 z-10 ${active ? 'scale-110' : 'group-hover:scale-105'} ${collapsed ? 'mx-auto' : ''}`}>
      {icon}
    </div>
    {!collapsed && (
      <motion.span 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-sm tracking-wide z-10 truncate"
      >
        {label}
      </motion.span>
    )}
  </button>
);

// --- Main App ---

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'wizard' | 'settings'>('dashboard');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('flowai_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('flowai_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load/Save Workflows
  useEffect(() => {
    const saved = localStorage.getItem('flowai_workflows');
    if (saved) {
      try { setWorkflows(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flowai_workflows', JSON.stringify(workflows));
  }, [workflows]);

  const handleCreateNew = () => {
    const newWorkflow: Workflow = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      prompt: '',
      plan: null,
      script: null,
      status: WorkflowStatus.Draft,
      createdAt: Date.now()
    };
    setWorkflows([newWorkflow, ...workflows]);
    setActiveWorkflowId(newWorkflow.id);
    setView('wizard');
    setMobileMenuOpen(false);
  };

  const handleSelectWorkflow = (id: string) => {
    setActiveWorkflowId(id);
    setView('wizard');
  };

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const handleUpdateWorkflow = (updated: Workflow) => {
    setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const handleCloseWizard = () => {
    setView('dashboard');
    setActiveWorkflowId(null);
  };

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 z-40">
        <div className="flex items-center space-x-2">
           <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
           <span className="font-bold text-lg">FlowAI</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={`fixed md:relative inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B0C10] backdrop-blur-xl transition-all duration-300 ${
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        }`}
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
      >
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg shadow-lg shadow-brand-500/30 flex items-center justify-center text-white font-bold text-lg">F</div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">FlowAI</span>
            </motion.div>
          )}
          {sidebarCollapsed && (
             <div className="mx-auto h-8 w-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">F</div>
          )}
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
            className="hidden md:block p-1 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
             {sidebarCollapsed ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
             ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
             )}
          </button>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            label="Home" 
            active={view === 'dashboard' || view === 'wizard'}
            collapsed={sidebarCollapsed}
            onClick={() => {
               if (view === 'wizard' && !confirm("Leave current workflow?")) return;
               setView('dashboard');
               setMobileMenuOpen(false);
            }}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          />
          <SidebarItem 
            label="Settings" 
            active={view === 'settings'}
            collapsed={sidebarCollapsed}
            onClick={() => {
                if (view === 'wizard' && !confirm("Leave current workflow?")) return;
                setView('settings');
                setMobileMenuOpen(false);
            }}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
           {!sidebarCollapsed ? (
             <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-slate-400">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
               <span>System Online</span>
             </div>
           ) : (
             <div className="flex justify-center">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
             </div>
           )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-[#0B0C10] pt-16 md:pt-0">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
               <Dashboard 
                 workflows={workflows} 
                 onCreateNew={handleCreateNew} 
                 onSelectWorkflow={handleSelectWorkflow}
                 onDeleteWorkflow={handleDeleteWorkflow}
               />
            </motion.div>
          )}

          {view === 'wizard' && activeWorkflow && (
             <motion.div 
               key="wizard"
               className="absolute inset-0 z-10 h-full bg-slate-50 dark:bg-[#0B0C10]"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.98 }}
               transition={{ duration: 0.3 }}
             >
               <WorkflowWizard 
                 workflow={activeWorkflow}
                 onUpdate={handleUpdateWorkflow}
                 onClose={handleCloseWizard}
               />
             </motion.div>
          )}

          {view === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 md:p-12 max-w-3xl mx-auto"
              >
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
                  <p className="text-slate-500 dark:text-slate-400 mb-10">Manage your workspace preferences.</p>

                  <div className="bg-white dark:bg-[#15171B] border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                              <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-full text-slate-600 dark:text-slate-300">
                                 {darkMode ? (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                 ) : (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                 )}
                              </div>
                              <div>
                                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Dark Mode</h3>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm">Toggle between light and dark visual themes.</p>
                              </div>
                          </div>
                          
                          <button 
                            onClick={toggleTheme}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${darkMode ? 'bg-brand-600' : 'bg-slate-200'}`}
                          >
                              <span className="sr-only">Toggle Theme</span>
                              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                          </button>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center">
                     <div className="h-12 w-12 bg-slate-200 dark:bg-white/10 rounded-full flex items-center justify-center mb-3">
                        <span className="font-mono font-bold text-slate-400 dark:text-slate-500">F</span>
                     </div>
                     <h4 className="text-xs font-bold uppercase text-slate-400 dark:text-slate-600 tracking-wider">FlowAI Platform</h4>
                     <p className="text-sm text-slate-500 mt-1">v1.2.0 (Premium Beta)</p>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FlowAIAssistant />
    </div>
  );
};

export default App;