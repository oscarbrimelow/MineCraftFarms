import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ThumbsUp, Tag, Video, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getMinecraftMobAvatar, getYouTubeThumbnail } from '../lib/avatarUtils';

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
  };

  // Get image source: preview_image, YouTube thumbnail, or null
  const imageSrc = farm.preview_image || getYouTubeThumbnail(farm.video_url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className="group bg-white rounded-2xl overflow-hidden shadow-minecraft-lg hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,0.15)] transition-all duration-300 border-2 border-transparent hover:border-minecraft-green/30"
    >
      <Link to={`/farms/${farm.platform[0] || 'java'}/${farm.slug}`} className="block">
        <div className="relative h-52 bg-gradient-to-br from-minecraft-green-light via-minecraft-indigo-light to-minecraft-green-light overflow-hidden">
          {/* Gradient overlay on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          />
          
          {imageSrc ? (
            <motion.img
              src={imageSrc}
              alt={farm.title}
              className="w-full h-full object-cover"
              loading="lazy"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4 }}
              onError={(e) => {
                // If YouTube thumbnail fails, try hqdefault as fallback
                const videoId = farm.video_url?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
                if (videoId && imageSrc?.includes('maxresdefault')) {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                } else {
                  // Hide image and show emoji fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                }
              }}
            />
          ) : null}
          {!imageSrc && (
            <motion.div 
              className="w-full h-full flex items-center justify-center text-7xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
            >
              🧱
            </motion.div>
          )}
          
          {/* Video badge */}
          {farm.video_url && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs font-semibold shadow-minecraft-sm z-20"
            >
              <Video size={14} />
              <span>Video</span>
            </motion.div>
          )}
          
          {/* Platform badges */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 z-20">
            {farm.platform.slice(0, 2).map((p, idx) => (
              <motion.span
                key={p}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + idx * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-minecraft-sm ${
                  platformColors[p.toLowerCase()] || 'bg-gray-500'
                }`}
              >
                {p}
              </motion.span>
            ))}
          </div>

          {/* Hover arrow indicator */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-minecraft-sm z-20"
          >
            <ArrowRight size={16} className="text-minecraft-green-dark" />
          </motion.div>
        </div>

        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-minecraft-green-dark transition-colors">
            {farm.title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {farm.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {farm.tags.slice(0, 3).map((tag, idx) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 + idx * 0.05 }}
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gradient-to-r from-minecraft-green/10 to-minecraft-indigo/10 text-minecraft-green-dark rounded-lg text-xs font-semibold border border-minecraft-green/20"
              >
                <Tag size={10} />
                <span>{tag}</span>
              </motion.span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-5">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center space-x-1.5 font-semibold"
              >
                <ThumbsUp size={16} className="text-minecraft-green" />
                <span>{farm.upvotes_count}</span>
              </motion.div>
              {farm.estimated_time && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center space-x-1.5 font-semibold"
                >
                  <Clock size={16} className="text-minecraft-indigo" />
                  <span>{farm.estimated_time}m</span>
                </motion.div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(farm.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Author */}
          {farm.author && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
              className="pt-4 border-t border-gray-200 flex items-center space-x-2"
            >
              {farm.author.avatar_url ? (
                <motion.img
                  src={farm.author.avatar_url}
                  alt={farm.author.username}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-minecraft-green/20"
                  whileHover={{ scale: 1.1 }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-minecraft-green-light to-minecraft-indigo-light flex items-center justify-center text-lg ring-2 ring-minecraft-green/20">
                  {getMinecraftMobAvatar((farm as any).author_id || farm.author.username)}
                </div>
              )}
              <span className="text-xs text-gray-600 font-medium">by {farm.author.username}</span>
            </motion.div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

