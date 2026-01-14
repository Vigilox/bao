'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Grid3X3,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Loader2,
  Twitter,
  Instagram,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TipButton } from '@/components/monetization';

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  website: string | null;
  location: string | null;
  socialLinks: any;
  isVerified: boolean;
  totalViews: number;
  createdAt: string;
  // Monetization
  acceptsTips: boolean;
  minimumTip: number;
  tipMessage: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
    createdAt: string;
    _count: {
      followers: number;
      following: number;
      posts: number;
    };
  };
  isFollowing: boolean;
  isOwnProfile: boolean;
}

interface Post {
  id: string;
  title: string | null;
  caption: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  modelUsed: string | null;
  viewCount: number;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos'>('all');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  useEffect(() => {
    if (profile) {
      fetchPosts();
    }
  }, [profile, activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/creators/${username}`);
      if (!res.ok) throw new Error('Creator not found');
      const data = await res.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const mediaType = activeTab === 'all' ? '' : activeTab === 'images' ? 'image' : 'video';
    const res = await fetch(`/api/posts?username=${username}${mediaType ? `&mediaType=${mediaType}` : ''}`);
    const data = await res.json();
    setPosts(data.posts || []);
  };

  const handleFollow = async () => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    setFollowLoading(true);
    try {
      if (profile?.isFollowing) {
        await fetch(`/api/follow?userId=${profile.user.id}`, { method: 'DELETE' });
        setProfile(prev => prev ? { ...prev, isFollowing: false, user: { ...prev.user, _count: { ...prev.user._count, followers: prev.user._count.followers - 1 } } } : null);
      } else {
        await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile?.user.id }),
        });
        setProfile(prev => prev ? { ...prev, isFollowing: true, user: { ...prev.user, _count: { ...prev.user._count, followers: prev.user._count.followers + 1 } } } : null);
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    try {
      if (isLiked) {
        await fetch(`/api/posts/${postId}/like`, { method: 'DELETE' });
      } else {
        await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      }
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, isLiked: !isLiked, _count: { ...p._count, likes: p._count.likes + (isLiked ? -1 : 1) } }
          : p
      ));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Creator not found</h1>
        <Button onClick={() => router.push('/discover')}>Discover Creators</Button>
      </div>
    );
  }

  const avatarUrl = profile.avatarUrl || profile.user.image || '/logo.png';
  const displayName = profile.displayName || profile.user.name || profile.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="font-semibold">{displayName}</span>
            <span className="text-xs text-muted-foreground">{profile.user._count.posts} posts</span>
          </div>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-accent/20">
        {profile.bannerUrl && (
          <Image src={profile.bannerUrl} alt="Banner" fill className="object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-16 mb-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-muted">
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {profile.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />}
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
            
            {profile.bio && <p className="mt-3 text-sm whitespace-pre-wrap">{profile.bio}</p>}
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </span>
              )}
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <LinkIcon className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {new Date(profile.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Social Links */}
            {profile.socialLinks && (
              <div className="flex gap-3 mt-3">
                {profile.socialLinks.twitter && (
                  <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {profile.socialLinks.instagram && (
                  <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {profile.socialLinks.youtube && (
                  <a href={`https://youtube.com/@${profile.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!profile.isOwnProfile && (
            <div className="flex gap-2">
              <Button
                onClick={handleFollow}
                disabled={followLoading}
                variant={profile.isFollowing ? 'outline' : 'default'}
                className="min-w-[120px]"
              >
                {followLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : profile.isFollowing ? (
                  <><UserMinus className="w-4 h-4 mr-2" /> Unfollow</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" /> Follow</>
                )}
              </Button>
              {profile.acceptsTips && (
                <TipButton
                  creatorUsername={profile.username}
                  creatorDisplayName={profile.displayName || profile.user.name}
                  minimumTip={profile.minimumTip}
                  tipMessage={profile.tipMessage}
                />
              )}
            </div>
          )}
          {profile.isOwnProfile && (
            <Link href="/dashboard?tab=settings">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 py-4 border-y mb-6">
          <div className="text-center">
            <div className="font-bold text-lg">{profile.user._count.posts}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{profile.user._count.followers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{profile.user._count.following.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{profile.totalViews.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Views</div>
          </div>
        </div>

        {/* Posts Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" onClick={() => setActiveTab('all')}>
              <Grid3X3 className="w-4 h-4 mr-2" /> All
            </TabsTrigger>
            <TabsTrigger value="images" onClick={() => setActiveTab('images')}>
              <Grid3X3 className="w-4 h-4 mr-2" /> Images
            </TabsTrigger>
            <TabsTrigger value="videos" onClick={() => setActiveTab('videos')}>
              <Play className="w-4 h-4 mr-2" /> Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <PostsGrid posts={posts} onLike={handleLike} />
          </TabsContent>
          <TabsContent value="images" className="mt-6">
            <PostsGrid posts={posts} onLike={handleLike} />
          </TabsContent>
          <TabsContent value="videos" className="mt-6">
            <PostsGrid posts={posts} onLike={handleLike} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PostsGrid({ posts, onLike }: { posts: Post[]; onLike: (id: string, isLiked: boolean) => void }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No posts yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2">
      {posts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square group cursor-pointer bg-muted overflow-hidden rounded-lg"
        >
          <Link href={`/discover?post=${post.id}`}>
            {post.mediaType === 'video' ? (
              <>
                <video
                  src={post.mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <div className="absolute top-2 right-2 bg-black/60 rounded px-1.5 py-0.5 text-xs text-white flex items-center gap-1">
                  <Play className="w-3 h-3 fill-white" />
                </div>
              </>
            ) : (
              <Image src={post.mediaUrl} alt={post.title || 'Post'} fill className="object-cover" />
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
              <span className="flex items-center gap-1">
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {post._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-5 h-5" />
                {post._count.comments}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
