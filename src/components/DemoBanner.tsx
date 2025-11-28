import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoBanner() {
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-minecraft-gold to-minecraft-gold-dark text-white py-3 px-4 text-center shadow-minecraft-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
        <Info size={20} />
        <span className="font-semibold">
          🎮 Demo Mode: You're previewing with mock data. 
          <Link to="/account" className="underline ml-1 hover:text-gray-200">
            Set up Supabase
          </Link>
          {' '}to enable full functionality!
        </span>
      </div>
    </motion.div>
  );
}

