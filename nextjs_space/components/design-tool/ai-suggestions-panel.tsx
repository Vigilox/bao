'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ColorPalette {
  name: string;
  colors: string[];
  usage: {
    primary: string;
    accent: string;
    background: string;
    text: string;
    secondary: string;
  };
  description: string;
}

interface AISuggestionsPanelProps {
  onApplyColor?: (color: string) => void;
}

export default function AISuggestionsPanel({ onApplyColor }: AISuggestionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);

  const generateSuggestions = async (type: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/design/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context: context || 'modern design' }),
      });

      if (!response.ok) throw new Error('Failed to generate suggestions');

      const data = await response.json();
      
      if (type === 'colors') {
        setColorPalettes(data.suggestions.palettes || []);
        toast.success('Color palettes generated!');
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 border-l bg-background p-4 space-y-4 overflow-y-auto">
      <div>
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Design Assistant
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Get AI-powered suggestions for your design
        </p>

        <Input
          placeholder="Design context (e.g., 'tech startup', 'wellness brand')..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="text-sm"
        />
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-3 mt-4">
          <Button
            onClick={() => generateSuggestions('colors')}
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Palettes
              </>
            )}
          </Button>

          {colorPalettes.length > 0 && (
            <div className="space-y-3">
              {colorPalettes.map((palette, idx) => (
                <Card key={idx} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{palette.name}</h4>
                    {selectedPalette === palette.name && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{palette.description}</p>
                  
                  <div className="flex gap-1">
                    {palette.colors.map((color, colorIdx) => (
                      <button
                        key={colorIdx}
                        onClick={() => {
                          onApplyColor?.(color);
                          setSelectedPalette(palette.name);
                          toast.success(`Applied ${color}`);
                        }}
                        className="flex-1 h-10 rounded cursor-pointer hover:scale-110 transition-transform border border-border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(palette.usage).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1">
                        <div
                          className="w-3 h-3 rounded-sm border"
                          style={{ backgroundColor: value }}
                        />
                        <span className="text-muted-foreground capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tips" className="space-y-3 mt-4">
          <Card className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Quick Design Tips</h4>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
              <li>Use the Rule of Thirds for balanced layouts</li>
              <li>Maintain consistent spacing (8px grid system)</li>
              <li>Limit color palette to 3-5 main colors</li>
              <li>Ensure text contrast ratio of at least 4.5:1</li>
              <li>Use hierarchy to guide the viewer's eye</li>
              <li>Leave adequate whitespace for breathing room</li>
            </ul>
          </Card>

          <Card className="p-4 space-y-2">
            <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Select</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">V</kbd>
              </div>
              <div className="flex justify-between">
                <span>Text</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">T</kbd>
              </div>
              <div className="flex justify-between">
                <span>Rectangle</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">R</kbd>
              </div>
              <div className="flex justify-between">
                <span>Circle</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">O</kbd>
              </div>
              <div className="flex justify-between">
                <span>Undo</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+Z</kbd>
              </div>
              <div className="flex justify-between">
                <span>Redo</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+Shift+Z</kbd>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
