import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check } from 'lucide-react';
import { MINECRAFT_ITEMS, filterMinecraftItems } from '../lib/minecraftItems';

// Helper function to get Minecraft item icon URL
export function getMinecraftItemIcon(itemName: string): string {
  // URL pattern from mowinpeople.com
  const baseUrl = 'https://www.mowinpeople.com/wp-content/plugins/minecraft-list-by-W/Icons';
  // Item names need to match exactly as they appear in the icon filenames
  return `${baseUrl}/${itemName}.png`;
}

interface MaterialAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
}

export default function MaterialAutocomplete({
  value,
  onChange,
  placeholder = 'Material name',
  onEnter,
}: MaterialAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredItems, setFilteredItems] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const filtered = filterMinecraftItems(value);
      setFilteredItems(filtered);
      setIsOpen(filtered.length > 0);
      setHighlightedIndex(0);
    } else {
      setFilteredItems([]);
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

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isOpen && filteredItems.length > 0 && highlightedIndex >= 0) {
        handleSelect(filteredItems[highlightedIndex]);
      } else if (onEnter && value.trim() && MINECRAFT_ITEMS.includes(value)) {
        onEnter();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (isOpen && filteredItems.length > 0) {
        setHighlightedIndex((prev) => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen && filteredItems.length > 0) {
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const isValid = value.trim() && MINECRAFT_ITEMS.includes(value);

  return (
    <div className="relative flex-1">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <Search size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (filteredItems.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-300 font-display text-base ${
            isValid
              ? 'border-green-500 bg-green-50/50 focus:ring-2 focus:ring-green-500 focus:border-green-600'
              : value.trim() && !isValid
              ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 bg-white focus:ring-2 focus:ring-minecraft-green focus:border-minecraft-green'
          } focus:outline-none shadow-sm hover:shadow-md`}
          style={{
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: '14px',
            letterSpacing: '0.5px',
          }}
        />
        {isValid && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600"
          >
            <Check size={20} />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredItems.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-64 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
            }}
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <img
                      src={getMinecraftItemIcon(item)}
                      alt={item}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback to emoji if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'inline';
                        }
                      }}
                    />
                    <span className="text-lg hidden">🧱</span>
                  </div>
                  <span className="flex-1">{item}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {value.trim() && !isValid && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-1 text-xs text-red-600 font-semibold"
        >
          Please select a valid Minecraft item
        </motion.div>
      )}
    </div>
  );
}

