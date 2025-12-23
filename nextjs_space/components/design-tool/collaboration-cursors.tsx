'use client';

import { useEffect, useState } from 'react';
import { MousePointer2 } from 'lucide-react';

interface Collaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  color: string;
  cursorX: number | null;
  cursorY: number | null;
}

interface CollaborationCursorsProps {
  artboardId: string;
  currentUserId?: string;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export default function CollaborationCursors({
  artboardId,
  currentUserId,
  canvasRef,
}: CollaborationCursorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    fetchCollaborators();
    const interval = setInterval(fetchCollaborators, 2000); // Poll every 2 seconds
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

  const activeCollaborators = collaborators.filter(
    (c) => c.userId !== currentUserId && c.cursorX !== null && c.cursorY !== null
  );

  if (!canvasRef.current) return null;

  return (
    <>
      {activeCollaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className="absolute pointer-events-none z-50 transition-all duration-100"
          style={{
            left: `${collaborator.cursorX}px`,
            top: `${collaborator.cursorY}px`,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <MousePointer2
            className="h-5 w-5 drop-shadow-lg"
            style={{ color: collaborator.color }}
            fill={collaborator.color}
          />
          <div
            className="mt-1 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: collaborator.color,
              color: 'white',
            }}
          >
            {collaborator.userName}
          </div>
        </div>
      ))}
    </>
  );
}
