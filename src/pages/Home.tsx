import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import FarmCard from '../components/FarmCard';

export default function Home() {
  const [featuredFarms, setFeaturedFarms] = useState<any[]>([]);
  const [trendingFarms, setTrendingFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      setFeaturedFarms(mockFarms.slice(0, 6));
      setTrendingFarms(mockFarms.slice(0, 6));
      setLoading(false);
      return;
    }

    try {
      // Fetch featured farms (most upvoted)
      const { data: featured } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true)
        .order('upvotes_count', { ascending: false })
        .limit(6);

      // Fetch trending farms (recent with high upvotes)
      const { data: trending } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      setFeaturedFarms(featured || []);
      setTrendingFarms(trending || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    { name: 'Java', color: 'bg-blue-500', icon: '☕' },
    { name: 'Bedrock', color: 'bg-green-500', icon: '🧱' },
  ];

  const tags = [
    'auto-sugarcane',
    'iron-farm',
    'gold-farm',
    'xp-farm',
    'crop-farm',
    'mob-farm',
    'redstone',
    'easy',
    'efficient',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-minecraft-green via-minecraft-indigo to-minecraft-gold py-20">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <span className="text-4xl">🧱</span>
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-display text-white mb-6 text-shadow-lg"
          >
            Build. Share. Discover.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto"
          >
            The ultimate collection of Minecraft farms for every version and platform.
            Find the perfect design or share your own creation with the community.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/farms"
              className="group px-8 py-4 bg-white text-minecraft-green-dark rounded-xl font-bold text-lg shadow-minecraft hover:shadow-minecraft-lg transition-all flex items-center space-x-2"
            >
              <span>Browse Farms</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/upload"
              className="px-8 py-4 bg-minecraft-gold text-white rounded-xl font-bold text-lg shadow-minecraft hover:shadow-minecraft-lg transition-all flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>Upload Your Farm</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Platform Quick Filters */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display text-center mb-8 text-gray-900">
            Browse by Platform
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
              >
                <Link
                  to={`/farms?platform=${platform.name.toLowerCase()}`}
                  className={`${platform.color} text-white p-6 rounded-xl shadow-minecraft-sm hover:shadow-minecraft transition-all text-center block`}
                >
                  <div className="text-4xl mb-2">{platform.icon}</div>
                  <div className="font-bold">{platform.name}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Farms */}
      <section className="py-16 bg-gradient-to-br from-minecraft-green-light/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-display text-gray-900 flex items-center space-x-3">
              <TrendingUp className="text-minecraft-gold" />
              <span>Featured Farms</span>
            </h2>
            <Link
              to="/farms?sort=upvotes"
              className="text-minecraft-indigo hover:text-minecraft-indigo-dark font-semibold flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight size={18} />
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl font-display text-minecraft-green animate-pulse">
                Loading farms...
              </div>
            </div>
          ) : featuredFarms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredFarms.map((farm, index) => (
                <FarmCard key={farm.id} farm={farm} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No farms yet. Be the first to{' '}
                <Link to="/upload" className="text-minecraft-green font-semibold underline">
                  upload one
                </Link>
                !
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Tags */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-display text-center mb-8 text-gray-900 flex items-center justify-center space-x-2">
            <Zap className="text-minecraft-gold" />
            <span>Popular Tags</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {tags.map((tag) => (
              <Link
                key={tag}
                to={`/tag/${tag}`}
                className="px-6 py-3 bg-gradient-to-r from-minecraft-green to-minecraft-indigo text-white rounded-full font-semibold shadow-minecraft-sm hover:shadow-minecraft transition-all hover:scale-105"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Farms */}
      {trendingFarms.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-minecraft-indigo-light/20 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-4xl font-display text-gray-900 flex items-center space-x-3">
                <Sparkles className="text-minecraft-gold" />
                <span>Latest Uploads</span>
              </h2>
              <Link
                to="/farms?sort=newest"
                className="text-minecraft-indigo hover:text-minecraft-indigo-dark font-semibold flex items-center space-x-2"
              >
                <span>View All</span>
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingFarms.map((farm, index) => (
                <FarmCard key={farm.id} farm={farm} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

