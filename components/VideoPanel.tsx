import React, { useRef, useEffect } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { ConversationStatus } from '../types';

interface VideoPanelProps {
  stream: MediaStream | null;
  status: ConversationStatus;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ stream, status }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const isVideoActive = stream && (status === 'connected' || status === 'connecting');

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col gap-4">
      <h4 className="text-md font-semibold text-cyan-300 flex items-center gap-2">
        <Video size={18} />
        <span>Video Akışı</span>
      </h4>
      <div className="aspect-video bg-gray-900/70 rounded-md border border-gray-600 overflow-hidden flex items-center justify-center">
        {isVideoActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror the video for a natural feel
          />
        ) : (
          <div className="text-center text-gray-500 p-4">
            <VideoOff size={48} className="mx-auto" />
            <p className="mt-2 text-sm">Canlı konuşma başlatıldığında video akışı burada görünecektir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPanel;
