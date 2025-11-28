import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X, GripVertical, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Step {
  id?: string;
  title: string;
  description: string;
  duration?: number;
  order: number;
}

interface StepsEditorProps {
  steps: Step[];
  farmId: string;
  readOnly?: boolean;
}

export default function StepsEditor({ steps: initialSteps, farmId, readOnly = false }: StepsEditorProps) {
  const [steps, setSteps] = useState<Step[]>(initialSteps || []);
  const [editing, setEditing] = useState(!readOnly && (!initialSteps || initialSteps.length === 0));
  const [saving, setSaving] = useState(false);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        title: '',
        description: '',
        order: steps.length,
      },
    ]);
  };

  const handleUpdateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('farms')
        .update({
          steps: steps.filter((s) => s.title.trim() || s.description.trim()),
        })
        .eq('id', farmId);

      if (error) throw error;
      setEditing(false);
    } catch (error) {
      console.error('Error saving steps:', error);
      alert('Failed to save steps. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (readOnly && !editing && steps.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Play className="text-minecraft-green" size={20} />
          <span>Step-by-Step Guide</span>
        </h3>
        {!readOnly && (
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark transition-colors"
            disabled={saving}
          >
            {editing ? (
              <>
                <Save size={18} />
                <span>{saving ? 'Saving...' : 'Save Steps'}</span>
              </>
            ) : (
              <>
                <Edit3 size={18} />
                <span>Edit Steps</span>
              </>
            )}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
            >
              <div className="flex items-start space-x-3">
                <div className="flex items-center space-x-2">
                  <GripVertical className="text-gray-400" size={20} />
                  <span className="font-bold text-minecraft-green">Step {index + 1}</span>
                </div>
                <button
                  onClick={() => handleRemoveStep(index)}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={step.title}
                onChange={(e) => handleUpdateStep(index, 'title', e.target.value)}
                placeholder="Step title..."
                className="w-full mt-2 px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green font-semibold"
              />
              <textarea
                value={step.description}
                onChange={(e) => handleUpdateStep(index, 'description', e.target.value)}
                placeholder="Detailed instructions..."
                className="w-full mt-2 px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                rows={3}
              />
              <input
                type="number"
                value={step.duration || ''}
                onChange={(e) => handleUpdateStep(index, 'duration', parseInt(e.target.value) || 0)}
                placeholder="Estimated duration (minutes)"
                className="w-full mt-2 px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-minecraft-green"
              />
            </motion.div>
          ))}
          <button
            onClick={handleAddStep}
            className="w-full py-3 border-2 border-dashed border-minecraft-green text-minecraft-green rounded-lg hover:bg-minecraft-green/10 transition-colors font-semibold"
          >
            + Add Step
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-minecraft-green-light/20 to-white rounded-lg p-4 border-l-4 border-minecraft-green"
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-bold text-minecraft-green text-lg">Step {index + 1}</span>
                {step.duration && (
                  <span className="text-sm text-gray-600">({step.duration} min)</span>
                )}
              </div>
              {step.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              )}
              <p className="text-gray-700 whitespace-pre-wrap">{step.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

