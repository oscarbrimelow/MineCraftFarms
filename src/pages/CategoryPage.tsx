import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Grid3x3, Filter, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import { getCategoryFromSlug } from '../lib/farmCategories';
import FarmCard from '../components/FarmCard';

const SORT_OPTIONS = [
  { value: 'upvotes_desc', label: 'Most Upvoted' },
  { value: 'upvotes_asc', label: 'Least Upvoted' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'drop_rate_desc', label: 'Highest Drop Rate' },
  { value: 'drop_rate_asc', label: 'Lowest Drop Rate' },
  { value: 'build_time_asc', label: 'Quickest Build' },
  { value: 'build_time_desc', label: 'Longest Build' },
  { value: 'resources_asc', label: 'Least Resources' },
  { value: 'resources_desc', label: 'Most Resources' },
  { value: 'version_newest', label: 'Newest Version' },
  { value: 'version_oldest', label: 'Oldest Version' },
];

const COMMON_VERSIONS = [
  '1.21', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
];

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const category = categorySlug ? getCategoryFromSlug(categorySlug) : null;
  
  const selectedSort = searchParams.get('sort') || 'upvotes_desc';
  const selectedVersion = searchParams.get('version') || '';

  useEffect(() => {
    if (category) {
      fetchFarmsByCategory();
    }
  }, [category, selectedSort, selectedVersion]);

  const fetchFarmsByCategory = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      let categoryFarms = mockFarms.filter((f) => f.category === category);
      
      // Apply version filter
      if (selectedVersion) {
        categoryFarms = categoryFarms.filter((f) =>
          f.versions?.some((v: string) => v === selectedVersion)
        );
      }
      
      setFarms(categoryFarms);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true)
        .eq('category', category);

      // Apply version filter
      if (selectedVersion) {
        query = query.contains('versions', [selectedVersion]);
      }

      // Apply database-level sorting for simple cases
      if (selectedSort === 'upvotes_desc') {
        query = query.order('upvotes_count', { ascending: false });
      } else if (selectedSort === 'upvotes_asc') {
        query = query.order('upvotes_count', { ascending: true });
      } else if (selectedSort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (selectedSort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        // Default to upvotes for complex sorts (will be handled client-side)
        query = query.order('upvotes_count', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms by category:', error);
      setFarms([]); // Set empty array on error to prevent crashes
    } finally {
      setLoading(false);
    }
  };

  // Client-side sorting for complex cases
  const sortedFarms = useMemo(() => {
    try {
      let sorted = [...farms];

      switch (selectedSort) {
        case 'drop_rate_desc':
          sorted.sort((a, b) => {
            try {
              const aRate = getMaxDropRate(a);
              const bRate = getMaxDropRate(b);
              return bRate - aRate;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'drop_rate_asc':
          sorted.sort((a, b) => {
            try {
              const aRate = getMaxDropRate(a);
              const bRate = getMaxDropRate(b);
              return aRate - bRate;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'build_time_asc':
          sorted.sort((a, b) => {
            try {
              const aTime = a?.estimated_time || Infinity;
              const bTime = b?.estimated_time || Infinity;
              return aTime - bTime;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'build_time_desc':
          sorted.sort((a, b) => {
            try {
              const aTime = a?.estimated_time || 0;
              const bTime = b?.estimated_time || 0;
              return bTime - aTime;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'resources_asc':
          sorted.sort((a, b) => {
            try {
              const aCount = getMaterialCount(a);
              const bCount = getMaterialCount(b);
              return aCount - bCount;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'resources_desc':
          sorted.sort((a, b) => {
            try {
              const aCount = getMaterialCount(a);
              const bCount = getMaterialCount(b);
              return bCount - aCount;
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'version_newest':
          sorted.sort((a, b) => {
            try {
              const aVersion = getNewestVersion(a?.versions || []);
              const bVersion = getNewestVersion(b?.versions || []);
              return compareVersions(bVersion, aVersion);
            } catch (e) {
              return 0;
            }
          });
          break;
        case 'version_oldest':
          sorted.sort((a, b) => {
            try {
              const aVersion = getNewestVersion(a?.versions || []);
              const bVersion = getNewestVersion(b?.versions || []);
              return compareVersions(aVersion, bVersion);
            } catch (e) {
              return 0;
            }
          });
          break;
      }

      return sorted;
    } catch (error) {
      console.error('Error sorting farms:', error);
      return farms; // Return original array if sorting fails
    }
  }, [farms, selectedSort]);

  const getMaxDropRate = (farm: any): number => {
    try {
      if (!farm || !farm.drop_rate_per_hour || !Array.isArray(farm.drop_rate_per_hour)) return 0;
      if (farm.drop_rate_per_hour.length === 0) return 0;
      
      const rates = farm.drop_rate_per_hour
        .map((dr: any) => {
          if (!dr) return 0;
          const rateStr = dr.rate?.toString() || '0';
          const rate = parseFloat(rateStr.replace(/[^0-9.]/g, '') || '0');
          return isNaN(rate) ? 0 : rate;
        })
        .filter((r: number) => r > 0);
      
      if (rates.length === 0) return 0;
      return Math.max(...rates);
    } catch (e) {
      return 0;
    }
  };

  const getMaterialCount = (farm: any): number => {
    try {
      if (!farm) return 0;
      const materials = Array.isArray(farm.materials) ? farm.materials : [];
      const optional = Array.isArray(farm.optional_materials) ? farm.optional_materials : [];
      return materials.length + optional.length;
    } catch (e) {
      return 0;
    }
  };

  const getNewestVersion = (versions: string[]): string => {
    try {
      if (!Array.isArray(versions) || versions.length === 0) return '0.0';
      // Sort versions and return the newest
      const validVersions = versions.filter(v => v && typeof v === 'string');
      if (validVersions.length === 0) return '0.0';
      const sorted = [...validVersions].sort((a, b) => compareVersions(b, a));
      return sorted[0] || '0.0';
    } catch (e) {
      return '0.0';
    }
  };

  const compareVersions = (a: string, b: string): number => {
    try {
      if (!a || !b) return 0;
      const aParts = a.split('.').map(Number).filter(n => !isNaN(n));
      const bParts = b.split('.').map(Number).filter(n => !isNaN(n));
      
      if (aParts.length === 0 && bParts.length === 0) return 0;
      if (aParts.length === 0) return -1;
      if (bParts.length === 0) return 1;
      
      const maxLength = Math.max(aParts.length, bParts.length);
      
      for (let i = 0; i < maxLength; i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        if (aPart > bPart) return 1;
        if (aPart < bPart) return -1;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const handleSortChange = (sortValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sortValue);
    setSearchParams(newParams);
  };

  const handleVersionChange = (version: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (version) {
      newParams.set('version', version);
    } else {
      newParams.delete('version');
    }
    setSearchParams(newParams);
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-gray-900">Invalid category</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-minecraft-green/5 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/farms"
            className="inline-flex items-center space-x-2 text-minecraft-green hover:text-minecraft-green-dark mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Browse</span>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-minecraft-green rounded-xl">
                <Grid3x3 className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900">
                  {category}
                </h1>
                <p className="text-gray-600 mt-2">
                  {sortedFarms.length} {sortedFarms.length === 1 ? 'farm design' : 'farm designs'} found
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
              <ChevronDown 
                size={18} 
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </motion.div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-white rounded-xl shadow-minecraft p-6 border-2 border-gray-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Version Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minecraft Version
                </label>
                <select
                  value={selectedVersion}
                  onChange={(e) => handleVersionChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                >
                  <option value="">All Versions</option>
                  {COMMON_VERSIONS.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-minecraft-green"></div>
          </div>
        )}

        {/* Farms Grid */}
        {!loading && (
          <>
            {sortedFarms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Grid3x3 className="mx-auto text-gray-400 mb-4" size={64} />
                <h2 className="text-2xl font-display text-gray-700 mb-2">
                  No farms found
                </h2>
                <p className="text-gray-600">
                  {selectedVersion 
                    ? `No ${category.toLowerCase()} designs found for version ${selectedVersion}.`
                    : `There are no ${category.toLowerCase()} designs yet. Be the first to upload one!`
                  }
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {sortedFarms.map((farm, index) => (
                  <motion.div
                    key={farm.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FarmCard farm={farm} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

