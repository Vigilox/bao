'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Effect {
  id: string;
  objectId: string;
  effectType: string;
  properties: any;
  isEnabled: boolean;
  order: number;
}

interface EffectsPanelProps {
  artboardId: string;
  selectedObjectId: string | null;
  onEffectApplied: () => void;
}

export function EffectsPanel({ artboardId, selectedObjectId, onEffectApplied }: EffectsPanelProps) {
  const [effects, setEffects] = useState<Effect[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEffectType, setSelectedEffectType] = useState<string>('shadow');

  // Effect presets
  const effectPresets = {
    shadow: {
      blur: 10,
      offsetX: 5,
      offsetY: 5,
      color: '#000000',
      opacity: 0.5,
    },
    blur: {
      amount: 5,
    },
    glow: {
      blur: 15,
      color: '#ffffff',
      opacity: 0.8,
    },
    outline: {
      width: 2,
      color: '#000000',
    },
    brightness: {
      value: 1.2,
    },
    contrast: {
      value: 1.2,
    },
    saturation: {
      value: 1.5,
    },
  };

  useEffect(() => {
    if (selectedObjectId) {
      fetchEffects();
    }
  }, [selectedObjectId]);

  const fetchEffects = async () => {
    try {
      const res = await fetch(`/api/design/effects?artboardId=${artboardId}`);
      const data = await res.json();
      const objectEffects = data.effects.filter((e: Effect) => e.objectId === selectedObjectId);
      setEffects(objectEffects);
    } catch (error) {
      console.error('Error fetching effects:', error);
    }
  };

  const addEffect = async () => {
    if (!selectedObjectId) {
      toast.error('Please select an object first');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/design/effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artboardId,
          objectId: selectedObjectId,
          effectType: selectedEffectType,
          properties: effectPresets[selectedEffectType as keyof typeof effectPresets],
        }),
      });

      if (!res.ok) throw new Error('Failed to add effect');

      toast.success(`${selectedEffectType} effect added!`);
      await fetchEffects();
      onEffectApplied();
    } catch (error) {
      console.error('Error adding effect:', error);
      toast.error('Failed to add effect');
    } finally {
      setLoading(false);
    }
  };

  const toggleEffect = async (effectId: string, isEnabled: boolean) => {
    try {
      const res = await fetch('/api/design/effects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effectId, isEnabled: !isEnabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle effect');

      await fetchEffects();
      onEffectApplied();
    } catch (error) {
      console.error('Error toggling effect:', error);
      toast.error('Failed to toggle effect');
    }
  };

  const deleteEffect = async (effectId: string) => {
    try {
      const res = await fetch(`/api/design/effects?effectId=${effectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete effect');

      toast.success('Effect removed');
      await fetchEffects();
      onEffectApplied();
    } catch (error) {
      console.error('Error deleting effect:', error);
      toast.error('Failed to delete effect');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Effects</h3>
      </div>

      {!selectedObjectId && (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          Select an object to apply effects
        </div>
      )}

      {selectedObjectId && (
        <>
          {/* Add Effect Section */}
          <Card className="p-4 space-y-3">
            <Label>Add New Effect</Label>
            <div className="flex gap-2">
              <Select value={selectedEffectType} onValueChange={setSelectedEffectType}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shadow">Shadow</SelectItem>
                  <SelectItem value="blur">Blur</SelectItem>
                  <SelectItem value="glow">Glow</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="brightness">Brightness</SelectItem>
                  <SelectItem value="contrast">Contrast</SelectItem>
                  <SelectItem value="saturation">Saturation</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addEffect} disabled={loading} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Active Effects List */}
          <div className="space-y-2">
            <Label>Active Effects ({effects.length})</Label>
            {effects.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
                No effects applied
              </div>
            )}
            {effects.map((effect) => (
              <Card key={effect.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {effect.effectType}
                    </Badge>
                    <Switch
                      checked={effect.isEnabled}
                      onCheckedChange={() => toggleEffect(effect.id, effect.isEnabled)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEffect(effect.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}