'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Plus,
  LogOut,
  FolderOpen,
  Loader2,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export function DashboardClient() {
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

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

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="BAO Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">BAO Studio</h1>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <p className="text-sm font-medium text-foreground">{session?.user?.name || session?.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-secondary rounded-lg transition"
              title="Sign out"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Your Projects</h2>
              <p className="text-muted-foreground">Create and manage your creative projects</p>
            </div>
            <button
              onClick={createProject}
              disabled={creating}
              className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition duration-200 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              New Project
            </button>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">Create your first project to get started</p>
              <button
                onClick={createProject}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition"
              >
                <Plus className="h-5 w-5" />
                Create Project
              </button>
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
                    <div className="group bg-white rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Film className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(project?.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition">
                        {project?.name}
                      </h3>

                      {project?.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {project?.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Film className="h-4 w-4" />
                          <span>{project?._count?.scenes || 0} scenes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          <span>{project?._count?.assets || 0} assets</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
