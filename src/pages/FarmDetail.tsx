import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  Clock,
  Copy,
  Check,
  Video,
  Tag,
  Share2,
  Flag,
  ArrowLeft,
  Play,
  Edit3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms, mockComments } from '../lib/demoData';
import { User as SupabaseUser } from '@supabase/supabase-js';
import CommentsSection from '../components/CommentsSection';
import StepsEditor from '../components/StepsEditor';

interface FarmDetailProps {
  user: SupabaseUser | null;
}

export default function FarmDetail({ user }: FarmDetailProps) {
  const { platform, slug } = useParams<{ platform: string; slug: string }>();
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFarm();
  }, [slug]);

  useEffect(() => {
    if (farm && user) {
      checkUpvoted();
    }
  }, [farm, user]);

  const fetchFarm = async () => {
    if (isDemoMode()) {
      // Use mock data in demo mode
      const demoFarm = mockFarms.find(f => f.slug === slug);
      if (demoFarm) {
        setFarm(demoFarm);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*, users:author_id(id, username, avatar_url, bio)')
        .eq('slug', slug)
        .eq('public', true)
        .single();

      if (error) throw error;
      setFarm(data);
    } catch (error) {
      console.error('Error fetching farm:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUpvoted = async () => {
    if (!user || !farm) return;
    const { data } = await supabase
      .from('upvotes')
      .select('*')
      .eq('farm_id', farm.id)
      .eq('user_id', user.id)
      .single();

    setUpvoted(!!data);
  };

  const handleUpvote = async () => {
    if (!user) {
      navigate('/account');
      return;
    }

    if (!farm) return;

    try {
      if (upvoted) {
        await supabase
          .from('upvotes')
          .delete()
          .eq('farm_id', farm.id)
          .eq('user_id', user.id);

        setFarm({ ...farm, upvotes_count: farm.upvotes_count - 1 });
        setUpvoted(false);
      } else {
        await supabase
          .from('upvotes')
          .insert({ farm_id: farm.id, user_id: user.id });

        setFarm({ ...farm, upvotes_count: farm.upvotes_count + 1 });
        setUpvoted(true);
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: farm?.title,
          text: farm?.description,
          url,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied('share');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleReport = () => {
    if (!user) {
      navigate('/account');
      return;
    }
    // Open report modal or navigate to report page
    alert('Report functionality - to be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl font-display text-minecraft-green animate-pulse">
          Loading farm...
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display text-gray-900 mb-4">Farm Not Found</h1>
          <Link
            to="/farms"
            className="px-6 py-3 bg-minecraft-green text-white rounded-xl hover:bg-minecraft-green-dark transition-colors inline-block"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const materials = farm.materials || [];
  const optionalMaterials = farm.optional_materials || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/farms"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-minecraft-green mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Browse</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image/Video */}
            <div className="bg-white rounded-xl shadow-minecraft overflow-hidden">
              {farm.video_url ? (
                <div className="aspect-video bg-gray-900">
                  <iframe
                    src={farm.video_url.replace('watch?v=', 'embed/').split('&')[0]}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : farm.preview_image ? (
                <img
                  src={farm.preview_image}
                  alt={farm.title}
                  className="w-full h-auto"
                  loading="eager"
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-minecraft-green to-minecraft-indigo flex items-center justify-center text-8xl">
                  🧱
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-display text-gray-900 mb-2">{farm.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {farm.platform.map((p: string) => (
                      <span
                        key={p}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-semibold"
                      >
                        {p}
                      </span>
                    ))}
                    {farm.versions.map((v: string) => (
                      <span
                        key={v}
                        className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-lg mb-6 whitespace-pre-wrap">{farm.description}</p>

              {/* Tags */}
              {farm.tags && farm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {farm.tags.map((tag: string) => (
                    <Link
                      key={tag}
                      to={`/tag/${tag}`}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-minecraft-green/10 text-minecraft-green-dark rounded-full text-sm hover:bg-minecraft-green/20 transition-colors"
                    >
                      <Tag size={12} />
                      <span>{tag}</span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUpvote}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    upvoted
                      ? 'bg-minecraft-green text-white shadow-minecraft-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ThumbsUp size={20} fill={upvoted ? 'currentColor' : 'none'} />
                  <span>{farm.upvotes_count}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-6 py-3 bg-minecraft-indigo text-white rounded-xl font-semibold hover:bg-minecraft-indigo-dark transition-colors"
                >
                  <Share2 size={20} />
                  <span>{copied === 'share' ? 'Copied!' : 'Share'}</span>
                </button>
                <button
                  onClick={handleReport}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  <Flag size={20} />
                  <span>Report</span>
                </button>
                {user && user.id === farm.author_id && (
                  <Link
                    to={`/upload?edit=${farm.id}`}
                    className="flex items-center space-x-2 px-6 py-3 bg-minecraft-gold text-white rounded-xl font-semibold hover:bg-minecraft-gold-dark transition-colors"
                  >
                    <Edit3 size={20} />
                    <span>Edit</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Steps */}
            {farm.steps && farm.steps.length > 0 && (
              <div className="bg-white rounded-xl shadow-minecraft p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                  <Play className="text-minecraft-green" />
                  <span>Build Steps</span>
                </h2>
                <StepsEditor
                  steps={farm.steps}
                  farmId={farm.id}
                  readOnly={user?.id !== farm.author_id}
                />
              </div>
            )}

            {/* Materials */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Required Materials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {materials.map((material: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2 border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🧱</span>
                      <div>
                        <div className="font-semibold">{material.name || material.item}</div>
                        {material.count && (
                          <div className="text-sm text-gray-600">x{material.count}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleCopy(`${material.name || material.item} x${material.count || 1}`, `mat-${index}`)
                      }
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copied === `mat-${index}` ? (
                        <Check className="text-green-600" size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {optionalMaterials.length > 0 && (
                <>
                  <h3 className="text-xl font-semibold mb-4">Optional Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {optionalMaterials.map((material: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">✨</span>
                          <div>
                            <div className="font-semibold">{material.name || material.item}</div>
                            {material.count && (
                              <div className="text-sm text-gray-600">x{material.count}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Additional Info */}
            {(farm.estimated_time || farm.notes || farm.chunk_requirements || farm.height_requirements) && (
              <div className="bg-white rounded-xl shadow-minecraft p-6">
                <h2 className="text-2xl font-bold mb-4">Additional Information</h2>
                <div className="space-y-4">
                  {farm.estimated_time && (
                    <div className="flex items-center space-x-3">
                      <Clock className="text-minecraft-gold" size={24} />
                      <div>
                        <div className="font-semibold">Estimated Build Time</div>
                        <div className="text-gray-600">{farm.estimated_time} minutes</div>
                      </div>
                    </div>
                  )}
                  {farm.chunk_requirements && (
                    <div>
                      <div className="font-semibold mb-1">Chunk Requirements</div>
                      <div className="text-gray-600">{farm.chunk_requirements}</div>
                    </div>
                  )}
                  {farm.height_requirements && (
                    <div>
                      <div className="font-semibold mb-1">Height Requirements</div>
                      <div className="text-gray-600">{farm.height_requirements}</div>
                    </div>
                  )}
                  {farm.notes && (
                    <div>
                      <div className="font-semibold mb-1">Notes</div>
                      <div className="text-gray-600 whitespace-pre-wrap">{farm.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            <CommentsSection farmId={farm.id} user={user} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Created By</h3>
              <div className="flex items-center space-x-3">
                {farm.users?.avatar_url ? (
                  <img
                    src={farm.users.avatar_url}
                    alt={farm.users.username}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-minecraft-green flex items-center justify-center text-white font-bold">
                    {farm.users?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{farm.users?.username || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(farm.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              {farm.users?.bio && (
                <p className="mt-4 text-sm text-gray-600">{farm.users.bio}</p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Upvotes</span>
                  <span className="font-semibold">{farm.upvotes_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platforms</span>
                  <span className="font-semibold">{farm.platform.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Versions</span>
                  <span className="font-semibold">{farm.versions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold">
                    {new Date(farm.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

