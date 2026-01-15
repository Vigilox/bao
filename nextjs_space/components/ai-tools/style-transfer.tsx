'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Loader2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface StyleTransferProps {
  imageUrl?: string;
  projectId?: string;
  onStyleApplied?: (result: any) => void;
}

export function StyleTransfer({ imageUrl, projectId, onStyleApplied }: StyleTransferProps) {
  const [styles, setStyles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [strength, setStrength] = useState(0.8);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/style-transfer');
      const data = await res.json();
      setStyles(data.styles || []);
    } catch (error) {
      console.error('Error fetching styles:', error);
      toast.error('Failed to load styles');
    } finally {
      setLoading(false);
    }
  };

  const applyStyleTransfer = async () => {
    if (!imageUrl || !selectedStyle) {
      toast.error('Please select a style first');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch('/api/ai/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentImage: imageUrl,
          style: selectedStyle,
          strength,
          projectId,
        }),
      });

      const data = await res.json();
      setResult(data);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/generate/status/${data.taskId}`);
          const statusData = await statusRes.json();

          if (statusData.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setResult(statusData);
            setProcessing(false);
            toast.success('Style applied successfully!');
            if (onStyleApplied) {
              onStyleApplied(statusData);
            }
          } else if (statusData.status === 'FAILED') {
            clearInterval(pollInterval);
            setProcessing(false);
            toast.error('Style transfer failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          setProcessing(false);
          console.error('Error checking status:', error);
        }
      }, 3000);

      // Cleanup after 2 minutes
      setTimeout(() => clearInterval(pollInterval), 120000);
    } catch (error) {
      console.error('Error applying style transfer:', error);
      toast.error('Failed to apply style');
      setProcessing(false);
    }
  };

  const groupedStyles = styles.reduce((acc: any, style) => {
    const category = style.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(style);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Wand2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Style Transfer</h3>
      </div>

      {!imageUrl && (
        <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-lg">
          Upload an image to apply artistic styles
        </div>
      )}

      {imageUrl && (
        <>
          {/* Current Image Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Style Selection */}
          <div className="space-y-3">
            <Label>Choose Artistic Style</Label>
            <Tabs defaultValue={Object.keys(groupedStyles)[0]} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                {Object.keys(groupedStyles).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(groupedStyles).map(([category, categoryStyles]: [string, any]) => (
                <TabsContent key={category} value={category} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {categoryStyles.map((style: any) => (
                      <Card
                        key={style.id}
                        className={`cursor-pointer transition-all ${
                          selectedStyle === style.id
                            ? 'ring-2 ring-primary shadow-md'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <CardContent className="p-3">
                          <p className="font-semibold text-sm mb-1">{style.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {style.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Strength Control */}
          <div className="space-y-2">
            <Label>Style Strength: {(strength * 100).toFixed(0)}%</Label>
            <Slider
              value={[strength]}
              onValueChange={([value]) => setStrength(value)}
              min={0.1}
              max={1}
              step={0.1}
            />
          </div>

          {/* Apply Button */}
          <Button
            onClick={applyStyleTransfer}
            disabled={!selectedStyle || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Apply Style
              </>
            )}
          </Button>

          {/* Result */}
          {result && result.status === 'COMPLETED' && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Styled Result</CardTitle>
                  <Badge variant="default">Complete</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={result.resultUrl}
                    alt="Styled"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="default" className="flex-1" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}