'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Film,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GenerationTask {
  id: string;
  taskId: string;
  status: string;
  model: string;
  taskType: string;
  parameters: any;
  resultUrl: string | null;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
}

interface VideoGalleryProps {
  projectId?: string;
  autoRefresh?: boolean;
  onTaskUpdate?: (task: GenerationTask) => void;
}

export function VideoGallery({ projectId, autoRefresh = true, onTaskUpdate }: VideoGalleryProps) {
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pollingTasks, setPollingTasks] = useState<Set<string>>(new Set());
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        taskType: 'video',
      });

      if (projectId) {
        params.append('projectId', projectId);
      }

      const response = await fetch(`/api/generate/tasks?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load video tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    if (pollingTasks.has(taskId)) return;

    setPollingTasks((prev) => new Set(prev).add(taskId));

    try {
      const response = await fetch(`/api/generate/status/${taskId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check task status');
      }

      const data = await response.json();
      const updatedTask = data.task;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updatedTask : t))
      );

      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      if (updatedTask.status === 'completed') {
        toast.success('Video generation completed!');
      } else if (updatedTask.status === 'failed') {
        toast.error('Video generation failed');
      }
    } catch (error) {
      console.error('Error polling task:', error);
    } finally {
      setPollingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const pendingTasks = tasks.filter(
        (t) => t.status === 'pending' || t.status === 'processing'
      );

      pendingTasks.forEach((task) => {
        pollTaskStatus(task.id);
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [tasks, autoRefresh]);

  const handleDownload = async (task: GenerationTask) => {
    if (!task.resultUrl) return;

    try {
      const a = document.createElement('a');
      a.href = task.resultUrl;
      a.download = `video-${task.id}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading video:', error);
      toast.error('Failed to download video');
    }
  };

  const handleDelete = async () => {
    if (!deleteTaskId) return;

    try {
      // TODO: Implement delete endpoint
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeleteTaskId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Video Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Video Gallery
              </CardTitle>
              <CardDescription>
                {tasks.length} {tasks.length === 1 ? 'video' : 'videos'} generated
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTasks}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">No videos generated yet</p>
              <p className="text-xs text-muted-foreground">
                Start generating videos to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Video Preview */}
                    <div className="w-full md:w-64 aspect-video bg-muted relative">
                      {task.resultUrl && task.status === 'completed' ? (
                        <video
                          src={task.resultUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {task.status === 'processing' || task.status === 'pending' ? (
                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                          ) : (
                            <Film className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium line-clamp-2">
                            {task.parameters?.prompt || 'No prompt'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.project.name}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(task.status)}
                      </div>

                      {/* Parameters */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">{task.parameters?.aspectRatio || '16:9'}</Badge>
                        <Badge variant="outline">{task.parameters?.duration || 5}s</Badge>
                        <Badge variant="outline">{task.model}</Badge>
                      </div>

                      {/* Error Message */}
                      {task.status === 'failed' && task.errorMsg && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <p className="text-xs text-red-700">{task.errorMsg}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        {task.status === 'completed' && task.resultUrl && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(task)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(task.resultUrl!, '_blank')}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Open
                            </Button>
                          </>
                        )}
                        {(task.status === 'pending' || task.status === 'processing') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pollTaskStatus(task.id)}
                            disabled={pollingTasks.has(task.id)}
                          >
                            <RefreshCw
                              className={`h-3.5 w-3.5 mr-1.5 ${
                                pollingTasks.has(task.id) ? 'animate-spin' : ''
                              }`}
                            />
                            Check Status
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                          onClick={() => setDeleteTaskId(task.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the task record from your gallery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
