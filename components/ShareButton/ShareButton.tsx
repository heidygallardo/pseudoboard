'use client';

import React, { useState } from 'react';
import { useCanvas } from '@/contexts/CanvasContext';
import styles from './ShareButton.module.css';

const ShareButton: React.FC = () => {
  const { isCollaborative, startCollaboration, leaveRoom, roomId } = useCanvas();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const handleShare = () => {
    if (isCollaborative) {
      // Copy current room link to clipboard
      if (roomId) {
        const shareUrl = `${window.location.origin}?room=${roomId}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          setShowCopiedMessage(true);
          setTimeout(() => setShowCopiedMessage(false), 2000);
        });
      }
    } else {
      // Start collaboration and copy link
      const newRoomId = startCollaboration();
      const shareUrl = `${window.location.origin}?room=${newRoomId}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      });
    }
  };

  const handleLeave = () => {
    leaveRoom();
  };

  return (
    <div className={styles.shareButtonContainer}>
      {isCollaborative ? (
        <div className={styles.collaborativeState}>
          <button 
            className={styles.shareButton}
            onClick={handleShare}
            title="Copy room link"
          >
            📋 Copy Link
          </button>
          <button 
            className={styles.leaveButton}
            onClick={handleLeave}
            title="Leave collaborative session"
          >
            ← Leave
          </button>
        </div>
      ) : (
        <button 
          className={styles.shareButton}
          onClick={handleShare}
          title="Start collaboration and get shareable link"
        >
          🔗 Share
        </button>
      )}
      
      {showCopiedMessage && (
        <div className={styles.copiedMessage}>
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default ShareButton;