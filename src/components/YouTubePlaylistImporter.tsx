import { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Loader, Download, Edit2, Save, X, CheckCircle, AlertCircle, Play } from 'lucide-react';
import Papa from 'papaparse';
import { FARM_CATEGORIES } from '../lib/farmCategories';

interface VideoData {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
}

interface ExtractedFarmData {
  title: string;
  description: string;
  category: string;
  platform: string[];
  versions: string[];
  video_url: string;
  materials?: string;
  optional_materials?: string;
  tags?: string[];
  farmable_items?: string[];
  estimated_time?: number;
  required_biome?: string;
  farm_designer?: string;
  notes?: string;
  drop_rate_per_hour?: string;
  confidence?: number;
  needsReview?: boolean;
  errors?: string[];
}

interface YouTubePlaylistImporterProps {
  user: any;
}

export default function YouTubePlaylistImporter({ user: _user }: YouTubePlaylistImporterProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [extractedFarms, setExtractedFarms] = useState<ExtractedFarmData[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingFarm, setEditingFarm] = useState<ExtractedFarmData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Default YouTube API key (can be overridden)
  const [apiKey, setApiKey] = useState('AIzaSyAyPevBnX9PkcFtqDdm_lJWvRkcOIPFXIA');
  const [openaiKey, setOpenaiKey] = useState('');

  const extractPlaylistId = (url: string): string | null => {
    const patterns = [
      /[?&]list=([a-zA-Z0-9_-]+)/,
      /playlist\?list=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fetchPlaylistVideos = async (playlistId: string): Promise<VideoData[]> => {
    const videos: VideoData[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const url: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response: Response = await fetch(url);
      if (!response.ok) {
        const errorData: any = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch playlist');
      }

      const data: any = await response.json();
      
      for (const item of data.items || []) {
        if (item.snippet.resourceId.kind === 'youtube#video') {
          videos.push({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description || '',
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            channelTitle: item.snippet.channelTitle || '',
            publishedAt: item.snippet.publishedAt || '',
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          });
        }
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return videos;
  };

  const analyzeVideoWithAI = async (video: VideoData): Promise<ExtractedFarmData> => {
    const prompt = `You are analyzing a Minecraft farm tutorial video. Extract structured data from the following video information:

Title: ${video.title}
Description: ${video.description.substring(0, 2000)}
Channel: ${video.channelTitle}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):
{
  "title": "Farm title (use video title if appropriate, or create a descriptive title)",
  "description": "Brief description of the farm (2-3 sentences)",
  "category": "One of these exact categories: ${FARM_CATEGORIES.join(', ')}",
  "platform": ["Java"] or ["Bedrock"] or ["Java", "Bedrock"] - determine from title/description,
  "versions": ["1.21"] or similar - extract Minecraft version(s) mentioned,
  "materials": "Simple text format like '64 Cobbled Deepslate; 32 Glass; 16 Hopper' - extract all materials with quantities",
  "optional_materials": "Optional materials if mentioned, same format",
  "tags": ["tag1", "tag2"] - relevant tags like "iron-farm", "mob-farm", "efficient",
  "farmable_items": ["Item Name"] - what items does this farm produce,
  "estimated_time": 120 - build time in minutes if mentioned,
  "required_biome": "Biome name if specific biome required",
  "farm_designer": "${video.channelTitle}" - the channel name,
  "drop_rate_per_hour": "Item: 3600/hour" - if mentioned,
  "notes": "Any important notes or requirements"
}

Rules:
- If category is unclear, choose the closest match from the list
- Platform must be "Java" or "Bedrock" or both
- Versions should be in format like "1.21", "1.20.6"
- Materials should be in simple text format: "quantity Item Name; quantity Item Name"
- If information is missing, use null or empty string
- Be accurate and only extract information that is clearly stated or implied

Return ONLY the JSON object, nothing else.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Using GPT-4o for best accuracy
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts structured data from Minecraft farm tutorial videos. Always return valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'AI analysis failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      
      // Clean the response (remove markdown code blocks if present)
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let extracted: any;
      try {
        extracted = JSON.parse(cleanedContent);
      } catch (parseError) {
        // Try to extract JSON from the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extracted = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI response');
        }
      }

      // Validate and normalize the extracted data
      const farmData: ExtractedFarmData = {
        title: extracted.title || video.title,
        description: extracted.description || 'Minecraft farm tutorial',
        category: extracted.category || 'Mob Farm',
        platform: Array.isArray(extracted.platform) ? extracted.platform : [extracted.platform || 'Java'],
        versions: Array.isArray(extracted.versions) ? extracted.versions : [extracted.versions || '1.21'],
        video_url: video.url,
        materials: extracted.materials || '',
        optional_materials: extracted.optional_materials || '',
        tags: Array.isArray(extracted.tags) ? extracted.tags : [],
        farmable_items: Array.isArray(extracted.farmable_items) ? extracted.farmable_items : [],
        estimated_time: extracted.estimated_time ? parseInt(String(extracted.estimated_time)) : undefined,
        required_biome: extracted.required_biome || '',
        farm_designer: extracted.farm_designer || video.channelTitle,
        notes: extracted.notes || '',
        drop_rate_per_hour: extracted.drop_rate_per_hour || '',
        confidence: 0.8,
        needsReview: !extracted.category || !FARM_CATEGORIES.includes(extracted.category),
      };

      // Validate category
      if (!FARM_CATEGORIES.includes(farmData.category)) {
        farmData.needsReview = true;
        farmData.errors = [...(farmData.errors || []), `Invalid category: ${farmData.category}`];
      }

      return farmData;
    } catch (error: any) {
      console.error('AI analysis error:', error);
      // Return a basic structure if AI fails
      return {
        title: video.title,
        description: video.description.substring(0, 200) || 'Minecraft farm tutorial',
        category: 'Mob Farm',
        platform: ['Java'],
        versions: ['1.21'],
        video_url: video.url,
        needsReview: true,
        errors: [error.message || 'AI analysis failed'],
        confidence: 0.3,
      };
    }
  };

  const handleProcessPlaylist = async () => {
    if (!playlistUrl.trim()) {
      setError('Please enter a YouTube playlist URL');
      return;
    }

    if (!apiKey.trim()) {
      setError('Please enter your YouTube Data API key');
      return;
    }

    if (!openaiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    setError(null);
    setProcessing(true);
    setExtractedFarms([]);

    try {
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) {
        throw new Error('Invalid playlist URL. Please provide a valid YouTube playlist link.');
      }

      setProgress({ current: 0, total: 0, status: 'Fetching playlist videos...' });
      const fetchedVideos = await fetchPlaylistVideos(playlistId);
      setVideos(fetchedVideos);

      if (fetchedVideos.length === 0) {
        throw new Error('No videos found in this playlist');
      }

      setProgress({ current: 0, total: fetchedVideos.length, status: 'Analyzing videos with AI...' });
      const farms: ExtractedFarmData[] = [];

      for (let i = 0; i < fetchedVideos.length; i++) {
        const video = fetchedVideos[i];
        setProgress({ 
          current: i + 1, 
          total: fetchedVideos.length, 
          status: `Analyzing: ${video.title.substring(0, 50)}...` 
        });

        const farmData = await analyzeVideoWithAI(video);
        farms.push(farmData);

        // Small delay to avoid rate limiting
        if (i < fetchedVideos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setExtractedFarms(farms);
    } catch (error: any) {
      setError(error.message || 'Failed to process playlist');
      console.error('Error processing playlist:', error);
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditingFarm({ ...extractedFarms[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingFarm) return;

    const updated = [...extractedFarms];
    updated[editingIndex] = editingFarm;
    setExtractedFarms(updated);
    setEditingIndex(null);
    setEditingFarm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingFarm(null);
  };

  const handleUpdateField = (field: keyof ExtractedFarmData, value: any) => {
    if (!editingFarm) return;
    setEditingFarm({ ...editingFarm, [field]: value });
  };

  const generateCSV = () => {
    const csvData = extractedFarms.map(farm => ({
      title: farm.title,
      description: farm.description,
      category: farm.category,
      platform: Array.isArray(farm.platform) ? farm.platform.join('; ') : farm.platform,
      versions: Array.isArray(farm.versions) ? farm.versions.join('; ') : farm.versions,
      video_url: farm.video_url,
      materials: farm.materials || '',
      optional_materials: farm.optional_materials || '',
      tags: Array.isArray(farm.tags) ? farm.tags.join('; ') : '',
      farmable_items: Array.isArray(farm.farmable_items) ? farm.farmable_items.join('; ') : '',
      estimated_time: farm.estimated_time || '',
      required_biome: farm.required_biome || '',
      farm_designer: farm.farm_designer || '',
      drop_rate_per_hour: farm.drop_rate_per_hour || '',
      notes: farm.notes || '',
    }));

    const csv = Papa.unparse(csvData, {
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube_farms_import_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-minecraft p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Youtube className="text-red-600" size={28} />
          <span>YouTube Playlist Importer</span>
        </h2>
        <p className="text-gray-600 mb-6">
          Import farms from a YouTube playlist. The AI will analyze each video and extract farm data automatically.
        </p>

        {/* API Keys Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">
              YouTube Data API Key <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-minecraft-green"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default key is pre-filled. You can override it if needed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              OpenAI API Key <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-minecraft-green"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get it from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-minecraft-green hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </div>

        {/* Playlist URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            YouTube Playlist URL <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-minecraft-green"
              disabled={processing}
            />
            <button
              onClick={handleProcessPlaylist}
              disabled={processing || !playlistUrl.trim() || !apiKey.trim() || !openaiKey.trim()}
              className="px-6 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
            >
              {processing ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Process Playlist</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {processing && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-900">{progress.status}</span>
              <span className="text-blue-700">
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {extractedFarms.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">
                Extracted Farms ({extractedFarms.length})
              </h3>
              <button
                onClick={generateCSV}
                className="flex items-center space-x-2 px-6 py-3 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark font-semibold"
              >
                <Download size={20} />
                <span>Download CSV</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {extractedFarms.map((farm, index) => {
                const isEditing = editingIndex === index;

                if (isEditing && editingFarm) {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-lg">Editing: {farm.title}</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save size={18} />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                          >
                            <X size={18} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-1">Title</label>
                          <input
                            type="text"
                            value={editingFarm.title}
                            onChange={(e) => handleUpdateField('title', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Category</label>
                          <select
                            value={editingFarm.category}
                            onChange={(e) => handleUpdateField('category', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          >
                            {FARM_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-1">Description</label>
                          <textarea
                            value={editingFarm.description}
                            onChange={(e) => handleUpdateField('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Platform (semicolon separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingFarm.platform) ? editingFarm.platform.join('; ') : editingFarm.platform}
                            onChange={(e) => handleUpdateField('platform', e.target.value.split('; ').map(p => p.trim()))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                            placeholder="Java; Bedrock"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Versions (semicolon separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(editingFarm.versions) ? editingFarm.versions.join('; ') : editingFarm.versions}
                            onChange={(e) => handleUpdateField('versions', e.target.value.split('; ').map(v => v.trim()))}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                            placeholder="1.21; 1.20.6"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-1">Materials</label>
                          <textarea
                            value={editingFarm.materials || ''}
                            onChange={(e) => handleUpdateField('materials', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                            placeholder="64 Cobbled Deepslate; 32 Glass"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-2 rounded-lg p-4 ${
                      farm.needsReview
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-bold text-lg">{farm.title}</h4>
                          {farm.needsReview ? (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-semibold">
                              Needs Review
                            </span>
                          ) : (
                            <CheckCircle className="text-green-600" size={20} />
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2 line-clamp-2">{farm.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span><strong>Category:</strong> {farm.category}</span>
                          <span><strong>Platform:</strong> {Array.isArray(farm.platform) ? farm.platform.join(', ') : farm.platform}</span>
                          <span><strong>Versions:</strong> {Array.isArray(farm.versions) ? farm.versions.join(', ') : farm.versions}</span>
                        </div>
                        {farm.materials && (
                          <p className="text-xs text-gray-600 mt-2">
                            <strong>Materials:</strong> {farm.materials.substring(0, 100)}
                            {farm.materials.length > 100 ? '...' : ''}
                          </p>
                        )}
                        {farm.errors && farm.errors.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            {farm.errors.map((err, i) => (
                              <div key={i}>⚠ {err}</div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleEdit(index)}
                        className="ml-4 p-2 text-minecraft-green hover:bg-minecraft-green/10 rounded-lg transition-colors"
                        title="Edit farm"
                      >
                        <Edit2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

