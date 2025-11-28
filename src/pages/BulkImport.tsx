import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { FARM_CATEGORIES } from '../lib/farmCategories';
import { MINECRAFT_ITEMS } from '../lib/minecraftItems';

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

export default function BulkImport({ user }: UploadProps) {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<FarmImportData[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

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
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const farms: FarmImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const farm: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Parse arrays (platform, versions, tags, etc.)
        if (['platform', 'versions', 'tags', 'farmable_items'].includes(header)) {
          farm[header] = value ? value.split(';').map((v: string) => v.trim()) : [];
        }
        // Parse JSON fields (materials, optional_materials, drop_rate_per_hour)
        else if (['materials', 'optional_materials', 'drop_rate_per_hour'].includes(header)) {
          try {
            farm[header] = value ? JSON.parse(value) : [];
          } catch {
            farm[header] = [];
          }
        }
        // Parse numbers
        else if (header === 'estimated_time') {
          farm[header] = value ? parseInt(value) : null;
        }
        // Regular strings
        else {
          farm[header] = value || null;
        }
      });

      farms.push(farm);
    }

    return farms;
  };

  const parseJSON = (text: string): FarmImportData[] => {
    try {
      return JSON.parse(text);
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
      errors.push(`Invalid category: ${farm.category}. Must be one of: ${FARM_CATEGORIES.slice(0, 5).join(', ')}...`);
    }
    if (!farm.platform || (Array.isArray(farm.platform) && farm.platform.length === 0)) {
      errors.push('At least one platform is required (Java or Bedrock)');
    } else {
      const platforms = Array.isArray(farm.platform) ? farm.platform : [farm.platform];
      const invalidPlatforms = platforms.filter(p => !['Java', 'Bedrock'].includes(p));
      if (invalidPlatforms.length > 0) {
        errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}. Must be Java or Bedrock`);
      }
    }
    if (!farm.versions || (Array.isArray(farm.versions) && farm.versions.length === 0)) {
      errors.push('At least one version is required');
    }

    // Validate materials
    if (farm.materials) {
      const materials = typeof farm.materials === 'string' 
        ? JSON.parse(farm.materials) 
        : farm.materials;
      
      if (Array.isArray(materials)) {
        materials.forEach((mat: any, i: number) => {
          if (!mat.name) {
            errors.push(`Material ${i + 1}: name is required`);
          } else if (!MINECRAFT_ITEMS.includes(mat.name)) {
            warnings.push(`Material ${i + 1}: "${mat.name}" may not be a valid Minecraft item`);
          }
          if (!mat.count || mat.count < 1) {
            errors.push(`Material ${i + 1}: count must be at least 1`);
          }
        });
      }
    }

    // Validate farmable_items
    if (farm.farmable_items) {
      const items = Array.isArray(farm.farmable_items) 
        ? farm.farmable_items 
        : [farm.farmable_items];
      
      items.forEach((item: string) => {
        if (!MINECRAFT_ITEMS.includes(item)) {
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
          row: i + 2, // +2 because row 1 is header
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
        const materials = farm.materials
          ? (Array.isArray(farm.materials) ? farm.materials : JSON.parse(farm.materials as string))
          : [];
        const optionalMaterials = farm.optional_materials
          ? (Array.isArray(farm.optional_materials) ? farm.optional_materials : JSON.parse(farm.optional_materials as string))
          : [];
        const dropRates = farm.drop_rate_per_hour
          ? (Array.isArray(farm.drop_rate_per_hour) ? farm.drop_rate_per_hour : JSON.parse(farm.drop_rate_per_hour as string))
          : [];

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
    const template = {
      title: 'Example Farm',
      description: 'A sample farm description',
      category: 'Iron Farm',
      platform: 'Java',
      versions: '1.21',
      video_url: 'https://youtube.com/watch?v=...',
      materials: JSON.stringify([{ name: 'Villager', count: 3 }]),
      optional_materials: JSON.stringify([]),
      tags: 'iron-farm,mob-farm',
      farmable_items: 'Iron Ingot',
      estimated_time: 120,
      required_biome: 'Plains',
      farm_designer: 'Designer Name',
    };

    const csv = Object.keys(template).join(',') + '\n' + Object.values(template).join(',');
    const blob = new Blob([csv], { type: 'text/csv' });
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-display text-gray-900 mb-8">Bulk Import Farms</h1>

        {!previewMode ? (
          <div className="bg-white rounded-xl shadow-minecraft p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Upload File</h2>
                <p className="text-gray-600 mb-4">
                  Upload a CSV or JSON file containing farm data. Download the template below to see the required format.
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
                <h3 className="font-semibold text-blue-900 mb-2">Required Fields:</h3>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>title - Farm title</li>
                  <li>description - Farm description</li>
                  <li>category - Must match a category from the list</li>
                  <li>platform - Java or Bedrock (comma-separated for multiple)</li>
                  <li>versions - Minecraft versions (comma-separated)</li>
                </ul>
                <h3 className="font-semibold text-blue-900 mt-4 mb-2">Optional Fields:</h3>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>video_url, materials, optional_materials, tags, farmable_items, etc.</li>
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
                      <div className="ml-4">
                        {validation.valid ? (
                          <CheckCircle className="text-green-600" size={24} />
                        ) : (
                          <XCircle className="text-red-600" size={24} />
                        )}
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
                            : (typeof farm.materials === 'string' ? JSON.parse(farm.materials).length : 0)} items
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

