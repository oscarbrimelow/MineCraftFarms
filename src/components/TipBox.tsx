import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

interface Tip {
  id: string;
  title: string;
  content: string;
  page?: string; // Optional: show tip only on specific pages
}

const TIPS: Tip[] = [
  {
    id: '1',
    title: 'Search by Items',
    content: 'You can search for farms by the items they produce! Try searching "gunpowder" to find creeper farms.',
  },
  {
    id: '2',
    title: 'Bulk Import',
    content: 'Have multiple farms to add? Use the Bulk Import feature at the bottom of the Upload page to import from CSV or JSON files.',
  },
  {
    id: '3',
    title: 'Paste Materials',
    content: 'When uploading a farm, you can paste a list of materials (e.g., "93 Cobbled Deepslate") and they\'ll be automatically added with icons!',
  },
  {
    id: '4',
    title: 'Categories',
    content: 'Browse farms by category on the Home page. Click any category to see all farms of that type.',
  },
  {
    id: '5',
    title: 'Litematica Support',
    content: 'You can upload Litematica schematic files (.litematic or .schematic) when creating a farm for easy sharing!',
  },
  {
    id: '6',
    title: 'Report Issues',
    content: 'Found inappropriate content? Use the Report button on any farm or comment to notify moderators.',
  },
];

interface TipBoxProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoShow?: boolean; // Automatically show tip box on page load
  delay?: number; // Delay before showing (ms)
}

export default function TipBox({ 
  position = 'bottom-right',
  autoShow = true,
  delay = 3000 
}: TipBoxProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed tips from localStorage
    const saved = localStorage.getItem('dismissedTips');
    if (saved) {
      setDismissedTips(new Set(JSON.parse(saved)));
    }

    // Find first non-dismissed tip
    const firstNonDismissed = TIPS.findIndex(tip => !dismissedTips.has(tip.id));
    if (firstNonDismissed !== -1) {
      setCurrentTipIndex(firstNonDismissed);
    }
  }, []);

  useEffect(() => {
    if (autoShow && !dismissedTips.has(TIPS[currentTipIndex]?.id)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [autoShow, delay, currentTipIndex, dismissedTips]);

  const currentTip = TIPS[currentTipIndex];

  const handleDismiss = () => {
    if (currentTip) {
      const newDismissed = new Set(dismissedTips);
      newDismissed.add(currentTip.id);
      setDismissedTips(newDismissed);
      localStorage.setItem('dismissedTips', JSON.stringify(Array.from(newDismissed)));
    }
    setIsVisible(false);
  };

  const handleNext = () => {
    const nextIndex = (currentTipIndex + 1) % TIPS.length;
    setCurrentTipIndex(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = (currentTipIndex - 1 + TIPS.length) % TIPS.length;
    setCurrentTipIndex(prevIndex);
  };

  const handleShow = () => {
    setIsVisible(true);
  };

  // If all tips are dismissed, don't show anything
  if (dismissedTips.size >= TIPS.length) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <>
      {/* Show button if tip box is hidden */}
      {!isVisible && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleShow}
          className={`fixed ${positionClasses[position]} z-40 w-12 h-12 bg-minecraft-green text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110`}
          title="Show Tips"
        >
          <Lightbulb size={24} />
        </motion.button>
      )}

      {/* Tip Box */}
      <AnimatePresence>
        {isVisible && currentTip && (
          <motion.div
            initial={{ opacity: 0, y: position.includes('bottom') ? 20 : -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position.includes('bottom') ? 20 : -20, scale: 0.9 }}
            className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full`}
          >
            <div className="bg-white rounded-xl shadow-2xl border-2 border-minecraft-green overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-minecraft-green to-minecraft-green-dark p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="text-white" size={20} />
                  <h3 className="text-white font-bold text-sm">Tip</h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white hover:text-gray-200 transition-colors"
                  title="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{currentTip.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{currentTip.content}</p>
              </div>

              {/* Footer with navigation */}
              <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrevious}
                    className="p-1.5 text-gray-600 hover:text-minecraft-green hover:bg-gray-100 rounded transition-colors"
                    title="Previous tip"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentTipIndex + 1} / {TIPS.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="p-1.5 text-gray-600 hover:text-minecraft-green hover:bg-gray-100 rounded transition-colors"
                    title="Next tip"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Don't show again
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

