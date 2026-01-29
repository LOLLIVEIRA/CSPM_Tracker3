import React, { useEffect, useState, useRef } from 'react';
import { Upload, FileJson, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Misconfiguration } from '../types';
import { parseCSV, parseJSON, validateMisconfiguration } from '../utils/importData';
interface ImportButtonProps {
  onImport: (data: Misconfiguration[]) => void;
}
export function ImportButton({
  onImport
}: ImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleFileSelect = (type: 'csv' | 'json') => {
    setImportType(type);
    setIsOpen(false);
    fileInputRef.current?.click();
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        let data: Misconfiguration[];
        if (importType === 'csv') {
          data = parseCSV(content);
        } else {
          data = parseJSON(content);
        }
        const validData = data.filter(validateMisconfiguration);
        if (validData.length === 0) {
          alert('Nenhum ticket válido encontrado no arquivo.');
          return;
        }
        if (validData.length < data.length) {
          alert(`${data.length - validData.length} tickets inválidos foram ignorados.`);
        }
        onImport(validData);
        alert(`${validData.length} tickets importados com sucesso!`);
      } catch (error) {
        alert('Erro ao processar arquivo. Verifique o formato e tente novamente.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  return <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium">
        <Upload size={16} />
        Importar
      </button>

      <input ref={fileInputRef} type="file" accept={importType === 'csv' ? '.csv' : '.json'} onChange={handleFileChange} className="hidden" />

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
            <button onClick={() => handleFileSelect('csv')} className="flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
              <FileSpreadsheet size={16} className="mr-3 text-green-600 dark:text-green-400" />
              Importar CSV
            </button>
            <button onClick={() => handleFileSelect('json')} className="flex items-center w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left border-t border-slate-100 dark:border-slate-700">
              <FileJson size={16} className="mr-3 text-yellow-600 dark:text-yellow-400" />
              Importar JSON
            </button>
          </motion.div>}
      </AnimatePresence>
    </div>;
}