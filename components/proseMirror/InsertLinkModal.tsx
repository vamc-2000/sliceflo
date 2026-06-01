'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface InsertLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (href: string, text: string) => void;
  initialText?: string;
  initialHref?: string;
}

export const InsertLinkModal: React.FC<InsertLinkModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialText = '',
  initialHref = '',
}) => {
  const [href, setHref] = useState(initialHref);
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setHref(initialHref);
      setText(initialText);
    }
  }, [isOpen, initialHref, initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (href) {
      onInsert(href, text);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-white border border-[#B0B0B0] rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="text-xl font-bold text-[#001F3F] tracking-tight">Insert link</h3>
                <button 
                  onClick={onClose}
                  className="text-[#8E8E93] hover:text-[#001F3F] transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#001F3F] flex items-center gap-1.5">
                    Link URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                    placeholder="https://example.com"
                    autoFocus
                    className="w-full bg-white border border-[#B0B0B0] rounded-lg px-4 py-2.5 text-[#001F3F] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#001F3F]/20 focus:border-[#001F3F] transition-all shadow-sm font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#8E8E93]">
                    Display Text
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter link text"
                    className="w-full bg-white border border-[#B0B0B0] rounded-lg px-4 py-2.5 text-[#001F3F] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#001F3F]/20 focus:border-[#001F3F] transition-all shadow-sm font-medium"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-[#8E8E93] hover:text-[#001F3F] transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={!href}
                    className="bg-[#001F3F] hover:bg-[#001F3F]/90 text-white px-6 py-2 rounded-lg font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Insert Link
                  </Button>
                </div>
              </form>


            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
