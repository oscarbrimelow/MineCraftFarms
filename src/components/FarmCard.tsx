import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ThumbsUp, Tag, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMinecraftMobAvatar } from '../lib/avatarUtils';

interface FarmCardProps {
  farm: {
    id: string;
    slug: string;
    title: string;
    description: string;
    platform: string[];
    versions: string[];
    preview_image: string | null;
    upvotes_count: number;
    created_at: string;
    tags: string[];
    video_url: string | null;
    estimated_time: number | null;
    author?: {
      username: string;
      avatar_url: string | null;
    };
    author_id?: string;
  };
  index?: number;
}

export default function FarmCard({ farm, index = 0 }: FarmCardProps) {
  const platformColors: Record<string, string> = {
    java: 'bg-blue-500',
    bedrock: 'bg-green-500',
    xbox: 'bg-green-600',
    playstation: 'bg-blue-600',
    switch: 'bg-red-500',
    mobile: 'bg-purple-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="bg-white rounded-xl overflow-hidden shadow-minecraft hover:shadow-minecraft-lg transition-all duration-300"
    >
      <Link to={`/farms/${farm.platform[0] || 'java'}/${farm.slug}`}>
        <div className="relative h-48 bg-gradient-to-br from-minecraft-green-light to-minecraft-indigo-light overflow-hidden">
          {farm.preview_image ? (
            <img
              src={farm.preview_image}
              alt={farm.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🧱
            </div>
          )}
          {farm.video_url && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded flex items-center space-x-1 text-xs">
              <Video size={12} />
              <span>Video</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {farm.platform.slice(0, 2).map((p) => (
              <span
                key={p}
                className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                  platformColors[p.toLowerCase()] || 'bg-gray-500'
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {farm.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {farm.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            {farm.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-minecraft-green/10 text-minecraft-green-dark rounded text-xs"
              >
                <Tag size={10} />
                <span>{tag}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <ThumbsUp size={16} />
                <span>{farm.upvotes_count}</span>
              </div>
              {farm.estimated_time && (
                <div className="flex items-center space-x-1">
                  <Clock size={16} />
                  <span>{farm.estimated_time}m</span>
                </div>
              )}
            </div>
            <span className="text-xs">
              {formatDistanceToNow(new Date(farm.created_at), { addSuffix: true })}
            </span>
          </div>

          {farm.author && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center space-x-2">
              {farm.author.avatar_url ? (
                <img
                  src={farm.author.avatar_url}
                  alt={farm.author.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {getMinecraftMobAvatar((farm as any).author_id || farm.author.username)}
                </div>
              )}
              <span className="text-xs text-gray-600">by {farm.author.username}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

