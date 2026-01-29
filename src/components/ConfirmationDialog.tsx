import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning'
}: ConfirmationDialogProps) {
  if (!isOpen) return null;
  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };
  const colors = getVariantColors();
  return <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} onClick={onClose} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

        <motion.div initial={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.95,
        y: 20
      }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex items-start gap-4 p-6">
            <div className={`p-2 rounded-full bg-opacity-10 ${colors.icon}`}>
              <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex justify-end gap-3 px-6 pb-6">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
              {cancelText}
            </button>
            <button onClick={() => {
            onConfirm();
            onClose();
          }} className={`px-4 py-2 text-sm font-medium text-white ${colors.button} rounded-lg transition-colors shadow-sm`}>
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>;
}