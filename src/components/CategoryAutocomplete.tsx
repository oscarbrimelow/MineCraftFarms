import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import { FARM_CATEGORIES } from '../lib/farmCategories';

interface CategoryAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CategoryAutocomplete({
  value,
  onChange,
  placeholder = 'Search farm category...',
  required = false,
}: CategoryAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const query = value.toLowerCase();
      const filtered = FARM_CATEGORIES.filter((category) =>
        category.toLowerCase().includes(query)
      ).slice(0, 10);
      setFilteredCategories(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(0);
    } else {
      setFilteredCategories(FARM_CATEGORIES.slice(0, 10));
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCategories.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCategories[highlightedIndex]) {
          handleSelect(filteredCategories[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (value.trim()) {
              const query = value.toLowerCase();
              const filtered = FARM_CATEGORIES.filter((category) =>
                category.toLowerCase().includes(query)
              ).slice(0, 10);
              setFilteredCategories(filtered);
            } else {
              setFilteredCategories(FARM_CATEGORIES.slice(0, 10));
            }
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green font-display text-sm"
          style={{
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: '11px',
            letterSpacing: '0.3px',
          }}
        />
      </div>

      <AnimatePresence>
        {isOpen && filteredCategories.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-minecraft-green rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleSelect(category)}
                className={`px-4 py-3 cursor-pointer transition-all duration-200 font-display text-sm ${
                  index === highlightedIndex
                    ? 'bg-gradient-to-r from-minecraft-green/20 to-minecraft-indigo/20 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={{
                  fontFamily: "'Press Start 2P', 'Courier New', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.3px',
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{category}</span>
                  {value === category && (
                    <Check className="text-minecraft-green" size={16} />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

