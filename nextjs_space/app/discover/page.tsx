'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  Users,
  Compass,
  Filter,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Film,
  ImageIcon,
  CheckCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

interface Post {
  id: string;
  title: string | null;
  caption: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  prompt: string | null;
  modelUsed: string | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
    profile: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isVerified: boolean;
    } | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    profile: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

const MODEL_COLORS: Record<string, string> = {
  'nano-banana': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'veo3': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'veo3-fast': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'sora2': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  'sora2-pro': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function DiscoverPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'discover' | 'following' | 'trending'>('discover');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Check for post param in URL
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && posts.length > 0) {
      const post = posts.find(p => p.id === postId);
      if (post) setSelectedPost(post);
    }
  }, [searchParams, posts]);

  useEffect(() => {
    fetchPosts(true);
  }, [feedType, mediaFilter, searchQuery]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost]);

  // Infinite scroll observer
  useEffect(() => {
    if (loadingMore) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [nextCursor, loadingMore]);

  const fetchPosts = async (reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      params.set('type', feedType);
      if (mediaFilter !== 'all') params.set('mediaType', mediaFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (!reset && nextCursor) params.set('cursor', nextCursor);

      const res = await fetch(`/api/feed?${params.toString()}`);
      const data = await res.json();

      if (reset) {
        setPosts(data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleLike = async (post: Post) => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    try {
      if (post.isLiked) {
        await fetch(`/api/posts/${post.id}/like`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      }
      const updatedPost = {
        ...post,
        isLiked: !post.isLiked,
        _count: { ...post._count, likes: post._count.likes + (post.isLiked ? -1 : 1) },
      };
      setPosts(posts.map(p => p.id === post.id ? updatedPost : p));
      if (selectedPost?.id === post.id) setSelectedPost(updatedPost);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleSave = async (post: Post) => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    try {
      if (post.isSaved) {
        await fetch(`/api/posts/${post.id}/save`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${post.id}/save`, { method: 'POST' });
      }
      const updatedPost = { ...post, isSaved: !post.isSaved };
      setPosts(posts.map(p => p.id === post.id ? updatedPost : p));
      if (selectedPost?.id === post.id) setSelectedPost(updatedPost);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleComment = async () => {
    if (!session?.user || !selectedPost || !newComment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
      // Update comment count
      const updatedPost = {
        ...selectedPost,
        _count: { ...selectedPost._count, comments: selectedPost._count.comments + 1 },
      };
      setSelectedPost(updatedPost);
      setPosts(posts.map(p => p.id === selectedPost.id ? updatedPost : p));
    } catch (error) {
      console.error('Comment error:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/discover?post=${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.title || 'Check this out!', url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const closeModal = () => {
    setSelectedPost(null);
    setComments([]);
    router.push('/discover', { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="BAO" width={40} height={40} />
              <span className="font-bold text-xl hidden sm:inline">Discover</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search creations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Auth */}
            {session?.user ? (
              <Link href="/dashboard">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ''} />
                  <AvatarFallback>{session.user.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-3 overflow-x-auto pb-1">
            <Tabs value={feedType} onValueChange={(v) => setFeedType(v as any)} className="flex-shrink-0">
              <TabsList>
                <TabsTrigger value="discover" className="gap-1.5">
                  <Compass className="w-4 h-4" /> Discover
                </TabsTrigger>
                <TabsTrigger value="trending" className="gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Trending
                </TabsTrigger>
                {session?.user && (
                  <TabsTrigger value="following" className="gap-1.5">
                    <Users className="w-4 h-4" /> Following
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant={mediaFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMediaFilter('all')}
              >
                All
              </Button>
              <Button
                variant={mediaFilter === 'image' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMediaFilter('image')}
              >
                <ImageIcon className="w-4 h-4 mr-1" /> Images
              </Button>
              <Button
                variant={mediaFilter === 'video' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMediaFilter('video')}
              >
                <Film className="w-4 h-4 mr-1" /> Videos
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No posts found</h2>
            <p className="text-muted-foreground">Be the first to share your creation!</p>
            {session?.user && (
              <Link href="/dashboard">
                <Button className="mt-4">Create Something</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="break-inside-avoid"
                >
                  <div
                    className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => {
                      setSelectedPost(post);
                      router.push(`/discover?post=${post.id}`, { scroll: false });
                    }}
                  >
                    {/* Media */}
                    <div className="relative aspect-auto">
                      {post.mediaType === 'video' ? (
                        <div className="relative">
                          <video
                            src={post.mediaUrl}
                            className="w-full"
                            muted
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                          <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1 text-xs text-white flex items-center gap-1">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-square">
                          <Image src={post.mediaUrl} alt={post.title || 'Post'} fill className="object-cover" />
                        </div>
                      )}
                      
                      {/* Model Badge */}
                      {post.modelUsed && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className={`text-xs ${MODEL_COLORS[post.modelUsed] || 'bg-muted'}`}>
                            <Sparkles className="w-3 h-3 mr-1" />
                            {post.modelUsed.replace('-', ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {/* Creator */}
                      <Link
                        href={`/creator/${post.user.profile?.username || post.user.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 mb-2 hover:opacity-80"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.user.profile?.avatarUrl || post.user.image || ''} />
                          <AvatarFallback>{post.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate flex items-center gap-1">
                          {post.user.profile?.displayName || post.user.name}
                          {post.user.profile?.isVerified && <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/20" />}
                        </span>
                      </Link>

                      {/* Caption */}
                      {post.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.caption}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLike(post); }}
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                          >
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="text-xs">{post._count.likes}</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{post._count.comments}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShare(post); }}
                            className="hover:text-primary transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSave(post); }}
                            className="hover:text-primary transition-colors"
                          >
                            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-primary text-primary' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Load More */}
            <div ref={loadMoreRef} className="py-8 text-center">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />}
            </div>
          </>
        )}
      </main>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Side */}
              <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
                {selectedPost.mediaType === 'video' ? (
                  <video
                    src={selectedPost.mediaUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[60vh] md:max-h-[90vh]"
                  />
                ) : (
                  <div className="relative w-full h-[60vh] md:h-[90vh]">
                    <Image src={selectedPost.mediaUrl} alt="Post" fill className="object-contain" />
                  </div>
                )}
              </div>

              {/* Details Side */}
              <div className="w-full md:w-96 flex flex-col max-h-[40vh] md:max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <Link
                    href={`/creator/${selectedPost.user.profile?.username || selectedPost.user.id}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <Avatar>
                      <AvatarImage src={selectedPost.user.profile?.avatarUrl || selectedPost.user.image || ''} />
                      <AvatarFallback>{selectedPost.user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold flex items-center gap-1">
                        {selectedPost.user.profile?.displayName || selectedPost.user.name}
                        {selectedPost.user.profile?.isVerified && <CheckCircle className="w-4 h-4 text-primary fill-primary/20" />}
                      </p>
                      <p className="text-sm text-muted-foreground">@{selectedPost.user.profile?.username}</p>
                    </div>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={closeModal}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Caption & Prompt */}
                <div className="p-4 border-b space-y-2">
                  {selectedPost.caption && <p className="text-sm">{selectedPost.caption}</p>}
                  {selectedPost.prompt && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Prompt</p>
                      <p className="text-sm">{selectedPost.prompt}</p>
                    </div>
                  )}
                  {selectedPost.modelUsed && (
                    <Badge variant="outline" className={MODEL_COLORS[selectedPost.modelUsed] || ''}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {selectedPost.modelUsed.replace('-', ' ')}
                    </Badge>
                  )}
                </div>

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user.profile?.avatarUrl || ''} />
                          <AvatarFallback>{comment.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{comment.user.profile?.displayName || comment.user.name}</span>{' '}
                            {comment.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(selectedPost)} className="hover:scale-110 transition-transform">
                        <Heart className={`w-6 h-6 ${selectedPost.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                      <MessageCircle className="w-6 h-6" />
                      <button onClick={() => handleShare(selectedPost)}>
                        <Share2 className="w-6 h-6" />
                      </button>
                    </div>
                    <button onClick={() => handleSave(selectedPost)}>
                      <Bookmark className={`w-6 h-6 ${selectedPost.isSaved ? 'fill-primary text-primary' : ''}`} />
                    </button>
                  </div>
                  <p className="font-semibold text-sm mb-1">{selectedPost._count.likes.toLocaleString()} likes</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Comment Input */}
                {session?.user && (
                  <div className="p-4 border-t flex gap-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[40px] max-h-[80px] resize-none"
                      rows={1}
                    />
                    <Button
                      size="icon"
                      onClick={handleComment}
                      disabled={!newComment.trim() || commentLoading}
                    >
                      {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
