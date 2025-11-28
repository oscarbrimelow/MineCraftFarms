import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tag as TagIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import FarmCard from '../components/FarmCard';

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tag) {
      fetchFarmsByTag();
    }
  }, [tag]);

  const fetchFarmsByTag = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      const tagFarms = mockFarms.filter(f => 
        f.tags.includes(tag?.toLowerCase() || '')
      );
      setFarms(tagFarms);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('farms')
        .select('*, users:author_id(username, avatar_url)')
        .eq('public', true)
        .contains('tags', [tag])
        .order('upvotes_count', { ascending: false });

      if (error) throw error;
      setFarms(data || []);
    } catch (error) {
      console.error('Error fetching farms by tag:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!tag) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-gray-900">Invalid tag</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <TagIcon className="text-minecraft-green" size={32} />
            <h1 className="text-4xl md:text-5xl font-display text-gray-900">
              #{tag}
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            {loading
              ? 'Loading...'
              : `Found ${farms.length} farm${farms.length !== 1 ? 's' : ''} with this tag`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-3xl font-display text-minecraft-green animate-pulse">
              Loading farms...
            </div>
          </div>
        ) : farms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm, index) => (
              <FarmCard key={farm.id} farm={farm} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-minecraft">
            <p className="text-gray-600 text-lg mb-4">No farms found with this tag.</p>
            <a
              href="/farms"
              className="text-minecraft-green hover:underline font-semibold"
            >
              Browse all farms
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

