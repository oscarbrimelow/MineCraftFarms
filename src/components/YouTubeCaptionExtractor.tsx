import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Play, Loader } from 'lucide-react';

interface YouTubeCaptionExtractorProps {
  videoUrl: string;
  onStepsGenerated: (steps: Array<{ title: string; description: string; order: number }>) => void;
  onClose: () => void;
}

export default function YouTubeCaptionExtractor({
  videoUrl,
  onStepsGenerated,
  onClose,
}: YouTubeCaptionExtractorProps) {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<Array<{ title: string; description: string; order: number }>>([]);
  const [manualCaptions, setManualCaptions] = useState('');
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const parseCaptionsToSteps = (captionText: string): Array<{ title: string; description: string; order: number }> => {
    // Simple parser that looks for numbered steps or timestamps
    const lines = captionText.split('\n').filter((line) => line.trim());
    const steps: Array<{ title: string; description: string; order: number }> = [];
    let currentStep: { title: string; description: string; order: number } | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();
      
      // Detect step markers: "Step 1", "1.", "Step one", etc.
      const stepMatch = trimmed.match(/^(?:step\s*)?(\d+)\.?\s*(.+)$/i);
      if (stepMatch) {
        if (currentStep) {
          steps.push(currentStep);
        }
        currentStep = {
          title: stepMatch[2] || 'Step',
          description: '',
          order: parseInt(stepMatch[1]) - 1,
        };
      } else if (currentStep) {
        // Continuation of current step
        currentStep.description += (currentStep.description ? '\n' : '') + trimmed;
      }
    });

    if (currentStep) {
      steps.push(currentStep);
    }

    // If no structured steps found, split by paragraphs
    if (steps.length === 0 && lines.length > 0) {
      const paragraphs = captionText.split(/\n\s*\n/).filter((p) => p.trim());
      steps.push(...paragraphs.map((para, index) => ({
        title: `Step ${index + 1}`,
        description: para.trim(),
        order: index,
      })));
    }

    return steps.map((step, index) => ({ ...step, order: index }));
  };

  const fetchCaptions = async () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError('Invalid YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch captions via a serverless function or API
      // For now, we'll provide a fallback manual input
      // In production, you'd call your serverless endpoint here
      
      // Example serverless call (you'll need to implement the endpoint):
      // const response = await fetch(`/api/youtube-captions?videoId=${videoId}`);
      // const data = await response.json();
      
      // For now, show manual input option
      alert(
        'Auto-caption extraction requires a serverless function. Please paste captions manually or upload an SRT file.'
      );
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch captions');
      setLoading(false);
    }
  };

  const handleProcessManual = () => {
    if (!manualCaptions.trim()) {
      setError('Please paste captions or upload an SRT file');
      return;
    }

    const parsedSteps = parseCaptionsToSteps(manualCaptions);
    if (parsedSteps.length === 0) {
      setError('Could not parse steps from captions. Please format them with step numbers (e.g., "Step 1: ...")');
      return;
    }

    setSteps(parsedSteps);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedSteps = parseSRT(content);
      setSteps(parsedSteps);
    };
    reader.readAsText(file);
  };

  const parseSRT = (srtContent: string): Array<{ title: string; description: string; order: number }> => {
    const blocks = srtContent.split(/\n\s*\n/).filter((block) => block.trim());
    return blocks.map((block, index) => {
      const lines = block.split('\n').filter((line) => line.trim());
      // Remove sequence number and timestamp (first 2 lines)
      const textLines = lines.slice(2);
      return {
        title: `Step ${index + 1}`,
        description: textLines.join('\n'),
        order: index,
      };
    });
  };

  const handleSave = () => {
    if (steps.length > 0) {
      onStepsGenerated(steps);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-minecraft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Extract Steps from Video</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Auto-fetch button */}
          <div>
            <button
              onClick={fetchCaptions}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Fetching captions...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Auto-extract from YouTube</span>
                </>
              )}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Note: Requires serverless function. Use manual input as fallback.
            </p>
          </div>

          {/* Manual input */}
          <div>
            <label className="block font-semibold mb-2">
              Or paste captions manually / Upload SRT file
            </label>
            <textarea
              value={manualCaptions}
              onChange={(e) => setManualCaptions(e.target.value)}
              placeholder="Paste captions here, or format as:&#10;Step 1: Do this...&#10;Step 2: Then do that..."
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
              rows={8}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleProcessManual}
                className="px-4 py-2 bg-minecraft-indigo text-white rounded-lg hover:bg-minecraft-indigo-dark"
              >
                Process Captions
              </button>
              <label className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer">
                <input
                  type="file"
                  accept=".srt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="flex items-center space-x-2">
                  <Download size={18} />
                  <span>Upload SRT</span>
                </span>
              </label>
            </div>
          </div>

          {/* Generated steps preview */}
          {steps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Generated Steps ({steps.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
                  >
                    <div className="font-semibold text-minecraft-green mb-1">
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={steps.length === 0}
              className="px-6 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark disabled:opacity-50"
            >
              Save Steps
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

