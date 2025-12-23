'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Film, Loader2, Trash2 } from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description?: string;
  order: number;
  _count?: {
    shots: number;
  };
}

interface SceneListProps {
  projectId: string;
  scenes: Scene[];
}

export function SceneList({ projectId, scenes: initialScenes }: SceneListProps) {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [creating, setCreating] = useState(false);

  const createScene = async () => {
    const name = prompt('Enter scene name:');
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name,
          description: '',
        }),
      });

      if (res?.ok) {
        const data = await res.json();
        setScenes([...scenes, data?.scene]);
      }
    } catch (error) {
      console.error('Error creating scene:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteScene = async (sceneId: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) return;

    try {
      const res = await fetch(`/api/scenes/${sceneId}`, {
        method: 'DELETE',
      });

      if (res?.ok) {
        setScenes(scenes.filter((s) => s?.id !== sceneId));
      }
    } catch (error) {
      console.error('Error deleting scene:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Scenes</h2>
          <p className="text-slate-400">Organize your project into scenes and shots</p>
        </div>
        <button
          onClick={createScene}
          disabled={creating}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg transition duration-200 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          New Scene
        </button>
      </div>

      {scenes?.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-700">
          <Film className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No scenes yet</h3>
          <p className="text-slate-500 mb-6">Create your first scene to start building your story</p>
          <button
            onClick={createScene}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition"
          >
            <Plus className="h-5 w-5" />
            Create Scene
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes?.map((scene, index) => (
            <motion.div
              key={scene?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Film className="h-6 w-6 text-purple-400" />
                </div>
                <button
                  onClick={() => deleteScene(scene?.id)}
                  className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-500/20 rounded-lg"
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                {scene?.name}
              </h3>

              {scene?.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {scene?.description}
                </p>
              )}

              <div className="text-xs text-slate-500">
                {scene?._count?.shots || 0} shots
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
