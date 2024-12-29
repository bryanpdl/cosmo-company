import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Modal Content */}
        <motion.div
          className="relative bg-gray-800/90 rounded-xl border border-gray-700 shadow-xl w-full max-w-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg 
                       hover:bg-gray-700/50"
            >
              <IoClose className="text-xl" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 