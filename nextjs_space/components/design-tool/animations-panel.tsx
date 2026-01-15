'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, Trash2, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Animation {
  id: string;
  objectId: string;
  name: string;
  animationType: string;
  duration: number;
  delay: number;
  easing: string;
  iterations: number;
  keyframes: any[];
  isEnabled: boolean;
}

interface AnimationsPanelProps {
  artboardId: string;
  selectedObjectId: string | null;
  onAnimationApplied: () => void;
}

export function AnimationsPanel({ artboardId, selectedObjectId, onAnimationApplied }: AnimationsPanelProps) {
  const [animations, setAnimations] = useState<Animation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Animation form state
  const [formData, setFormData] = useState({
    name: '',
    animationType: 'fade',
    duration: 1000,
    delay: 0,
    easing: 'ease-in-out',
    iterations: 1,
  });

  // Animation presets
  const animationPresets = {
    fade: [
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 },
    ],
    slideIn: [
      { offset: 0, translateX: -100, opacity: 0 },
      { offset: 1, translateX: 0, opacity: 1 },
    ],
    slideUp: [
      { offset: 0, translateY: 100, opacity: 0 },
      { offset: 1, translateY: 0, opacity: 1 },
    ],
    scale: [
      { offset: 0, scaleX: 0, scaleY: 0 },
      { offset: 1, scaleX: 1, scaleY: 1 },
    ],
    rotate: [
      { offset: 0, angle: 0 },
      { offset: 1, angle: 360 },
    ],
    bounce: [
      { offset: 0, translateY: 0 },
      { offset: 0.3, translateY: -30 },
      { offset: 0.5, translateY: 0 },
      { offset: 0.7, translateY: -15 },
      { offset: 1, translateY: 0 },
    ],
    pulse: [
      { offset: 0, scaleX: 1, scaleY: 1 },
      { offset: 0.5, scaleX: 1.1, scaleY: 1.1 },
      { offset: 1, scaleX: 1, scaleY: 1 },
    ],
  };

  useEffect(() => {
    if (selectedObjectId) {
      fetchAnimations();
    }
  }, [selectedObjectId]);

  const fetchAnimations = async () => {
    try {
      const res = await fetch(`/api/design/animations?artboardId=${artboardId}`);
      const data = await res.json();
      const objectAnimations = data.animations.filter((a: Animation) => a.objectId === selectedObjectId);
      setAnimations(objectAnimations);
    } catch (error) {
      console.error('Error fetching animations:', error);
    }
  };

  const addAnimation = async () => {
    if (!selectedObjectId) {
      toast.error('Please select an object first');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter an animation name');
      return;
    }

    setLoading(true);
    try {
      const keyframes = animationPresets[formData.animationType as keyof typeof animationPresets];
      
      const res = await fetch('/api/design/animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artboardId,
          objectId: selectedObjectId,
          ...formData,
          keyframes,
        }),
      });

      if (!res.ok) throw new Error('Failed to add animation');

      toast.success('Animation added!');
      setShowAddForm(false);
      setFormData({
        name: '',
        animationType: 'fade',
        duration: 1000,
        delay: 0,
        easing: 'ease-in-out',
        iterations: 1,
      });
      await fetchAnimations();
      onAnimationApplied();
    } catch (error) {
      console.error('Error adding animation:', error);
      toast.error('Failed to add animation');
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimation = async (animationId: string, isEnabled: boolean) => {
    try {
      const res = await fetch('/api/design/animations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animationId, isEnabled: !isEnabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle animation');

      await fetchAnimations();
      onAnimationApplied();
    } catch (error) {
      console.error('Error toggling animation:', error);
      toast.error('Failed to toggle animation');
    }
  };

  const deleteAnimation = async (animationId: string) => {
    try {
      const res = await fetch(`/api/design/animations?animationId=${animationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete animation');

      toast.success('Animation removed');
      await fetchAnimations();
      onAnimationApplied();
    } catch (error) {
      console.error('Error deleting animation:', error);
      toast.error('Failed to delete animation');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Animations</h3>
        </div>
        {selectedObjectId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {!selectedObjectId && (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          Select an object to add animations
        </div>
      )}

      {selectedObjectId && showAddForm && (
        <Card className="p-4 space-y-3">
          <Label>Create Animation</Label>
          
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              placeholder="e.g., Entrance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-xs">Animation Type</Label>
            <Select
              value={formData.animationType}
              onValueChange={(value) => setFormData({ ...formData, animationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fade">Fade In</SelectItem>
                <SelectItem value="slideIn">Slide In</SelectItem>
                <SelectItem value="slideUp">Slide Up</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="rotate">Rotate</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Duration (ms): {formData.duration}</Label>
            <Slider
              value={[formData.duration]}
              onValueChange={([value]) => setFormData({ ...formData, duration: value })}
              min={100}
              max={5000}
              step={100}
            />
          </div>

          <div>
            <Label className="text-xs">Iterations (0 = infinite)</Label>
            <Input
              type="number"
              min="0"
              value={formData.iterations}
              onChange={(e) => setFormData({ ...formData, iterations: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addAnimation} disabled={loading} className="flex-1">
              Add Animation
            </Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {selectedObjectId && (
        <div className="space-y-2">
          <Label>Active Animations ({animations.length})</Label>
          {animations.length === 0 && !showAddForm && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
              No animations added
            </div>
          )}
          {animations.map((animation) => (
            <Card key={animation.id} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {animation.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {animation.animationType}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Switch
                    checked={animation.isEnabled}
                    onCheckedChange={() => toggleAnimation(animation.id, animation.isEnabled)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAnimation(animation.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {animation.duration}ms • {animation.iterations === 0 ? '∞' : `${animation.iterations}x`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}