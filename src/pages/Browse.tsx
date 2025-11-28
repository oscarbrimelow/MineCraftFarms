import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, X, Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import FarmCard from '../components/FarmCard';
import Fuse from 'fuse.js';

const PLATFORMS = ['Java', 'Bedrock', 'Xbox', 'PlayStation', 'Switch', 'Mobile'];
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
      keys: ['title', 'description', 'tags', 'materials'],
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
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display text-gray-900 mb-4">
            Browse Farms
          </h1>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Search */}
            <div className="flex-1 relative max-w-lg">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farms, materials, tags..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
              />
            </div>

            {/* Sort */}
            <select
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green font-semibold"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-minecraft-green text-white rounded-xl font-semibold hover:bg-minecraft-green-dark transition-colors"
            >
              <Filter size={20} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <motion.aside
            initial={false}
            animate={{
              width: showFilters ? 'auto' : '0',
              opacity: showFilters ? 1 : 0,
            }}
            className={`lg:block ${showFilters ? 'block' : 'hidden'} lg:w-64 flex-shrink-0`}
          >
            <div className="bg-white rounded-xl shadow-minecraft p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Platform Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Platform</h3>
                <div className="space-y-2">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformFilter(platform)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedPlatform === platform
                          ? 'bg-minecraft-green text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedPlatform || selectedTag) && (
                <button
                  onClick={() => {
                    setSearchParams({});
                    setShowFilters(false);
                  }}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </motion.aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Active Filters */}
            {(selectedPlatform || selectedTag) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedPlatform && (
                  <span className="inline-flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-full">
                    <span>{selectedPlatform}</span>
                    <button
                      onClick={() => handlePlatformFilter(selectedPlatform)}
                      className="hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </span>
                )}
                {selectedTag && (
                  <span className="inline-flex items-center space-x-2 px-4 py-2 bg-minecraft-indigo text-white rounded-full">
                    <span>{selectedTag}</span>
                    <button
                      onClick={() => handleTagFilter(selectedTag)}
                      className="hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-3xl font-display text-minecraft-green animate-pulse">
                  Loading farms...
                </div>
              </div>
            ) : filteredFarms.length > 0 ? (
              <>
                <p className="text-gray-600 mb-6">
                  Found {filteredFarms.length} farm{filteredFarms.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFarms.map((farm, index) => (
                    <FarmCard key={farm.id} farm={farm} index={index} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-minecraft">
                <p className="text-gray-600 text-lg mb-4">
                  {searchQuery ? 'No farms match your search.' : 'No farms found with these filters.'}
                </p>
                <button
                  onClick={() => {
                    setSearchParams({});
                    setSearchQuery('');
                  }}
                  className="px-6 py-3 bg-minecraft-green text-white rounded-xl hover:bg-minecraft-green-dark transition-colors font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

