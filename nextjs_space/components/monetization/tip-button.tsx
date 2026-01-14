'use client';

import { useState } from 'react';
import { DollarSign, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TipModal } from './tip-modal';

interface TipButtonProps {
  creatorUsername: string;
  creatorDisplayName: string;
  minimumTip?: number;
  tipMessage?: string | null;
  postId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TipButton({
  creatorUsername,
  creatorDisplayName,
  minimumTip = 1,
  tipMessage,
  postId,
  variant = 'default',
  size = 'default',
  className,
}: TipButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={className}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Tip
      </Button>

      <TipModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        creatorUsername={creatorUsername}
        creatorDisplayName={creatorDisplayName}
        minimumTip={minimumTip}
        tipMessage={tipMessage}
        postId={postId}
      />
    </>
  );
}
