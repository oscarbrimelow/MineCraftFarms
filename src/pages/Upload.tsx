import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Upload as UploadIcon, X, Eye, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/demoData';
import { User as SupabaseUser } from '@supabase/supabase-js';
import YouTubeCaptionExtractor from '../components/YouTubeCaptionExtractor';

interface UploadProps {
  user: SupabaseUser | null;
}

const PLATFORMS = ['Java', 'Bedrock', 'Xbox', 'PlayStation', 'Switch', 'Mobile'];
const COMMON_VERSIONS = [
  '1.21', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.15.2', '1.15.1', '1.15',
  '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
  '1.13.2', '1.13.1', '1.13',
  '1.12.2', '1.12.1', '1.12',
  '1.11.2', '1.11.1', '1.11',
  '1.10.2', '1.10.1', '1.10',
  '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9',
  '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8',
];
const COMMON_MATERIALS = [
  'Redstone Dust', 'Redstone Repeater', 'Redstone Comparator', 'Hopper', 'Chest',
  'Observer', 'Piston', 'Sticky Piston', 'Slime Block', 'Iron Block',
  'Glass', 'Sand', 'Gravel', 'Cobblestone', 'Stone', 'Wood Planks',
  'Dirt', 'Grass Block', 'Water Bucket', 'Lava Bucket', 'Torch',
];

