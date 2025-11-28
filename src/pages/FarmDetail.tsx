import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  Clock,
  Tag,
  Share2,
  Flag,
  ArrowLeft,
  Play,
  Edit3,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { isDemoMode, mockFarms } from '../lib/demoData';
import { User as SupabaseUser } from '@supabase/supabase-js';
import CommentsSection from '../components/CommentsSection';
import StepsEditor from '../components/StepsEditor';
import { getMinecraftMobAvatar, getYouTubeThumbnail, getYouTubeVideoId } from '../lib/avatarUtils';
import { getMinecraftItemIcon } from '../lib/minecraftItemIcons';

interface FarmDetailProps {
  user: SupabaseUser | null;
}

export default function FarmDetail({ user }: FarmDetailProps) {
  const { slug } = useParams<{ platform: string; slug: string }>();
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [checkedMaterials, setCheckedMaterials] = useState<Set<number>>(new Set());
  const [youtubeCreator, setYoutubeCreator] = useState<{ name: string; avatar: string; channelId: string } | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFarm();
  }, [slug]);

  useEffect(() => {
    if (farm && user) {
      checkUpvoted();
    }
  }, [farm, user]);

  useEffect(() => {
    if (farm?.video_url) {
      fetchYouTubeCreator(farm.video_url, farm?.farm_designer);
    } else if (farm?.farm_designer) {
      // If we have farm_designer but no video URL, create a simple creator object
      setYoutubeCreator({
        name: farm.farm_designer,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(farm.farm_designer)}&background=FF0000&color=fff&bold=true&size=128&font-size=0.6`,
        channelId: '',
      });
    } else {
      setYoutubeCreator(null);
    }
  }, [farm?.video_url, farm?.farm_designer]);

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

  const handleMaterialToggle = (index: number) => {
    setCheckedMaterials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
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

  // Extract YouTube channel info from video URL
  const fetchYouTubeCreator = async (videoUrl: string, fallbackDesigner?: string) => {
    if (!videoUrl || (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be'))) {
      setYoutubeCreator(null);
      return;
    }

    setLoadingCreator(true);
    try {
      // Use YouTube oEmbed API to get video info (no API key needed)
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
      const response = await fetch(oembedUrl);
      if (!response.ok) throw new Error('Failed to fetch video info');
      
      const data = await response.json();
      // oEmbed provides author_name and author_url
      const authorName = data.author_name || 'Unknown Creator';
      const authorUrl = data.author_url || '';

      // Extract channel ID from author URL or video URL
      let channelId = '';
      const channelMatch = authorUrl.match(/channel\/([^/?]+)/);
      if (channelMatch) {
        channelId = channelMatch[1];
      } else {
        // Try to get from custom URL
        const customMatch = authorUrl.match(/c\/([^/?]+)/) || authorUrl.match(/user\/([^/?]+)/);
        if (customMatch) {
          channelId = customMatch[1];
        }
      }

      // Get channel thumbnail/avatar
      let avatarUrl = '';
      
      // Try different methods to get avatar
      if (channelId && channelId.startsWith('UC') && channelId.length === 24) {
        // Standard channel ID format - try YouTube's thumbnail API pattern
        avatarUrl = `https://yt3.ggpht.com/${channelId}=s176-c-k-c0x00ffffff-no-rj`;
      } else {
        // Use generated avatar with YouTube red color scheme
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FF0000&color=fff&bold=true&size=128&font-size=0.6`;
      }

      setYoutubeCreator({
        name: authorName,
        avatar: avatarUrl,
        channelId: channelId || authorUrl,
      });
    } catch (error) {
      console.error('Error fetching YouTube creator:', error);
      // Fallback to farm_designer if available
      if (fallbackDesigner) {
        setYoutubeCreator({
          name: fallbackDesigner,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackDesigner)}&background=FF0000&color=fff&bold=true&size=128&font-size=0.6`,
          channelId: '',
        });
      } else {
        setYoutubeCreator(null);
      }
    } finally {
      setLoadingCreator(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !farm) return;
    
    if (user.id !== farm.author_id) {
      alert('You can only delete your own farms.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${farm.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete associated images from storage if any
      if (farm.images && farm.images.length > 0 && user.id) {
        const imagePromises = farm.images.map(async (imageUrl: string) => {
          // Extract the file path from the URL
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user.id}/${fileName}`;
          
          try {
            await supabase.storage
              .from('farm-images')
              .remove([filePath]);
          } catch (error) {
            console.error('Error deleting image:', error);
            // Continue even if image deletion fails
          }
        });
        
        await Promise.all(imagePromises);
      }

      // Delete the farm (this will cascade delete comments and upvotes)
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farm.id);

      if (error) throw error;

      alert('Farm deleted successfully.');
      navigate('/farms');
    } catch (error: any) {
      console.error('Error deleting farm:', error);
      alert(error.message || 'Failed to delete farm. Please try again.');
    }
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
  
  // Get image source: preview_image, YouTube thumbnail, or null
  const imageSrc = farm.preview_image || getYouTubeThumbnail(farm.video_url);

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
              ) : imageSrc ? (
                <img
                  src={imageSrc}
                  alt={farm.title}
                  className="w-full h-auto"
                  loading="eager"
                  onError={(e) => {
                    // If YouTube thumbnail fails, try hqdefault as fallback
                    const videoId = getYouTubeVideoId(farm.video_url);
                    if (videoId && imageSrc?.includes('maxresdefault')) {
                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    }
                    // If that also fails, the browser will show broken image, which is acceptable
                  }}
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
                  <>
                    <Link
                      to={`/upload?edit=${farm.id}`}
                      className="flex items-center space-x-2 px-6 py-3 bg-minecraft-gold text-white rounded-xl font-semibold hover:bg-minecraft-gold-dark transition-colors"
                    >
                      <Edit3 size={20} />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                      <span>Delete</span>
                    </button>
                  </>
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
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <img
                          src={getMinecraftItemIcon(material.name || material.item)}
                          alt={material.name || material.item}
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'inline';
                            }
                          }}
                        />
                        <span className="text-2xl hidden">🧱</span>
                      </div>
                      <div>
                        <div className="font-semibold">{material.name || material.item}</div>
                        {material.count && (
                          <div className="text-sm text-gray-600">x{material.count}</div>
                        )}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={checkedMaterials.has(index)}
                      onChange={() => handleMaterialToggle(index)}
                      className="w-5 h-5 text-minecraft-green rounded focus:ring-minecraft-green cursor-pointer"
                    />
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
                          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <img
                              src={getMinecraftItemIcon(material.name || material.item)}
                              alt={material.name || material.item}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                // Fallback to emoji if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'inline';
                                }
                              }}
                            />
                            <span className="text-2xl hidden">✨</span>
                          </div>
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

            {/* Farm Outputs */}
            {(farm.farmable_items?.length > 0 || farm.drop_rate_per_hour?.length > 0) && (
              <div className="bg-white rounded-xl shadow-minecraft p-6">
                <h2 className="text-2xl font-bold mb-4">Farm Outputs</h2>
                <div className="space-y-6">
                  {/* Farmable Items */}
                  {farm.farmable_items && farm.farmable_items.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Items This Farm Produces</h3>
                      <div className="flex flex-wrap gap-3">
                        {farm.farmable_items.map((item: string) => (
                          <div
                            key={item}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg border-2 border-blue-200"
                          >
                            <img
                              src={getMinecraftItemIcon(item)}
                              alt={item}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <span className="font-semibold text-blue-900">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drop Rates */}
                  {farm.drop_rate_per_hour && farm.drop_rate_per_hour.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Drop Rate Per Hour</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {farm.drop_rate_per_hour.map((dropRate: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border-2 border-green-200"
                          >
                            <img
                              src={getMinecraftItemIcon(dropRate.item)}
                              alt={dropRate.item}
                              className="w-10 h-10 object-contain flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{dropRate.item}</div>
                              <div className="text-sm text-gray-600">{dropRate.rate}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            {(farm.estimated_time || farm.notes || farm.chunk_requirements || farm.height_requirements || farm.required_biome) && (
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
                  {farm.required_biome && (
                    <div>
                      <div className="font-semibold mb-1">Required Biome</div>
                      <div className="text-gray-600">{farm.required_biome}</div>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* YouTube Channel Card */}
            {(youtubeCreator || farm?.farm_designer) && (
              <div className="bg-white rounded-xl shadow-minecraft p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Designed By</h3>
                {loadingCreator ? (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-minecraft-green"></div>
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : youtubeCreator ? (
                  <div className="flex items-center space-x-3">
                    <img
                      src={youtubeCreator.avatar}
                      alt={youtubeCreator.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-red-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(youtubeCreator.name)}&background=FF0000&color=fff&bold=true&size=128`;
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{youtubeCreator.name}</div>
                      <div className="text-sm text-gray-600">YouTube Creator</div>
                      {youtubeCreator.channelId && (
                        <a
                          href={youtubeCreator.channelId.startsWith('http') ? youtubeCreator.channelId : `https://youtube.com/${youtubeCreator.channelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-red-600 hover:text-red-700 mt-1 inline-block"
                        >
                          View Channel →
                        </a>
                      )}
                    </div>
                  </div>
                ) : farm?.farm_designer ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
                      🎬
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{farm.farm_designer}</div>
                      <div className="text-sm text-gray-600">Farm Designer</div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Uploaded By</h3>
              <div className="flex items-center space-x-3">
                {farm.users?.avatar_url ? (
                  <img
                    src={farm.users.avatar_url}
                    alt={farm.users.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
                    {getMinecraftMobAvatar(farm.author_id)}
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

            {/* Comments */}
            <CommentsSection farmId={farm.id} user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

