'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Download,
  Loader2,
  Upload,
  Plus,
} from 'lucide-react';

interface Asset {
  id: string;
  filename: string;
  assetType: string;
  url?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export function ArtifactPanel({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  const fetchAssets = async () => {
    try {
      const res = await fetch(`/api/assets?projectId=${projectId}`);
      if (res?.ok) {
        const data = await res.json();
        setAssets(data?.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes?.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes?.ok) {
        throw new Error('Failed to upload file');
      }

      // Create asset record
      const assetRes = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename: file.name,
          assetType: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'reference',
          cloudStoragePath: cloud_storage_path,
          isPublic: true,
        }),
      });

      if (assetRes?.ok) {
        fetchAssets();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 h-[calc(100vh-250px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Assets</h3>
        <label
          htmlFor="file-upload"
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : assets?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ImageIcon className="h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm text-slate-500">
              No assets yet. Upload images or generate content to see them here.
            </p>
          </div>
        ) : (
          assets?.map((asset) => (
            <motion.div
              key={asset?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-purple-500/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {asset?.assetType === 'image' ? (
                    <div className="w-12 h-12 bg-slate-700 rounded overflow-hidden">
                      {asset?.url && (
                        <img
                          src={asset.url}
                          alt={asset?.filename}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : asset?.assetType === 'video' ? (
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                      <Video className="h-6 w-6 text-slate-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {asset?.filename}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(asset?.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {asset?.url && (
                  <a
                    href={asset.url}
                    download={asset.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4 text-slate-400 hover:text-white" />
                  </a>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
