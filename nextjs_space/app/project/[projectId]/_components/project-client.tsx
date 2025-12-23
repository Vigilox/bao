'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Loader2,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Grid3x3,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { ChatMessage } from './chat-message';
import { ArtifactPanel } from './artifact-panel';
import { SceneList } from './scene-list';

interface Project {
  id: string;
  name: string;
  description?: string;
  scenes: any[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ProjectClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'scenes' | 'assets'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProject();
    fetchChatHistory();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res?.ok) {
        const data = await res.json();
        setProject(data?.project);
      } else if (res?.status === 404) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    // In a real implementation, fetch chat history from API
    // For now, start with an empty chat
  };

  const sendMessage = async () => {
    if (!input?.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Add user message
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          message: userMessage,
          history: messages,
        }),
      });

      if (!response?.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed?.content) {
                assistantMessage += parsed.content;
                // Update the last message
                setMessages((prev) => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: assistantMessage },
                ]);
              } else if (parsed?.done) {
                break;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-slate-400" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">{project?.name}</h1>
              {project?.description && (
                <p className="text-sm text-slate-400">{project?.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('chat')}
              className={`px-4 py-2 rounded-lg transition ${
                activeView === 'chat'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveView('scenes')}
              className={`px-4 py-2 rounded-lg transition ${
                activeView === 'scenes'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Area */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 h-[calc(100vh-250px)] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-6 mb-6">
                  {messages?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-16 w-16 text-slate-600 mb-4" />
                      <h3 className="text-xl font-semibold text-slate-400 mb-2">
                        Start a conversation
                      </h3>
                      <p className="text-slate-500 max-w-md">
                        Ask me to help you plan scenes, generate storyboards, create characters, or
                        refine your creative vision.
                      </p>
                    </div>
                  ) : (
                    messages?.map((msg, idx) => (
                      <ChatMessage key={idx} role={msg?.role} content={msg?.content} />
                    ))
                  )}
                  {sending && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your project..."
                    disabled={sending}
                    rows={3}
                    className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input?.trim() || sending}
                    className="absolute right-3 bottom-3 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Artifact Panel */}
            <div className="lg:col-span-1">
              <ArtifactPanel projectId={projectId} />
            </div>
          </div>
        ) : activeView === 'scenes' ? (
          <SceneList projectId={projectId} scenes={project?.scenes || []} />
        ) : null}
      </div>
    </div>
  );
}
