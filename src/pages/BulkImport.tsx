import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Download, Edit2, Save, X, Plus } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { FARM_CATEGORIES } from '../lib/farmCategories';
import { MINECRAFT_ITEMS } from '../lib/minecraftItems';
import { parseMaterialsFromText } from '../lib/materialParser';
import CategoryAutocomplete from '../components/CategoryAutocomplete';
import MaterialAutocomplete from '../components/MaterialAutocomplete';

interface UploadProps {
  user: SupabaseUser | null;
}

interface FarmImportData {
  title: string;
  description: string;
  category: string;
  platform: string | string[];
  versions: string | string[];
  video_url?: string;
  materials?: string | Array<{ name: string; count: number }>;
  optional_materials?: string | Array<{ name: string; count: number }>;
  tags?: string | string[];
  farmable_items?: string | string[];
  estimated_time?: string | number;
  required_biome?: string;
  farm_designer?: string;
  chunk_requirements?: string;
  height_requirements?: string;
  notes?: string;
  drop_rate_per_hour?: string | Array<{ item: string; rate: string }>;
  schematic_url?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; title: string; errors: string[] }>;
}

const PLATFORMS = ['Java', 'Bedrock'];
const COMMON_VERSIONS = [
  '1.21', '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
];

export default function BulkImport({ user }: UploadProps) {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<FarmImportData[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingFarm, setEditingFarm] = useState<FarmImportData | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display text-gray-900 mb-4">Please sign in to import farms</h1>
          <button
            onClick={() => navigate('/account')}
            className="px-6 py-3 bg-minecraft-green text-white rounded-xl hover:bg-minecraft-green-dark"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const parseCSV = (text: string): FarmImportData[] => {
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (result.errors.length > 0) {
      console.warn('CSV parsing warnings:', result.errors);
    }

    return result.data.map((row: any) => {
      const farm: any = {};

      // Handle each field
      Object.keys(row).forEach((key) => {
        const value = row[key];
        if (!value) {
          farm[key] = null;
          return;
        }

        // Parse arrays (platform, versions, tags, farmable_items)
        if (['platform', 'versions', 'tags', 'farmable_items'].includes(key)) {
          if (Array.isArray(value)) {
            farm[key] = value;
          } else {
            // Split by semicolon, comma, or pipe
            farm[key] = value.split(/[;,|]/).map((v: string) => v.trim()).filter((v: string) => v);
          }
        }
        // Parse materials - support both JSON and simple text format
        else if (key === 'materials' || key === 'optional_materials') {
          // Try JSON first
          if (value.startsWith('[') || value.startsWith('{')) {
            try {
              farm[key] = JSON.parse(value);
            } catch {
              // If JSON fails, try simple text format
              const parsed = parseMaterialsFromText(value);
              farm[key] = parsed.added;
            }
          } else {
            // Simple text format
            const parsed = parseMaterialsFromText(value);
            farm[key] = parsed.added;
          }
        }
        // Parse drop_rate_per_hour
        else if (key === 'drop_rate_per_hour') {
          if (value.startsWith('[')) {
            try {
              farm[key] = JSON.parse(value);
            } catch {
              farm[key] = [];
            }
          } else {
            // Simple format: "Iron Ingot: 3600/hour" or "Iron Ingot, 3600"
            const items = value.split(/[;,]/).map((v: string) => v.trim()).filter((v: string) => v);
            farm[key] = items.map((item: string) => {
              const match = item.match(/^(.+?)[:\s]+(.+)$/);
              if (match) {
                return { item: match[1].trim(), rate: match[2].trim() };
              }
              return { item: item, rate: '' };
            });
          }
        }
        // Parse numbers
        else if (key === 'estimated_time') {
          farm[key] = value ? parseInt(value) : null;
        }
        // Regular strings
        else {
          farm[key] = value;
        }
      });

      return farm;
    });
  };

  const parseJSON = (text: string): FarmImportData[] => {
    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  };

  const validateFarm = (farm: FarmImportData): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!farm.title?.trim()) {
      errors.push('Title is required');
    }
    if (!farm.description?.trim()) {
      errors.push('Description is required');
    }
    if (!farm.category?.trim()) {
      errors.push('Category is required');
    } else if (!FARM_CATEGORIES.includes(farm.category)) {
      errors.push(`Invalid category: ${farm.category}. Must be one of the available categories.`);
    }
    
    // Platform validation
    const platforms = Array.isArray(farm.platform) ? farm.platform : (farm.platform ? [farm.platform] : []);
    if (platforms.length === 0) {
      errors.push('At least one platform is required (Java or Bedrock)');
    } else {
      const invalidPlatforms = platforms.filter(p => !PLATFORMS.includes(p));
      if (invalidPlatforms.length > 0) {
        errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}. Must be Java or Bedrock`);
      }
    }
    
    // Versions validation
    const versions = Array.isArray(farm.versions) ? farm.versions : (farm.versions ? [farm.versions] : []);
    if (versions.length === 0) {
      errors.push('At least one version is required');
    }

    // Validate materials
    if (farm.materials) {
      const materials = Array.isArray(farm.materials) ? farm.materials : [];
      materials.forEach((mat: any, i: number) => {
        if (!mat || !mat.name) {
          errors.push(`Material ${i + 1}: name is required`);
        } else if (!MINECRAFT_ITEMS.includes(mat.name)) {
          warnings.push(`Material ${i + 1}: "${mat.name}" may not be a valid Minecraft item`);
        }
        if (!mat.count || mat.count < 1) {
          errors.push(`Material ${i + 1}: count must be at least 1`);
        }
      });
    }

    // Validate farmable_items
    if (farm.farmable_items) {
      const items = Array.isArray(farm.farmable_items) ? farm.farmable_items : [farm.farmable_items];
      items.forEach((item: string) => {
        if (item && !MINECRAFT_ITEMS.includes(item)) {
          warnings.push(`Farmable item "${item}" may not be a valid Minecraft item`);
        }
      });
    }

    // Validate video URL format
    if (farm.video_url && !farm.video_url.match(/youtube\.com|youtu\.be/)) {
      warnings.push('Video URL does not appear to be a YouTube URL');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setImportResult(null);
    setEditingIndex(null);
    setEditingFarm(null);

    try {
      const text = await uploadedFile.text();
      const parsedFarms = uploadedFile.name.endsWith('.csv') 
        ? parseCSV(text) 
        : parseJSON(text);

      setFarms(parsedFarms);

      // Validate all farms
      const validations = parsedFarms.map((farm) => validateFarm(farm));
      setValidationResults(validations);
      setPreviewMode(true);
    } catch (error: any) {
      alert(`Error parsing file: ${error.message}`);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditingFarm({ ...farms[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingFarm) return;

    const updatedFarms = [...farms];
    updatedFarms[editingIndex] = editingFarm;
    setFarms(updatedFarms);

    // Re-validate
    const validation = validateFarm(editingFarm);
    const updatedValidations = [...validationResults];
    updatedValidations[editingIndex] = validation;
    setValidationResults(updatedValidations);

    setEditingIndex(null);
    setEditingFarm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingFarm(null);
  };

  const handleUpdateFarmField = (field: keyof FarmImportData, value: any) => {
    if (!editingFarm) return;
    setEditingFarm({ ...editingFarm, [field]: value });
  };

  const handleAddMaterial = (material: { name: string; count: number }, optional = false) => {
    if (!editingFarm) return;
    const key = optional ? 'optional_materials' : 'materials';
    const current = Array.isArray(editingFarm[key]) ? editingFarm[key] as Array<{ name: string; count: number }> : [];
    setEditingFarm({
      ...editingFarm,
      [key]: [...current, material],
    });
  };

  const handleRemoveMaterial = (index: number, optional = false) => {
    if (!editingFarm) return;
    const key = optional ? 'optional_materials' : 'materials';
    const current = Array.isArray(editingFarm[key]) ? editingFarm[key] as Array<{ name: string; count: number }> : [];
    setEditingFarm({
      ...editingFarm,
      [key]: current.filter((_, i) => i !== index),
    });
  };

  const handlePasteMaterials = (text: string, optional = false) => {
    if (!editingFarm) return;
    const parsed = parseMaterialsFromText(text);
    const key = optional ? 'optional_materials' : 'materials';
    const current = Array.isArray(editingFarm[key]) ? editingFarm[key] as Array<{ name: string; count: number }> : [];
    
    // Merge with existing materials
    const merged = [...current];
    parsed.added.forEach(({ name, count }) => {
      const existingIndex = merged.findIndex(m => m.name === name);
      if (existingIndex >= 0) {
        merged[existingIndex].count += count;
      } else {
        merged.push({ name, count });
      }
    });

    setEditingFarm({
      ...editingFarm,
      [key]: merged,
    });

    if (parsed.failed.length > 0) {
      alert(`Could not match ${parsed.failed.length} item(s): ${parsed.failed.join(', ')}`);
    }
  };

  const handleImport = async () => {
    if (!user) return;

    setImporting(true);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < farms.length; i++) {
      const farm = farms[i];
      const validation = validationResults[i];

      if (!validation.valid) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          title: farm.title || 'Untitled',
          errors: validation.errors,
        });
        continue;
      }

      try {
        // Normalize data
        const platforms = Array.isArray(farm.platform) ? farm.platform : [farm.platform];
        const versions = Array.isArray(farm.versions) ? farm.versions : [farm.versions];
        const tags = farm.tags 
          ? (Array.isArray(farm.tags) ? farm.tags : [farm.tags])
          : [];
        const farmableItems = farm.farmable_items
          ? (Array.isArray(farm.farmable_items) ? farm.farmable_items : [farm.farmable_items])
          : [];
        const materials = Array.isArray(farm.materials) ? farm.materials : [];
        const optionalMaterials = Array.isArray(farm.optional_materials) ? farm.optional_materials : [];
        const dropRates = Array.isArray(farm.drop_rate_per_hour) ? farm.drop_rate_per_hour : [];

        const slug = farm.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Check for duplicate slug
        const { data: existing } = await supabase
          .from('farms')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            title: farm.title,
            errors: ['A farm with this title already exists'],
          });
          continue;
        }

        const farmData = {
          title: farm.title,
          description: farm.description,
          category: farm.category,
          platform: platforms,
          versions: versions,
          video_url: farm.video_url || null,
          materials: materials,
          optional_materials: optionalMaterials,
          tags: tags,
          farmable_items: farmableItems,
          estimated_time: farm.estimated_time ? parseInt(String(farm.estimated_time)) : null,
          required_biome: farm.required_biome || null,
          farm_designer: farm.farm_designer || null,
          chunk_requirements: farm.chunk_requirements || null,
          height_requirements: farm.height_requirements || null,
          notes: farm.notes || null,
          drop_rate_per_hour: dropRates.length > 0 ? dropRates : null,
          schematic_url: farm.schematic_url || null,
          author_id: user.id,
          public: true,
          upvotes_count: 0,
          slug,
        };

        const { error } = await supabase.from('farms').insert([farmData]);

        if (error) {
          result.failed++;
          result.errors.push({
            row: i + 2,
            title: farm.title,
            errors: [error.message],
          });
        } else {
          result.success++;
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: i + 2,
          title: farm.title || 'Untitled',
          errors: [error.message || 'Unknown error'],
        });
      }
    }

    setImportResult(result);
    setImporting(false);
  };

  const downloadTemplate = () => {
    // Create a better template with examples
    const examples = [
      {
        title: 'Iron Golem Farm',
        description: 'Efficient iron golem farm for Java edition',
        category: 'Iron Farm',
        platform: 'Java',
        versions: '1.21; 1.20.6',
        video_url: 'https://youtube.com/watch?v=example1',
        materials: '93 Cobbled Deepslate; 59 Scaffolding; 2 Obsidian; 3 Villager',
        optional_materials: '1 Name Tag',
        tags: 'iron-farm; mob-farm; efficient',
        farmable_items: 'Iron Ingot',
        estimated_time: '120',
        required_biome: 'Plains',
        farm_designer: 'DesignerName',
        drop_rate_per_hour: 'Iron Ingot: 3600/hour',
        chunk_requirements: '',
        height_requirements: '',
        notes: 'Requires 3 villagers',
      },
      {
        title: 'Gold Farm',
        description: 'Nether gold farm using piglins',
        category: 'Gold Farm',
        platform: 'Java; Bedrock',
        versions: '1.21',
        video_url: 'https://youtube.com/watch?v=example2',
        materials: '64 Obsidian; 32 Glass; 16 Hopper',
        optional_materials: '',
        tags: 'gold-farm; nether',
        farmable_items: 'Gold Ingot; Gold Nugget',
        estimated_time: '90',
        required_biome: 'Nether Wastes',
        farm_designer: 'AnotherDesigner',
        drop_rate_per_hour: 'Gold Ingot: 1800/hour; Gold Nugget: 5400/hour',
        chunk_requirements: '',
        height_requirements: '',
        notes: '',
      },
    ];

    const csv = Papa.unparse(examples, {
      header: true,
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farm_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = validationResults.filter(v => v.valid).length;
  const errorCount = validationResults.filter(v => !v.valid).length;
  const warningCount = validationResults.reduce((sum, v) => sum + v.warnings.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-minecraft-sky-light/50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display text-gray-900 mb-8">Bulk Import Farms</h1>

        {!previewMode ? (
          <div className="bg-white rounded-xl shadow-minecraft p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Upload File</h2>
                <p className="text-gray-600 mb-4">
                  Upload a CSV or JSON file containing farm data. Materials can be in simple text format!
                </p>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Download size={18} />
                    <span>Download CSV Template</span>
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                />
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📝 Simple Material Format</h3>
                <p className="text-sm text-blue-800 mb-2">
                  You can use simple text for materials instead of JSON! Examples:
                </p>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li><code>"93 Cobbled Deepslate; 59 Scaffolding; 2 Obsidian"</code></li>
                  <li><code>"Cobbled Deepslate x93; Scaffolding x59"</code></li>
                  <li><code>"93x Cobbled Deepslate, 59x Scaffolding"</code></li>
                </ul>
                <p className="text-sm text-blue-800 mt-2">
                  The system will automatically match items and add icons!
                </p>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Required Fields:</h3>
                <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                  <li><strong>title</strong> - Farm title</li>
                  <li><strong>description</strong> - Farm description</li>
                  <li><strong>category</strong> - Must match a category from the list</li>
                  <li><strong>platform</strong> - Java or Bedrock (use semicolon for multiple: "Java; Bedrock")</li>
                  <li><strong>versions</strong> - Minecraft versions (use semicolon for multiple: "1.21; 1.20.6")</li>
                </ul>
                <h3 className="font-semibold text-green-900 mt-4 mb-2">Optional Fields:</h3>
                <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                  <li>video_url, materials, optional_materials, tags, farmable_items, estimated_time, required_biome, farm_designer, etc.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-minecraft p-6">
              <h2 className="text-2xl font-bold mb-4">Import Preview</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-700">{validCount}</div>
                  <div className="text-sm text-green-600">Valid Farms</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                  <div className="text-2xl font-bold text-red-700">{errorCount}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleImport}
                  disabled={importing || validCount === 0}
                  className="px-6 py-3 bg-minecraft-green text-white rounded-lg font-semibold hover:bg-minecraft-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : `Import ${validCount} Farm${validCount !== 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => {
                    setPreviewMode(false);
                    setFarms([]);
                    setValidationResults([]);
                    setEditingIndex(null);
                    setEditingFarm(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Farm List */}
            <div className="space-y-4">
              {farms.map((farm, index) => {
                const validation = validationResults[index];
                const isEditing = editingIndex === index;

                if (isEditing && editingFarm) {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-minecraft p-6 border-2 border-minecraft-green"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Editing: {farm.title || `Farm ${index + 1}`}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark"
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
                          <label className="block text-sm font-semibold mb-1">Title *</label>
                          <input
                            type="text"
                            value={editingFarm.title || ''}
                            onChange={(e) => handleUpdateFarmField('title', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Category *</label>
                          <CategoryAutocomplete
                            value={editingFarm.category || ''}
                            onChange={(value) => handleUpdateFarmField('category', value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-1">Description *</label>
                          <textarea
                            value={editingFarm.description || ''}
                            onChange={(e) => handleUpdateFarmField('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Platform *</label>
                          <div className="flex gap-2">
                            {PLATFORMS.map(platform => (
                              <label key={platform} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(editingFarm.platform) 
                                    ? editingFarm.platform.includes(platform)
                                    : editingFarm.platform === platform}
                                  onChange={(e) => {
                                    const current = Array.isArray(editingFarm.platform) 
                                      ? editingFarm.platform 
                                      : editingFarm.platform ? [editingFarm.platform] : [];
                                    if (e.target.checked) {
                                      handleUpdateFarmField('platform', [...current, platform]);
                                    } else {
                                      handleUpdateFarmField('platform', current.filter(p => p !== platform));
                                    }
                                  }}
                                />
                                <span>{platform}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Versions *</label>
                          <select
                            multiple
                            value={Array.isArray(editingFarm.versions) ? editingFarm.versions : editingFarm.versions ? [editingFarm.versions] : []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleUpdateFarmField('versions', selected);
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                            size={5}
                          >
                            {COMMON_VERSIONS.map(version => (
                              <option key={version} value={version}>{version}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold mb-1">Materials (paste simple format)</label>
                          <textarea
                            placeholder="93 Cobbled Deepslate; 59 Scaffolding; 2 Obsidian"
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                handlePasteMaterials(e.target.value, false);
                                e.target.value = '';
                              }
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                            rows={2}
                          />
                          <div className="mt-2 space-y-1">
                            {Array.isArray(editingFarm.materials) && editingFarm.materials.map((mat, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span>{mat.name} x{mat.count}</span>
                                <button
                                  onClick={() => handleRemoveMaterial(i, false)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Video URL</label>
                          <input
                            type="url"
                            value={editingFarm.video_url || ''}
                            onChange={(e) => handleUpdateFarmField('video_url', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-1">Estimated Time (minutes)</label>
                          <input
                            type="number"
                            value={editingFarm.estimated_time || ''}
                            onChange={(e) => handleUpdateFarmField('estimated_time', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
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
                    className="bg-white rounded-xl shadow-minecraft p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {farm.title || `Farm ${index + 1}`}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{farm.description}</p>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        {validation.valid ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-red-600" size={24} />
                        )}
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-2 text-minecraft-green hover:bg-minecraft-green/10 rounded-lg"
                          title="Edit farm"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>

                    {validation.errors.length > 0 && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <XCircle className="text-red-600" size={18} />
                          <span className="font-semibold text-red-700">Errors:</span>
                        </div>
                        <ul className="text-sm text-red-600 list-disc list-inside space-y-1">
                          {validation.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validation.warnings.length > 0 && (
                      <div className="mb-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="text-yellow-600" size={18} />
                          <span className="font-semibold text-yellow-700">Warnings:</span>
                        </div>
                        <ul className="text-sm text-yellow-600 list-disc list-inside space-y-1">
                          {validation.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <div className="font-semibold">{farm.category || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Platform:</span>
                        <div className="font-semibold">
                          {Array.isArray(farm.platform) ? farm.platform.join(', ') : farm.platform || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Versions:</span>
                        <div className="font-semibold">
                          {Array.isArray(farm.versions) ? farm.versions.join(', ') : farm.versions || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Materials:</span>
                        <div className="font-semibold">
                          {Array.isArray(farm.materials) 
                            ? farm.materials.length 
                            : 0} items
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-minecraft p-6 mt-6"
          >
            <h2 className="text-2xl font-bold mb-4">Import Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-3xl font-bold text-green-700">{importResult.success}</div>
                <div className="text-sm text-green-600">Successfully Imported</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-3xl font-bold text-red-700">{importResult.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Errors:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                      <div className="font-semibold text-red-700">Row {error.row}: {error.title}</div>
                      <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                        {error.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setImportResult(null);
                setPreviewMode(false);
                setFarms([]);
                setValidationResults([]);
                setEditingIndex(null);
                setEditingFarm(null);
              }}
              className="mt-6 px-6 py-3 bg-minecraft-green text-white rounded-lg font-semibold hover:bg-minecraft-green-dark"
            >
              Import More Farms
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
