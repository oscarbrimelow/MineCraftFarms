import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  itemType: 'farm' | 'comment';
  itemId: string;
  itemTitle?: string;
}

const REPORT_REASONS = [
  'Spam or misleading content',
  'Inappropriate or offensive content',
  'Copyright infringement',
  'Incorrect or dangerous information',
  'Other (please specify)',
];

export default function ReportModal({
  isOpen,
  onClose,
  user,
  itemType,
  itemId,
  itemTitle,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please sign in to submit a report.');
      return;
    }

    if (!selectedReason) {
      alert('Please select a reason for reporting.');
      return;
    }

    const reason = selectedReason === 'Other (please specify)' 
      ? `Other: ${customReason.trim()}` 
      : selectedReason;

    if (selectedReason === 'Other (please specify)' && !customReason.trim()) {
      alert('Please specify the reason.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          item_type: itemType,
          item_id: itemId,
          reason: reason,
          reporter_id: user.id,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedReason('');
        setCustomReason('');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h2>
              <p className="text-gray-600">
                Thank you for your report. We'll review it shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Flag className="text-red-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Report {itemType === 'farm' ? 'Farm' : 'Comment'}</h2>
                  {itemTitle && (
                    <p className="text-sm text-gray-600 mt-1">{itemTitle}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Why are you reporting this?
                  </label>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedReason === 'Other (please specify)' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Please specify the reason
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required={selectedReason === 'Other (please specify)'}
                    />
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedReason}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

