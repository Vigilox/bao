'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Download, Loader2, FileImage, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportControlsProps {
  canvas: any; // fabric.Canvas
  artboardName: string;
}

export default function ExportControls({ canvas, artboardName }: ExportControlsProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  const [quality, setQuality] = useState([1]);
  const [exporting, setExporting] = useState(false);

  const exportCanvas = async () => {
    if (!canvas) {
      toast.error('Canvas not available');
      return;
    }

    setExporting(true);
    try {
      if (format === 'png') {
        exportAsPNG();
      } else if (format === 'svg') {
        exportAsSVG();
      } else if (format === 'pdf') {
        await exportAsPDF();
      }
      toast.success(`Exported as ${format.toUpperCase()}!`);
      setOpen(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const exportAsPNG = () => {
    const multiplier = quality[0];
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: multiplier,
    });

    const link = document.createElement('a');
    link.download = `${artboardName || 'artboard'}.png`;
    link.href = dataURL;
    link.click();
  };

  const exportAsSVG = () => {
    const svgData = canvas.toSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `${artboardName || 'artboard'}.svg`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportAsPDF = async () => {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Export canvas as PNG first
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    // Create PDF with canvas dimensions (convert px to mm)
    const pxToMm = 0.264583;
    const widthMm = canvasWidth * pxToMm;
    const heightMm = canvasHeight * pxToMm;

    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm],
    });

    pdf.addImage(dataURL, 'PNG', 0, 0, widthMm, heightMm);
    pdf.save(`${artboardName || 'artboard'}.pdf`);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Artboard</DialogTitle>
            <DialogDescription>
              Choose export format and quality settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">PNG</div>
                        <div className="text-xs text-muted-foreground">
                          High-quality raster image (recommended)
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="svg" id="svg" />
                  <Label htmlFor="svg" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileType className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">SVG</div>
                        <div className="text-xs text-muted-foreground">
                          Scalable vector graphics (for further editing)
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-secondary/50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileType className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">PDF</div>
                        <div className="text-xs text-muted-foreground">
                          Print-ready document format
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quality Slider (PNG only) */}
            {format === 'png' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Export Quality</Label>
                  <span className="text-sm text-muted-foreground">{quality[0]}x</span>
                </div>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={1}
                  max={4}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Standard (1x)</span>
                  <span>High (2x)</span>
                  <span>Ultra (4x)</span>
                </div>
              </div>
            )}

            {/* Preview Info */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="text-sm font-medium">Export Settings</div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Format: {format.toUpperCase()}</div>
                {format === 'png' && <div>Quality: {quality[0]}x resolution</div>}
                <div>Filename: {artboardName || 'artboard'}.{format}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={exportCanvas} disabled={exporting} className="flex-1">
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
