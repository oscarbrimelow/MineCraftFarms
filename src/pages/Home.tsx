import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Sparkles, Zap, Grid } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import FarmCard from '../components/FarmCard';
import { FARM_CATEGORIES, getCategorySlug } from '../lib/farmCategories';

export default function Home() {
  const [featuredFarms, setFeaturedFarms] = useState<any[]>([]);
  const [trendingFarms, setTrendingFarms] = useState<any[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      setFeaturedFarms(mockFarms.slice(0, 6));
      setTrendingFarms(mockFarms.slice(0, 6));
      
      // Calculate category counts from mock data
      const counts: Record<string, number> = {};
      mockFarms.forEach((farm) => {
        if (farm.category) {
          counts[farm.category] = (counts[farm.category] || 0) + 1;
        }
      });
      setCategoryCounts(counts);
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

      // Fetch category counts
      const { data: farms } = await supabase
        .from('farms')
        .select('category')
        .eq('public', true)
        .not('category', 'is', null);

      const counts: Record<string, number> = {};
      farms?.forEach((farm) => {
        if (farm.category) {
          counts[farm.category] = (counts[farm.category] || 0) + 1;
        }
      });
      setCategoryCounts(counts);

      setFeaturedFarms(featured || []);
      setTrendingFarms(trending || []);
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    { 
      name: 'Java', 
      color: 'from-blue-500 to-blue-700', 
      hoverColor: 'from-blue-600 to-blue-800',
      icon: '☕',
      description: 'Classic Minecraft experience',
      accent: 'bg-blue-400',
      glow: 'shadow-blue-500/50'
    },
    { 
      name: 'Bedrock', 
      color: 'from-green-500 to-green-700', 
      hoverColor: 'from-green-600 to-green-800',
      icon: '🧱',
      description: 'Cross-platform edition',
      accent: 'bg-green-400',
      glow: 'shadow-green-500/50'
    },
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.h1
              className="text-6xl md:text-8xl lg:text-9xl font-display text-white mb-4"
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.3)',
                lineHeight: '1.1',
              }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="block mb-2"
              >
                The Best Minecraft
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="block mb-2 bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent animate-shimmer"
                style={{
                  backgroundSize: '200% auto',
                }}
              >
                Farms, All in One Place
              </motion.span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-2 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto max-w-2xl rounded-full"
            ></motion.div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-xl md:text-2xl lg:text-3xl text-white/95 mb-8 max-w-4xl mx-auto font-semibold leading-relaxed"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Browse farm designs, share your own, and find exactly what you need.
            <br />
            <span className="text-yellow-200">From simple to complex, we've got you covered.</span>
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
      <section className="py-16 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-minecraft-indigo rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-display text-gray-900 mb-4">
              Browse by Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your Minecraft edition and discover amazing farms
            </p>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.2,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -12,
                  rotate: [0, -2, 2, -2, 2, 0],
                }}
                className="w-full md:w-[400px]"
              >
                <Link
                  to={`/farms?platform=${platform.name.toLowerCase()}`}
                  className="group relative block"
                >
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${platform.color} rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity ${platform.glow}`}></div>
                  
                  {/* Main card */}
                  <div className={`relative bg-gradient-to-br ${platform.color} rounded-2xl p-8 shadow-2xl transform transition-all duration-300 group-hover:shadow-3xl`}>
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-br-full"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/10 rounded-tl-full"></div>
                    
                    {/* Icon with animated background */}
                    <div className="relative mb-6 flex justify-center">
                      <div className={`absolute inset-0 ${platform.accent} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                      <motion.div
                        className="relative text-8xl mb-4"
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5,
                        }}
                      >
                        {platform.icon}
                      </motion.div>
                    </div>
                    
                    {/* Platform name */}
                    <h3 className="text-4xl font-display font-bold text-white text-center mb-3 drop-shadow-lg">
                      {platform.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-white/90 text-center mb-6 text-lg">
                      {platform.description}
                    </p>
                    
                    {/* CTA Arrow */}
                    <div className="flex justify-center">
                      <motion.div
                        className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:bg-white/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ArrowRight 
                          className="text-white w-6 h-6 group-hover:translate-x-2 transition-transform" 
                        />
                      </motion.div>
                    </div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/20 group-hover:border-white/40 transition-colors"></div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-display text-gray-900 flex items-center justify-center space-x-3 mb-4">
              <Grid className="text-minecraft-green" size={40} />
              <span>Browse by Category</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore farm designs organized by type. Click on any category to see all available designs.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {FARM_CATEGORIES.map((category) => {
              const count = categoryCounts[category] || 0;
              return { category, count };
            })
            .sort((a, b) => b.count - a.count)
            .map(({ category, count }) => (
              <Link
                key={category}
                to={`/category/${getCategorySlug(category)}`}
                className="block group"
              >
                <div className="bg-gradient-to-br from-minecraft-green/10 to-minecraft-indigo/10 rounded-xl p-4 border-2 border-minecraft-green/20 hover:border-minecraft-green transition-all duration-300 h-24 flex flex-col items-center justify-center">
                  <h3 className="font-display font-semibold text-gray-900 text-sm md:text-base group-hover:text-minecraft-green transition-colors line-clamp-2 text-center">
                    {category}
                  </h3>
                  {count > 0 && (
                    <span className="text-xs text-gray-500 mt-1">
                      {count} {count === 1 ? 'farm' : 'farms'}
                    </span>
                  )}
                </div>
              </Link>
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

