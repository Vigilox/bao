'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Plus,
  FolderOpen,
  Loader2,
  Film,
  Image as ImageIcon,
  Settings,
  Grid3X3,
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Bookmark,
  Compass,
  Upload,
  Camera,
  Check,
  X,
  ExternalLink,
  Play,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { SiteNavigation } from '@/components/navigation/site-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    scenes: number;
    assets: number;
  };
}

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
  user: {
    name: string;
    email: string;
    image: string | null;
    _count: {
      followers: number;
      following: number;
      posts: number;
    };
  };
}

interface Post {
  id: string;
  title: string | null;
  caption: string | null;
  mediaType: string;
  mediaUrl: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

interface Notification {
  id: string;
  type: string;
  postId: string | null;
  message: string | null;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    profile: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  } | null;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession() || {};
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    website: '',
    location: '',
    twitter: '',
    instagram: '',
    youtube: '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    fetchProjects();
    fetchProfile();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res?.ok) {
        const data = await res.json();
        setProjects(data?.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res?.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setProfileForm({
            username: data.profile.username || '',
            displayName: data.profile.displayName || '',
            bio: data.profile.bio || '',
            website: data.profile.website || '',
            location: data.profile.location || '',
            twitter: data.profile.socialLinks?.twitter || '',
            instagram: data.profile.socialLinks?.instagram || '',
            youtube: data.profile.socialLinks?.youtube || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts?userId=${session?.user?.id}`);
      if (res?.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      // For now, fetch from a hypothetical saved endpoint
      // This would need a dedicated API endpoint
      setSavedPosts([]);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res?.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const createProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: '' }),
      });

      if (res?.ok) {
        const data = await res.json();
        router.push(`/project/${data?.project?.id}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileForm.username,
          displayName: profileForm.displayName,
          bio: profileForm.bio,
          website: profileForm.website,
          location: profileForm.location,
          socialLinks: {
            twitter: profileForm.twitter,
            instagram: profileForm.instagram,
            youtube: profileForm.youtube,
          },
        }),
      });

      if (res?.ok) {
        const data = await res.json();
        setProfile(data.profile);
        alert('Profile saved successfully!');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res?.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationText = (notif: Notification) => {
    const actorName = notif.actor?.profile?.displayName || notif.actor?.name || 'Someone';
    switch (notif.type) {
      case 'like': return `${actorName} liked your post`;
      case 'comment': return `${actorName} commented: "${notif.message?.slice(0, 50)}..."`;
      case 'follow': return `${actorName} started following you`;
      default: return notif.message || 'New notification';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <SiteNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Dashboard Header with Stats */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatarUrl || session?.user?.image || ''} />
                <AvatarFallback className="text-xl">{session?.user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {profile?.displayName || session?.user?.name || 'Creator'}!
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {profile && (
                    <>
                      <span>{profile.user._count.posts} posts</span>
                      <span>{profile.user._count.followers} followers</span>
                      <span>{profile.user._count.following} following</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/discover">
                <Button variant="outline" size="sm">
                  <Compass className="w-4 h-4 mr-2" />
                  Discover
                </Button>
              </Link>
              {profile?.username && (
                <Link href={`/creator/${profile.username}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="projects" className="gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="posts" className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 relative">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Your Projects</h2>
                  <p className="text-sm text-muted-foreground">Create and manage your creative projects</p>
                </div>
                <Button onClick={createProject} disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  New Project
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : projects?.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl">
                  <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-6">Create your first project to get started</p>
                  <Button onClick={createProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects?.map((project, index) => (
                    <motion.div
                      key={project?.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link href={`/project/${project?.id}`}>
                        <div className="group bg-card rounded-xl p-6 border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <Film className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(project?.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">
                            {project?.name}
                          </h3>
                          {project?.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {project?.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Film className="h-4 w-4" />
                              {project?._count?.scenes || 0} scenes
                            </span>
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-4 w-4" />
                              {project?._count?.assets || 0} assets
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Your Posts</h2>
                  <p className="text-sm text-muted-foreground">Manage your published content</p>
                </div>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl">
                  <Grid3X3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-6">Share your creations with the community</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {posts.map((post) => (
                    <div key={post.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                      {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
                      ) : (
                        <Image src={post.mediaUrl} alt="" fill className="object-cover" />
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post._count.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post._count.comments}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link href={`/discover?post=${post.id}`}>
                            <Button size="sm" variant="secondary">View</Button>
                          </Link>
                          <Button size="sm" variant="destructive" onClick={() => deletePost(post.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Media type indicator */}
                      {post.mediaType === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/60 rounded p-1">
                          <Play className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                      
                      {/* Privacy badge */}
                      {!post.isPublic && (
                        <Badge className="absolute top-2 left-2" variant="secondary">Private</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Saved Posts</h2>
                  <p className="text-sm text-muted-foreground">Content you've bookmarked for later</p>
                </div>
              </div>

              <div className="text-center py-20 bg-muted/30 rounded-xl">
                <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved posts yet</h3>
                <p className="text-muted-foreground mb-6">Save posts from the Discover page to view them here</p>
                <Link href="/discover">
                  <Button>
                    <Compass className="w-4 h-4 mr-2" />
                    Explore Content
                  </Button>
                </Link>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Stay updated on your activity</p>
                </div>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark all read
                  </Button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
                  <p className="text-muted-foreground">When someone interacts with your content, you'll see it here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        !notif.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notif.actor?.profile?.avatarUrl || ''} />
                        <AvatarFallback>{notif.actor?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notif.type)}
                          <p className="text-sm">{getNotificationText(notif)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {notif.postId && (
                        <Link href={`/discover?post=${notif.postId}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Profile Settings</h2>
                  <p className="text-sm text-muted-foreground">Customize your public profile</p>
                </div>

                <div className="space-y-6 bg-card rounded-xl p-6 border">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Username</label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        placeholder="username"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Your unique handle (letters, numbers, underscores only)</p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <Input
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      placeholder="Your Name"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Tell the world about yourself..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{profileForm.bio.length}/160</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <Input
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Social Links</label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm text-muted-foreground">Twitter</span>
                        <Input
                          value={profileForm.twitter}
                          onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm text-muted-foreground">Instagram</span>
                        <Input
                          value={profileForm.instagram}
                          onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                          placeholder="username"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm text-muted-foreground">YouTube</span>
                        <Input
                          value={profileForm.youtube}
                          onChange={(e) => setProfileForm({ ...profileForm, youtube: e.target.value })}
                          placeholder="channel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t">
                    <Button onClick={saveProfile} disabled={savingProfile} className="w-full sm:w-auto">
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