export default function Upload({ user }: UploadProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    platform: [] as string[],
    versions: [] as string[],
    video_url: '',
    materials: [] as Array<{ name: string; count: number }>,
    optional_materials: [] as Array<{ name: string; count: number }>,
    tags: [] as string[],
    estimated_time: '',
    chunk_requirements: '',
    height_requirements: '',
    notes: '',
    farm_designer: '',
    public: true,
  });

  const [newMaterial, setNewMaterial] = useState({ name: '', count: 1 });
  const [newTag, setNewTag] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showCaptionExtractor, setShowCaptionExtractor] = useState(false);
  const [youtubeCreator, setYoutubeCreator] = useState<{ name: string; avatar: string; channelId: string } | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(false);

  useEffect(() => {
    if (editId && user) {
      fetchFarm();
    }
  }, [editId, user]);

  useEffect(() => {
    if (isDemoMode() || !user) {
      // In demo mode or if not logged in, show message
      if (isDemoMode()) {
        return; // Allow viewing in demo mode
      }
      navigate('/account');
    }
  }, [user, navigate]);

  if (isDemoMode()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-minecraft p-12">
            <h1 className="text-4xl font-display text-gray-900 mb-4">Upload Farm</h1>
            <p className="text-xl text-gray-600 mb-8">
              Upload functionality requires Supabase setup. 
              You're currently in preview mode with demo data.
            </p>
            <p className="text-gray-600 mb-8">
              To enable uploads, please:
            </p>
            <ol className="text-left max-w-md mx-auto space-y-2 mb-8">
              <li>1. Set up a Supabase project</li>
              <li>2. Run the database schema</li>
              <li>3. Add your credentials to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
              <li>4. Restart the dev server</li>
            </ol>
            <Link
              to="/farms"
              className="inline-block px-8 py-4 bg-minecraft-green text-white rounded-xl font-bold text-lg shadow-minecraft hover:shadow-minecraft-lg transition-all"
            >
              Browse Demo Farms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fetchFarm = async () => {
    try {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('id', editId)
        .single();

      if (error) throw error;
      if (data.author_id !== user?.id) {
        alert('You can only edit your own farms.');
        navigate('/farms');
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        platform: data.platform,
        versions: data.versions,
        video_url: data.video_url || '',
        materials: data.materials || [],
        optional_materials: data.optional_materials || [],
        tags: data.tags || [],
        estimated_time: data.estimated_time?.toString() || '',
        chunk_requirements: data.chunk_requirements || '',
        height_requirements: data.height_requirements || '',
        notes: data.notes || '',
        farm_designer: data.farm_designer || '',
        public: data.public,
      });
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching farm:', error);
      navigate('/farms');
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platform: prev.platform.includes(platform)
        ? prev.platform.filter((p) => p !== platform)
        : [...prev.platform, platform],
    }));
  };

  // Extract YouTube channel info from video URL
  const fetchYouTubeCreator = async (videoUrl: string) => {
    if (!videoUrl || !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      setYoutubeCreator(null);
      return;
    }

    setLoadingCreator(true);
    try {
      // Extract video ID
      let videoId = '';
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      if (match) {
        videoId = match[1];
      } else {
        setYoutubeCreator(null);
        setLoadingCreator(false);
        return;
      }

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
      // YouTube oEmbed doesn't provide profile pictures directly
      // We'll try to construct a thumbnail URL or use a generated avatar
      let avatarUrl = '';
      
      // Try to get channel thumbnail from YouTube's thumbnail service
      // For custom URLs, we can't easily get the channel ID, so use generated avatar
      if (channelId && channelId.length > 10) {
        // It's a channel ID (format: UC...)
        avatarUrl = `https://yt3.googleusercontent.com/ytc/${channelId}=s176-c-k-c0x00ffffff-no-rj`;
      } else if (authorUrl) {
        // Try to fetch channel page to get thumbnail (might not work due to CORS)
        // For now, use generated avatar based on channel name
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FF0000&color=fff&bold=true&size=128`;
      } else {
        avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FF0000&color=fff&bold=true&size=128`;
      }

      setYoutubeCreator({
        name: authorName,
        avatar: avatarUrl,
        channelId: channelId || authorUrl,
      });

      // Auto-populate farm_designer if empty
      if (!formData.farm_designer.trim()) {
        setFormData((prev) => ({
          ...prev,
          farm_designer: authorName,
        }));
      }
    } catch (error) {
      console.error('Error fetching YouTube creator:', error);
      setYoutubeCreator(null);
    } finally {
      setLoadingCreator(false);
    }
  };

  // Watch for video URL changes
  useEffect(() => {
    if (formData.video_url) {
      const timeoutId = setTimeout(() => {
        fetchYouTubeCreator(formData.video_url);
      }, 500); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setYoutubeCreator(null);
    }
  }, [formData.video_url]);

  const handleAddVersion = () => {
    if (newVersion.trim() && !formData.versions.includes(newVersion.trim())) {
      setFormData((prev) => ({
        ...prev,
        versions: [...prev.versions, newVersion.trim()],
      }));
      setNewVersion('');
    }
  };

  const handleSelectAllVersions = () => {
    setFormData((prev) => ({
      ...prev,
      versions: COMMON_VERSIONS.slice(),
    }));
  };

  const handleToggleVersion = (version: string) => {
    setFormData((prev) => {
      if (prev.versions.includes(version)) {
        return {
          ...prev,
          versions: prev.versions.filter((v) => v !== version),
        };
      } else {
        return {
          ...prev,
          versions: [...prev.versions, version],
        };
      }
    });
  };

  const handleRemoveVersion = (version: string) => {
    setFormData((prev) => ({
      ...prev,
      versions: prev.versions.filter((v) => v !== version),
    }));
  };

  const handleAddMaterial = (optional = false) => {
    if (!newMaterial.name.trim()) return;

    const materials = optional ? formData.optional_materials : formData.materials;
    const existingIndex = materials.findIndex((m) => m.name === newMaterial.name);

    if (existingIndex >= 0) {
      const updated = [...materials];
      updated[existingIndex].count += newMaterial.count;
      setFormData((prev) => ({
        ...prev,
        [optional ? 'optional_materials' : 'materials']: updated,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [optional ? 'optional_materials' : 'materials']: [
          ...materials,
          { name: newMaterial.name, count: newMaterial.count },
        ],
      }));
    }
    setNewMaterial({ name: '', count: 1 });
  };

  const handleRemoveMaterial = (index: number, optional = false) => {
    setFormData((prev) => ({
      ...prev,
      [optional ? 'optional_materials' : 'materials']: (
        optional ? prev.optional_materials : prev.materials
      ).filter((_, i) => i !== index),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data, error } = await supabase.storage
          .from('farm-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('farm-images')
          .getPublicUrl(data.path);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setImages([...images, ...urls]);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(error.message || 'Failed to upload images. Please check that the storage bucket exists and you have permission.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in title and description.');
      return;
    }

    if (formData.platform.length === 0) {
      alert('Please select at least one platform.');
      return;
    }

    // Only require versions if Java is selected
    if (formData.platform.includes('Java') && formData.versions.length === 0) {
      alert('Please add at least one version for Java.');
      return;
    }

    setUploading(true);
    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const farmData: any = {
        title: formData.title,
        description: formData.description,
        platform: formData.platform,
        versions: formData.versions.length > 0 ? formData.versions : [],
        video_url: formData.video_url || null,
        materials: formData.materials,
        optional_materials: formData.optional_materials,
        images,
        preview_image: images[0] || null,
        tags: formData.tags,
        estimated_time: formData.estimated_time ? parseInt(formData.estimated_time) : null,
        chunk_requirements: formData.chunk_requirements || null,
        height_requirements: formData.height_requirements || null,
        notes: formData.notes || null,
        farm_designer: formData.farm_designer || null,
        public: formData.public,
        slug,
        ...(editId ? {} : { author_id: user?.id, upvotes_count: 0 }),
      };

      if (editId) {
        const { error } = await supabase
          .from('farms')
          .update({
            ...farmData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId);

        if (error) throw error;
        navigate(`/farms/${formData.platform[0]}/${slug}`);
      } else {
        const { error } = await supabase
          .from('farms')
          .insert([farmData]);

        if (error) throw error;
        navigate('/farms');
      }
    } catch (error: any) {
      console.error('Error saving farm:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to save farm. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  if (!user && !isDemoMode()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-display text-gray-900 mb-8">
          {editId ? 'Edit Farm' : 'Upload New Farm'}
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Eye size={18} />
            <span>{preview ? 'Edit' : 'Preview'}</span>
          </button>
        </div>

        {preview ? (
          <div className="bg-white rounded-xl shadow-minecraft p-6">
            <h2 className="text-3xl font-display mb-4">{formData.title || 'Untitled'}</h2>
            <p className="text-gray-700 mb-4">{formData.description || 'No description'}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.platform.map((p) => (
                <span key={p} className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                  {p}
                </span>
              ))}
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Materials:</h3>
              <ul className="list-disc list-inside">
                {formData.materials.map((m, i) => (
                  <li key={i}>{m.name} x{m.count}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Auto Sugarcane Farm"
                    className="w-full px-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your farm, its features, and efficiency..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
              </div>
            </div>

            {/* Platform & Versions */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Platform & Versions</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Platform *</label>
                  <div className="flex flex-wrap gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => handlePlatformToggle(platform)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                          formData.platform.includes(platform)
                            ? 'bg-minecraft-green text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
                <AnimatePresence>
                  {formData.platform.includes('Java') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div>
                        <label className="block font-semibold mb-2">Java Versions *</label>
                        <div className="flex items-center gap-4 mb-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.versions.length === COMMON_VERSIONS.length && 
                                       COMMON_VERSIONS.every(v => formData.versions.includes(v))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSelectAllVersions();
                                } else {
                                  setFormData(prev => ({ ...prev, versions: [] }));
                                }
                              }}
                              className="w-4 h-4 text-minecraft-green rounded focus:ring-minecraft-green"
                            />
                            <span className="text-sm font-medium">Select All Available Versions</span>
                          </label>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newVersion}
                            onChange={(e) => setNewVersion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddVersion()}
                            placeholder="e.g., 1.20.1 (or select from list below)"
                            className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                          />
                          <button
                            type="button"
                            onClick={handleAddVersion}
                            className="px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark"
                          >
                            Add
                          </button>
                        </div>
                        
                        {/* Version Selection Grid */}
                        <div className="mb-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 max-h-48 overflow-y-auto">
                          <p className="text-xs text-gray-600 mb-2 font-semibold">Quick Select Common Versions:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {COMMON_VERSIONS.map((version) => (
                              <label
                                key={version}
                                className="flex items-center space-x-1 cursor-pointer hover:bg-gray-200 p-1 rounded text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.versions.includes(version)}
                                  onChange={() => handleToggleVersion(version)}
                                  className="w-3 h-3 text-minecraft-green rounded focus:ring-minecraft-green"
                                />
                                <span>{version}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Selected Versions Display */}
                        <div className="flex flex-wrap gap-2">
                          {formData.versions.map((version) => (
                            <span
                              key={version}
                              className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-700 text-white rounded-full text-sm"
                            >
                              <span>{version}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVersion(version)}
                                className="hover:text-red-300"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                          {formData.versions.length === 0 && (
                            <span className="text-sm text-gray-500">No versions selected</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Video */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Video (Optional)</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">YouTube URL</label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
                
                {/* YouTube Creator Info */}
                {loadingCreator && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-minecraft-green"></div>
                    <span className="text-sm">Fetching video creator...</span>
                  </div>
                )}
                
                {youtubeCreator && !loadingCreator && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-2 border-red-200"
                  >
                    <p className="text-sm font-bold text-gray-800 mb-3">Designed by:</p>
                    <div className="flex items-center space-x-4">
                      <img
                        src={youtubeCreator.avatar}
                        alt={youtubeCreator.name}
                        className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
                        onError={(e) => {
                          // Fallback to avatar service if image fails
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(youtubeCreator.name)}&background=FF0000&color=fff&bold=true&size=128`;
                        }}
                      />
                      <div>
                        <p className="font-bold text-lg text-gray-900">{youtubeCreator.name}</p>
                        <p className="text-xs text-gray-600">YouTube Creator</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {formData.video_url && (
                  <div>
                    <button
                      onClick={() => setShowCaptionExtractor(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-minecraft-indigo text-white rounded-lg hover:bg-minecraft-indigo-dark"
                    >
                      <Video size={18} />
                      <span>Extract Steps from Video</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Images</h2>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="mb-4"
              />
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materials */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Materials</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Required Materials</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="Material name"
                      list="materials-list"
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                    />
                    <input
                      type="number"
                      value={newMaterial.count}
                      onChange={(e) => setNewMaterial({ ...newMaterial, count: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-20 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                    />
                    <button
                      onClick={() => handleAddMaterial()}
                      className="px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark"
                    >
                      Add
                    </button>
                  </div>
                  <datalist id="materials-list">
                    {COMMON_MATERIALS.map((material) => (
                      <option key={material} value={material} />
                    ))}
                  </datalist>
                  <div className="space-y-2">
                    {formData.materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span>
                          {material.name} x{material.count}
                        </span>
                        <button
                          onClick={() => handleRemoveMaterial(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-2">Optional Materials</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      placeholder="Optional material"
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial(true)}
                    />
                    <button
                      onClick={() => handleAddMaterial(true)}
                      className="px-4 py-2 bg-minecraft-gold text-white rounded-lg hover:bg-minecraft-gold-dark"
                    >
                      Add Optional
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.optional_materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                      >
                        <span>
                          {material.name} x{material.count}
                        </span>
                        <button
                          onClick={() => handleRemoveMaterial(index, true)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Tags</h2>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag"
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-minecraft-indigo text-white rounded-lg hover:bg-minecraft-indigo-dark"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center space-x-2 px-3 py-1 bg-minecraft-green/10 text-minecraft-green-dark rounded-full"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Estimated Build Time (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Chunk Requirements</label>
                  <input
                    type="text"
                    value={formData.chunk_requirements}
                    onChange={(e) => setFormData({ ...formData, chunk_requirements: e.target.value })}
                    placeholder="e.g., Requires 2x2 chunks"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Height Requirements</label>
                  <input
                    type="text"
                    value={formData.height_requirements}
                    onChange={(e) => setFormData({ ...formData, height_requirements: e.target.value })}
                    placeholder="e.g., Build at Y level 60-80"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Farm Designer (Optional)</label>
                  {youtubeCreator && (
                    <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center space-x-3">
                      <img
                        src={youtubeCreator.avatar}
                        alt={youtubeCreator.name}
                        className="w-10 h-10 rounded-full border-2 border-blue-300 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(youtubeCreator.name)}&background=3b82f6&color=fff&size=128`;
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Designed by: {youtubeCreator.name}</p>
                        <p className="text-xs text-gray-600">Auto-detected from YouTube video</p>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={formData.farm_designer}
                    onChange={(e) => setFormData({ ...formData, farm_designer: e.target.value })}
                    placeholder={youtubeCreator ? `Currently: ${youtubeCreator.name}` : "e.g., Original designer name or YouTube channel"}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {youtubeCreator 
                      ? "Credit the original designer. Auto-filled from YouTube video - you can edit if needed."
                      : "Credit the original designer if this farm is based on someone else's design"}
                  </p>
                </div>
                <div>
                  <label className="block font-semibold mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes, tips, or warnings..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-minecraft-green text-white rounded-xl font-bold text-lg shadow-minecraft hover:shadow-minecraft-lg transition-all disabled:opacity-50"
              >
                <UploadIcon size={20} />
                <span>{uploading ? 'Saving...' : editId ? 'Update Farm' : 'Publish Farm'}</span>
              </button>
            </div>
          </div>
        )}

        {showCaptionExtractor && formData.video_url && (
          <YouTubeCaptionExtractor
            videoUrl={formData.video_url}
            onStepsGenerated={(steps) => {
              // Handle steps - you can integrate this with the form
              console.log('Generated steps:', steps);
              setShowCaptionExtractor(false);
            }}
            onClose={() => setShowCaptionExtractor(false)}
          />
        )}
      </div>
    </div>
  );
}

