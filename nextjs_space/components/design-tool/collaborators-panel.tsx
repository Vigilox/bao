'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';

interface Collaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  cursorX: number | null;
  cursorY: number | null;
  lastActive: string;
}

interface CollaboratorsPanelProps {
  artboardId: string;
  currentUserId?: string;
}

export default function CollaboratorsPanel({ artboardId, currentUserId }: CollaboratorsPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    fetchCollaborators();
    const interval = setInterval(fetchCollaborators, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [artboardId]);

  const fetchCollaborators = async () => {
    try {
      const response = await fetch(`/api/artboards/${artboardId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const activeCollaborators = collaborators.filter((c) => c.userId !== currentUserId);

  return (
    <div className="flex items-center gap-2">
      {activeCollaborators.length > 0 && (
        <TooltipProvider>
          <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-lg">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{activeCollaborators.length}</span>
            <div className="flex -space-x-2 ml-1">
              {activeCollaborators.slice(0, 3).map((collaborator) => (
                <Tooltip key={collaborator.id}>
                  <TooltipTrigger>
                    <Avatar className="h-7 w-7 border-2" style={{ borderColor: collaborator.color }}>
                      <AvatarFallback
                        className="text-xs font-medium"
                        style={{ backgroundColor: `${collaborator.color}20`, color: collaborator.color }}
                      >
                        {collaborator.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{collaborator.userName}</p>
                    <p className="text-xs text-muted-foreground">{collaborator.userEmail}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {activeCollaborators.length > 3 && (
                <Avatar className="h-7 w-7 border-2 border-border">
                  <AvatarFallback className="text-xs bg-secondary">
                    +{activeCollaborators.length - 3}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
