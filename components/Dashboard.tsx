import React from 'react';
import { Workflow, WorkflowStatus } from '../types';
import { motion } from 'framer-motion';

interface DashboardProps {
  workflows: Workflow[];
  onCreateNew: () => void;
  onSelectWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  workflows, 
  onCreateNew, 
  onSelectWorkflow, 
  onDeleteWorkflow 
}) => {
  return (
    <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-12">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 border-b border-slate-200 dark:border-white/5"
      >
        <div>
           <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
             Overview
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-light">Manage your automation pipelines.</p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full flex items-center space-x-2 text-sm font-medium text-slate-500 dark:text-slate-400">
           <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
           <span>{workflows.length} Active Workflows</span>
        </div>
      </motion.header>

      {/* Action Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
      >
        {/* Create New Card */}
        <motion.button 
          variants={item}
          onClick={onCreateNew}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex flex-col items-start justify-center p-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/5 rounded-3xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 cursor-pointer text-left overflow-hidden h-64"
        >
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-900/20 opacity-50 rounded-full blur-3xl transform translate-x-12 -translate-y-12 group-hover:translate-x-8 transition-transform duration-700"></div>
          
          <div className="relative z-10 w-14 h-14 bg-brand-50 dark:bg-brand-500/10 rounded-2xl flex items-center justify-center mb-auto border border-brand-100 dark:border-brand-500/20 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
             <svg className="w-7 h-7 text-brand-600 dark:text-brand-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
             </svg>
          </div>
          <div className="relative z-10 mt-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">New Workflow</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              Use AI to architect a new Google Apps Script automation from plain text.
            </p>
          </div>
        </motion.button>

        {/* Template Card */}
         <motion.button 
          variants={item}
          onClick={() => alert("Templates coming soon!")}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex flex-col items-start justify-center p-8 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/5 rounded-3xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer text-left overflow-hidden h-64"
        >
          <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-50 to-transparent dark:from-indigo-900/20 opacity-50 rounded-full blur-3xl transform translate-x-12 -translate-y-12 group-hover:translate-x-8 transition-transform duration-700"></div>

          <div className="relative z-10 w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-auto border border-indigo-100 dark:border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
             <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
          </div>
          <div className="relative z-10 mt-6">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Start from Template</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              Pre-configured automations for Gmail, Sheets, Drive, and Calendar.
            </p>
          </div>
        </motion.button>
      </motion.div>

      {/* List */}
      <motion.div variants={container} initial="hidden" animate="show">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 flex items-center space-x-2">
            <span>Recent Activity</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/5"></div>
        </h2>
        
        {workflows.length === 0 ? (
          <motion.div variants={item} className="flex flex-col items-center justify-center py-24 bg-white dark:bg-dark-card rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg">No workflows found</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Your automated future starts with a single click above.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {workflows.map(wf => (
              <motion.div 
                variants={item}
                key={wf.id}
                layout
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-white/5 rounded-2xl hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-lg dark:hover:shadow-none transition-all cursor-pointer relative"
                onClick={() => onSelectWorkflow(wf.id)}
              >
                <div className="flex items-start space-x-6">
                  <div className={`mt-2 w-2.5 h-2.5 rounded-full shadow-lg shadow-current flex-shrink-0 ${
                    wf.status === WorkflowStatus.Deployed ? 'bg-green-500 text-green-500' :
                    wf.status === WorkflowStatus.Generated ? 'bg-brand-500 text-brand-500' :
                    'bg-slate-300 text-slate-300 dark:bg-slate-600'
                  }`} />
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{wf.name || 'Untitled Workflow'}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 truncate max-w-lg font-light leading-relaxed">{wf.description || wf.prompt}</p>
                    <div className="sm:hidden mt-3 flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            wf.status === WorkflowStatus.Deployed ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' :
                            wf.status === WorkflowStatus.Generated ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-900/30' :
                            'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                            {wf.status}
                        </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 mt-4 sm:mt-0 relative z-10">
                  <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    wf.status === WorkflowStatus.Deployed ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/30' :
                    wf.status === WorkflowStatus.Generated ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border-brand-200 dark:border-brand-900/30' :
                    'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {wf.status}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.nativeEvent.stopImmediatePropagation();
                          if (window.confirm("Are you sure you want to delete this workflow?")) {
                            onDeleteWorkflow(wf.id);
                          }
                        }}
                        className="relative z-20 p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all sm:opacity-0 sm:group-hover:opacity-100 flex items-center justify-center"
                        title="Delete Workflow"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};