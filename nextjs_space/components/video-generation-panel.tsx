'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Film,
  Wand2,
  Loader2,
  Upload,
  X,
  Info,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

interface VideoGenerationPanelProps {
  projectId: string;
  onVideoGenerated?: (taskId: string) => void;
}

type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

const ASPECT_RATIOS: { value: AspectRatio; label: string; description: string }[] = [
  { value: '16:9', label: '16:9', description: 'Landscape (YouTube, TV)' },
  { value: '9:16', label: '9:16', description: 'Portrait (TikTok, Instagram Reels)' },
  { value: '1:1', label: '1:1', description: 'Square (Instagram Feed)' },
  { value: '4:3', label: '4:3', description: 'Classic TV' },
  { value: '3:4', label: '3:4', description: 'Portrait' },
];

const EXAMPLE_PROMPTS = [
  "A serene mountain landscape at sunrise with clouds rolling over peaks",
  "Close-up of a vintage camera lens focusing on a cityscape",
  "Colorful paint splashing in slow motion against a white background",
  "Abstract geometric patterns morphing and transforming smoothly",
  "Ocean waves crashing on a tropical beach at golden hour",
];

export function VideoGenerationPanel({ projectId, onVideoGenerated }: VideoGenerationPanelProps) {
  const [mode, setMode] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (mode === 'image-to-video' && !uploadedImage) {
      toast.error('Please upload an image for image-to-video generation');
      return;
    }

    setIsGenerating(true);

    try {
      let imageUrl: string | undefined;

      // Upload image to S3 if image-to-video mode
      if (mode === 'image-to-video' && uploadedFile) {
        // Step 1: Get presigned URL
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadedFile.name,
            contentType: uploadedFile.type,
            isPublic: true, // Make publicly accessible for video generation
          }),
        });

        if (!presignedRes.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, cloud_storage_path } = await presignedRes.json();

        // Step 2: Upload file directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadedFile.type },
          body: uploadedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to S3');
        }

        // Step 3: Complete upload and save to database
        const completeRes = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            cloud_storage_path,
            isPublic: true,
            assetType: 'image',
            filename: uploadedFile.name,
          }),
        });

        if (!completeRes.ok) {
          throw new Error('Failed to save upload');
        }

        const completeData = await completeRes.json();
        imageUrl = completeData.url;
      }

      // Generate video
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          prompt,
          aspectRatio,
          duration,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      
      toast.success('Video generation started! This may take a few minutes.');
      
      // Reset form
      setPrompt('');
      setUploadedImage(null);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent component
      if (onVideoGenerated) {
        onVideoGenerated(data.task.id);
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      toast.error(error.message || 'Failed to generate video');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExamplePrompt = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Film className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Generate Video with Veo 3.1</CardTitle>
            <CardDescription>
              Create cinema-quality videos from text or images using state-of-the-art AI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Mode Tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text-to-video" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Text to Video
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className="gap-2">
              <Upload className="h-4 w-4" />
              Image to Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text-to-video" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Video Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the video you want to create... Be specific about motion, style, and mood."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Tip: Include details about camera movement, lighting, and scene dynamics for best results
              </p>
            </div>

            {/* Example Prompts */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Examples:</Label>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 px-2 whitespace-normal text-left"
                    onClick={() => handleExamplePrompt(example)}
                  >
                    <Sparkles className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="line-clamp-2">{example}</span>
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image-to-video" className="space-y-4 mt-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Starting Image</Label>
              {!uploadedImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-colors"
                >
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Upload an image</p>
                  <p className="text-xs text-muted-foreground">Click to browse • Max 10MB • PNG, JPG, WebP</p>
                </div>
              ) : (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded starting image"
                    fill
                    className="object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Prompt for Image-to-Video */}
            <div className="space-y-2">
              <Label htmlFor="i2v-prompt">Motion & Style Prompt</Label>
              <Textarea
                id="i2v-prompt"
                placeholder="Describe how you want the image to animate... (e.g., 'Camera slowly zooms in while clouds drift across the sky')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Describe camera movements, object motions, and atmospheric effects
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generation Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
              <SelectTrigger id="aspect-ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{ratio.label}</span>
                      <span className="text-xs text-muted-foreground">{ratio.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="duration">Duration</Label>
              <Badge variant="secondary">{duration}s</Badge>
            </div>
            <Slider
              id="duration"
              min={5}
              max={10}
              step={1}
              value={[duration]}
              onValueChange={(v) => setDuration(v[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">5-10 seconds</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Generation Time</p>
              <p className="text-xs text-blue-700">
                Video generation typically takes 2-5 minutes. You'll be notified when it's ready.
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Film className="mr-2 h-5 w-5" />
              Generate Video
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
