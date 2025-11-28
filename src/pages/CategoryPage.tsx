import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Farm } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import { getCategoryFromSlug } from '../lib/farmCategories';
import FarmCard from '../components/FarmCard';

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const category = categorySlug ? getCategoryFromSlug(categorySlug) : null;

  useEffect(() => {
    if (category) {
      fetchFarmsByCategory();
    }
  }, [category]);

  const fetchFarmsByCategory = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      const categoryFarms = mockFarms.filter((f) => f.category === category);
      setFarms(categoryFarms);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true)
        .eq('category', category)
        .order('upvotes_count', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms by category:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-minecraft-green rounded-xl">
              <Farm className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900">
                {category}
              </h1>
              <p className="text-gray-600 mt-2">
                {farms.length} {farms.length === 1 ? 'farm design' : 'farm designs'} found
              </p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-minecraft-green"></div>
          </div>
        )}

        {/* Farms Grid */}
        {!loading && (
          <>
            {farms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Farm className="mx-auto text-gray-400 mb-4" size={64} />
                <h2 className="text-2xl font-display text-gray-700 mb-2">
                  No farms found
                </h2>
                <p className="text-gray-600">
                  There are no {category.toLowerCase()} designs yet. Be the first to upload one!
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {farms.map((farm, index) => (
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

