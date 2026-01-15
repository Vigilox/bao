'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Plus, Search, Eye, MessageCircle, Pin, Lock, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ForumThread {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  totalReplies: number;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  _count?: {
    replies: number;
  };
}

interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export function Forum() {
  const { data: session } = useSession() || {};
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // New thread form
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('GENERAL');

  useEffect(() => {
    fetchThreads();
  }, [category, search]);

  useEffect(() => {
    if (selectedThread) {
      fetchThread(selectedThread.id);
    }
  }, [selectedThread]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/forum?${params}`);
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load forum threads');
    } finally {
      setLoading(false);
    }
  };

  const fetchThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/forum/${threadId}`);
      const data = await res.json();
      setSelectedThread(data.thread);
      setReplies(data.thread.replies || []);
    } catch (error) {
      console.error('Error fetching thread:', error);
      toast.error('Failed to load thread');
    }
  };

  const createThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThreadTitle,
          content: newThreadContent,
          category: newThreadCategory,
        }),
      });

      if (!res.ok) throw new Error('Failed to create thread');

      toast.success('Thread created!');
      setShowNewThread(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadCategory('GENERAL');
      await fetchThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error('Failed to create thread');
    }
  };

  const postReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;

    try {
      const res = await fetch(`/api/forum/${selectedThread.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent }),
      });

      if (!res.ok) throw new Error('Failed to post reply');

      toast.success('Reply posted!');
      setReplyContent('');
      await fetchThread(selectedThread.id);
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      GENERAL: 'bg-gray-500/10 text-gray-500',
      TUTORIALS: 'bg-blue-500/10 text-blue-500',
      FEEDBACK: 'bg-purple-500/10 text-purple-500',
      SHOWCASE: 'bg-green-500/10 text-green-500',
      HELP: 'bg-orange-500/10 text-orange-500',
      ANNOUNCEMENTS: 'bg-red-500/10 text-red-500',
    };
    return colors[category] || colors.GENERAL;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Community Forum
          </h2>
          <p className="text-muted-foreground">Share knowledge, get help, and connect with creators</p>
        </div>
        <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Thread</DialogTitle>
              <DialogDescription>Start a new discussion in the community forum</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter thread title..."
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newThreadCategory} onValueChange={setNewThreadCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="TUTORIALS">Tutorials</SelectItem>
                    <SelectItem value="FEEDBACK">Feedback</SelectItem>
                    <SelectItem value="SHOWCASE">Showcase</SelectItem>
                    <SelectItem value="HELP">Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Write your post..."
                  rows={8}
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewThread(false)}>
                  Cancel
                </Button>
                <Button onClick={createThread}>
                  Create Thread
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="TUTORIALS">Tutorials</SelectItem>
            <SelectItem value="FEEDBACK">Feedback</SelectItem>
            <SelectItem value="SHOWCASE">Showcase</SelectItem>
            <SelectItem value="HELP">Help</SelectItem>
            <SelectItem value="ANNOUNCEMENTS">Announcements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Thread List */}
      <div className="space-y-2">
        {threads.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">No threads found</p>
          </Card>
        ) : (
          threads.map((thread) => (
            <Card
              key={thread.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedThread(thread)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {thread.isPinned && <Pin className="w-4 h-4 text-primary" />}
                      {thread.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                      <Badge className={getCategoryColor(thread.category)} variant="secondary">
                        {thread.category}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-1">{thread.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {thread.content}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {thread.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {thread._count?.replies || 0}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={thread.author.image} />
                      <AvatarFallback className="text-xs">
                        {thread.author.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{thread.author.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Thread View Dialog */}
      <Dialog open={!!selectedThread} onOpenChange={() => setSelectedThread(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedThread && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.isPinned && <Pin className="w-4 h-4 text-primary" />}
                  {selectedThread.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  <Badge className={getCategoryColor(selectedThread.category)} variant="secondary">
                    {selectedThread.category}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedThread.title}</DialogTitle>
              </DialogHeader>

              {/* Original Post */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedThread.author.image} />
                      <AvatarFallback>{selectedThread.author.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedThread.author.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedThread.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{selectedThread.content}</p>
                </CardContent>
              </Card>

              <Separator />

              {/* Replies */}
              <div className="space-y-3">
                <h4 className="font-semibold">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h4>
                {replies.map((reply) => (
                  <Card key={reply.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={reply.author.image} />
                          <AvatarFallback className="text-xs">
                            {reply.author.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{reply.author.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(reply.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Reply Form */}
              {!selectedThread.isLocked && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your reply..."
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={postReply} disabled={!replyContent.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Post Reply
                    </Button>
                  </div>
                </div>
              )}

              {selectedThread.isLocked && (
                <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This thread is locked</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}