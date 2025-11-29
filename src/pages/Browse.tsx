import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search as SearchIcon, Sparkles, Grid3x3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import FarmCard from '../components/FarmCard';
import Fuse from 'fuse.js';

const PLATFORMS = ['Java', 'Bedrock'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'upvotes', label: 'Most Popular' },
  { value: 'title', label: 'Title A-Z' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const selectedPlatform = searchParams.get('platform') || '';
  const selectedSort = searchParams.get('sort') || 'newest';
  const selectedTag = searchParams.get('tag') || '';

  useEffect(() => {
    fetchFarms();
  }, [selectedPlatform, selectedSort, selectedTag]);

  const fetchFarms = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      let demoFarms = [...mockFarms];
      
      if (selectedPlatform) {
        demoFarms = demoFarms.filter(farm => 
          farm.platform.map(p => p.toLowerCase()).includes(selectedPlatform.toLowerCase())
        );
      }

      if (selectedTag) {
        demoFarms = demoFarms.filter(farm => 
          farm.tags.includes(selectedTag.toLowerCase())
        );
      }

      // Apply sorting
      switch (selectedSort) {
        case 'upvotes':
          demoFarms.sort((a, b) => b.upvotes_count - a.upvotes_count);
          break;
        case 'oldest':
          demoFarms.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'title':
          demoFarms.sort((a, b) => a.title.localeCompare(b.title));
          break;
        default:
          demoFarms.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      setFarms(demoFarms);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true);

      // Apply sorting
      switch (selectedSort) {
        case 'upvotes':
          query = query.order('upvotes_count', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter by platform client-side (more reliable than contains for arrays)
      let filteredData = data || [];
      
      if (selectedPlatform) {
        filteredData = filteredData.filter((farm) =>
          farm.platform?.some((p: string) => 
            p.toLowerCase() === selectedPlatform.toLowerCase()
          )
        );
      }

      if (selectedTag) {
        filteredData = filteredData.filter((farm) =>
          farm.tags?.includes(selectedTag.toLowerCase())
        );
      }

      setFarms(filteredData);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search using Fuse.js
  const filteredFarms = useMemo(() => {
    if (!searchQuery.trim()) return farms;

    const fuse = new Fuse(farms, {
      keys: [
        'title', 
        'description', 
        'tags', 
        'materials',
        'farmable_items', // Search by items the farm produces
        {
          name: 'drop_rate_per_hour',
          getFn: (farm: any) => {
            // Extract item names from drop_rate_per_hour array
            if (Array.isArray(farm.drop_rate_per_hour)) {
              return farm.drop_rate_per_hour.map((dr: any) => dr.item || '').join(' ');
            }
            return '';
          }
        }
      ],
      threshold: 0.3,
    });

    return fuse.search(searchQuery).map((result) => result.item);
  }, [farms, searchQuery]);

  const handlePlatformFilter = (platform: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (platform === selectedPlatform) {
      newParams.delete('platform');
    } else {
      newParams.set('platform', platform);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (sort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    setSearchParams(newParams);
  };

  const handleTagFilter = (tag: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tag === selectedTag) {
      newParams.delete('tag');
    } else {
      newParams.set('tag', tag);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/30 via-white to-minecraft-green-light/30 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
        {/* Header with enhanced styling */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-4xl"
            >
              🧱
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-display text-gray-900 drop-shadow-lg">
              Browse Farms
            </h1>
          </div>

          {/* Enhanced Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search with glassmorphism */}
            <motion.div 
              className="flex-1 relative max-w-lg w-full"
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-minecraft-green/20 to-minecraft-indigo/20 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-minecraft-lg border-2 border-minecraft-green/30">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-minecraft-green-dark" size={22} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search farms, materials, tags..."
                  className="w-full pl-12 pr-4 py-4 bg-transparent focus:outline-none text-gray-900 placeholder-gray-400 font-medium"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={20} />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Sort with enhanced styling */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-5 py-4 rounded-2xl border-2 border-minecraft-green/30 bg-white/90 backdrop-blur-sm shadow-minecraft focus:outline-none focus:ring-2 focus:ring-minecraft-green focus:border-minecraft-green font-semibold text-gray-900 cursor-pointer transition-all hover:shadow-minecraft-lg"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Filter Toggle with animation */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center space-x-2 px-6 py-4 rounded-2xl font-bold text-white shadow-minecraft-lg transition-all ${
                showFilters 
                  ? 'bg-minecraft-indigo shadow-minecraft-lg' 
                  : 'bg-gradient-to-r from-minecraft-green to-minecraft-green-dark hover:shadow-glow'
              }`}
            >
              <Filter size={20} />
              <span>Filters</span>
              {(selectedPlatform || selectedTag) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center text-xs"
                >
                  {(selectedPlatform ? 1 : 0) + (selectedTag ? 1 : 0)}
                </motion.span>
              )}
            </motion.button>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:block lg:w-72 flex-shrink-0"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-minecraft-lg p-6 sticky top-24 border-2 border-minecraft-green/20">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Grid3x3 size={24} className="text-minecraft-green" />
                      Filters
                    </h2>
                    <motion.button
                      onClick={() => setShowFilters(false)}
                      whileHover={{ rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>

                  {/* Platform Filter */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Platform</h3>
                    <div className="space-y-2">
                      {PLATFORMS.map((platform, idx) => (
                        <motion.button
                          key={platform}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => handlePlatformFilter(platform)}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all shadow-minecraft-sm ${
                            selectedPlatform === platform
                              ? 'bg-gradient-to-r from-minecraft-green to-minecraft-green-dark text-white shadow-minecraft-lg'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-minecraft'
                          }`}
                        >
                          {platform}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <AnimatePresence>
                    {(selectedPlatform || selectedTag) && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={() => {
                          setSearchParams({});
                          setShowFilters(false);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-minecraft-lg font-bold transition-all shadow-minecraft"
                      >
                        Clear Filters
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Active Filters with enhanced styling */}
            <AnimatePresence>
              {(selectedPlatform || selectedTag) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 flex flex-wrap gap-3"
                >
                  {selectedPlatform && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-minecraft-green to-minecraft-green-dark text-white rounded-full shadow-minecraft font-semibold"
                    >
                      <span>{selectedPlatform}</span>
                      <motion.button
                        onClick={() => handlePlatformFilter(selectedPlatform)}
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.8 }}
                        className="hover:text-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </motion.button>
                    </motion.span>
                  )}
                  {selectedTag && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-minecraft-indigo to-minecraft-indigo-dark text-white rounded-full shadow-minecraft font-semibold"
                    >
                      <span>{selectedTag}</span>
                      <motion.button
                        onClick={() => handleTagFilter(selectedTag)}
                        whileHover={{ rotate: 90 }}
                        whileTap={{ scale: 0.8 }}
                        className="hover:text-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </motion.button>
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl mb-4"
                >
                  🧱
                </motion.div>
                <div className="text-2xl font-display text-minecraft-green animate-pulse">
                  Loading farms...
                </div>
              </motion.div>
            ) : filteredFarms.length > 0 ? (
              <>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-700 mb-8 font-semibold text-lg flex items-center gap-2"
                >
                  <Sparkles size={20} className="text-minecraft-gold" />
                  Found <span className="text-minecraft-green-dark font-bold">{filteredFarms.length}</span> farm{filteredFarms.length !== 1 ? 's' : ''}
                </motion.p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {filteredFarms.map((farm, index) => (
                      <FarmCard key={farm.id} farm={farm} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 bg-white/90 backdrop-blur-sm rounded-2xl shadow-minecraft-lg border-2 border-gray-200"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-6"
                >
                  🔍
                </motion.div>
                <p className="text-gray-700 text-xl mb-6 font-semibold">
                  {searchQuery ? 'No farms match your search.' : 'No farms found with these filters.'}
                </p>
                <motion.button
                  onClick={() => {
                    setSearchParams({});
                    setSearchQuery('');
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-minecraft-green to-minecraft-green-dark text-white rounded-xl hover:shadow-minecraft-lg transition-all font-bold shadow-minecraft"
                >
                  Clear All Filters
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

