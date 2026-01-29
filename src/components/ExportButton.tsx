import React, { useEffect, useState, useRef } from 'react';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Misconfiguration } from '../types';
import { exportToCSV, exportToJSON } from '../utils/exportData';
interface ExportButtonProps {
  data: Misconfiguration[];
}
export function ExportButton({
  data
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
        <Download size={16} />
        Export
      </button>

      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        y: 10
      }} animate={{
        opacity: 1,
        y: 0
      }} exit={{
        opacity: 0,
        y: 10
      }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
            <button onClick={() => {
          exportToCSV(data);
          setIsOpen(false);
        }} className="flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
              <FileSpreadsheet size={16} className="mr-3 text-green-600 dark:text-green-400" />
              Export as CSV
            </button>
            <button onClick={() => {
          exportToJSON(data);
          setIsOpen(false);
        }} className="flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-t border-slate-100 dark:border-slate-700">
              <FileJson size={16} className="mr-3 text-yellow-600 dark:text-yellow-400" />
              Export as JSON
            </button>
          </motion.div>}
      </AnimatePresence>
    </div>;
}