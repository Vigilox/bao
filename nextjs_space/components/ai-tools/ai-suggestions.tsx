'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, Palette, Type, Layout, Sparkles, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AISuggestionsProps {
  context?: any;
  onApplySuggestion?: (suggestion: any) => void;
}

export function AISuggestions({ context, onApplySuggestion }: AISuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any>({});
  const [activeTab, setActiveTab] = useState('composition');

  const fetchSuggestions = async (type: string) => {
    if (suggestions[type]) return;

    try {
      setLoading(true);
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          suggestionType: type,
        }),
      });

      const data = await res.json();
      setSuggestions((prev: any) => ({
        ...prev,
        [type]: data.suggestions,
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchSuggestions(value);
  };

  const applySuggestion = (suggestion: any) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }
    toast.success(`Applied: ${suggestion.title}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">AI Suggestions</h3>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="composition" className="text-xs">
            <Layout className="w-3 h-3 mr-1" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="color" className="text-xs">
            <Palette className="w-3 h-3 mr-1" />
            Color
          </TabsTrigger>
          <TabsTrigger value="text" className="text-xs">
            <Type className="w-3 h-3 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Style
          </TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && suggestions[activeTab] && (
          <div className="space-y-3">
            {suggestions[activeTab].map((suggestion: any) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {suggestion.description}
                      </CardDescription>
                    </div>
                    {suggestion.impact && (
                      <Badge
                        variant={suggestion.impact === 'high' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {suggestion.impact}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Color Palette Preview */}
                  {suggestion.palette && (
                    <div className="flex gap-2 mb-3">
                      {suggestion.palette.map((color: string) => (
                        <div
                          key={color}
                          className="w-8 h-8 rounded border shadow-sm"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}

                  {/* Style Characteristics */}
                  {suggestion.characteristics && (
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      {suggestion.characteristics.map((char: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3 h-3 text-primary" />
                          {char}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Example Preview */}
                  {suggestion.example && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded mb-3">
                      <pre className="font-mono">{JSON.stringify(suggestion.example, null, 2)}</pre>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
}