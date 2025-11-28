import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Coffee } from 'lucide-react';

interface DonationBoxProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  donationUrl?: string; // URL to your donation platform (Ko-fi, PayPal, etc.)
}

export default function DonationBox({ 
  position = 'bottom-right',
  donationUrl = 'https://ko-fi.com' // Default, user should update this
}: DonationBoxProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed the donation box before
  useState(() => {
    const saved = localStorage.getItem('donationBoxDismissed');
    if (saved === 'true') {
      setDismissed(true);
      setIsVisible(false);
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem('donationBoxDismissed', 'true');
  };

  const handleDonate = () => {
    window.open(donationUrl, '_blank', 'noopener,noreferrer');
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  if (dismissed) {
    // Show a small button to reopen
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => {
          setDismissed(false);
          setIsVisible(true);
          localStorage.removeItem('donationBoxDismissed');
        }}
        className={`fixed ${positionClasses[position]} z-40 w-12 h-12 bg-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110`}
        title="Support the project"
      >
        <Heart size={24} />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes('bottom') ? 20 : -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.includes('bottom') ? 20 : -20, scale: 0.9 }}
          className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full`}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-pink-300 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Heart className="text-white" size={20} />
                <h3 className="text-white font-bold text-sm">Support the Project</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:text-gray-200 transition-colors text-xs"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? '↑' : '↓'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-white hover:text-gray-200 transition-colors"
                  title="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    If you find this site helpful, consider supporting its development! 
                    Your donations help keep the project running and add new features.
                  </p>
                  <button
                    onClick={handleDonate}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors shadow-md"
                  >
                    <Coffee size={18} />
                    <span>Support with a Donation</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

