'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Calendar, Users, Award, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Challenge {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  rules: string;
  prize?: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'ARCHIVED';
  totalSubmissions: number;
  totalParticipants: number;
  tags: string[];
}

export function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [filter, setFilter] = useState<string>('ACTIVE');

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/challenges?status=${filter}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ENDED':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getDaysLeft = (endDate: string) => {
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
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
            <Trophy className="w-8 h-8 text-primary" />
            Creator Challenges
          </h2>
          <p className="text-muted-foreground">Compete, showcase your skills, and win prizes</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="space-y-4">
        <TabsList>
          <TabsTrigger value="ACTIVE">Active</TabsTrigger>
          <TabsTrigger value="UPCOMING">Upcoming</TabsTrigger>
          <TabsTrigger value="ENDED">Ended</TabsTrigger>
        </TabsList>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No {filter.toLowerCase()} challenges</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedChallenge(challenge)}
              >
                {challenge.coverImageUrl && (
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={challenge.coverImageUrl}
                      alt={challenge.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={getStatusColor(challenge.status)} variant="outline">
                      {challenge.status}
                    </Badge>
                    {challenge.status === 'ACTIVE' && (
                      <Badge variant="secondary">
                        {getDaysLeft(challenge.endDate)} days left
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{challenge.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {challenge.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {challenge.prize && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="font-medium">{challenge.prize}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {challenge.totalSubmissions} submissions
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    {challenge.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {challenge.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Tabs>

      {/* Challenge Details Modal */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedChallenge && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(selectedChallenge.status)} variant="outline">
                    {selectedChallenge.status}
                  </Badge>
                  {selectedChallenge.prize && (
                    <Badge variant="default" className="bg-primary">
                      <Award className="w-3 h-3 mr-1" />
                      {selectedChallenge.prize}
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{selectedChallenge.title}</DialogTitle>
                <DialogDescription>{selectedChallenge.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {selectedChallenge.coverImageUrl && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={selectedChallenge.coverImageUrl}
                      alt={selectedChallenge.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedChallenge.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(selectedChallenge.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                    <p className="text-lg font-semibold">{selectedChallenge.totalSubmissions}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Participants</p>
                    <p className="text-lg font-semibold">{selectedChallenge.totalParticipants}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Rules</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {selectedChallenge.rules}
                    </p>
                  </div>
                </div>

                {selectedChallenge.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChallenge.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChallenge.status === 'ACTIVE' && (
                  <Button className="w-full" size="lg">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Submit Your Entry
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}