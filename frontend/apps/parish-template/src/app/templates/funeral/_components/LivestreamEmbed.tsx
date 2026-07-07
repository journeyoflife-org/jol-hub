'use client';

import { useState } from 'react';
import { Button, Input } from '@jol-hub/ui';
import { Video, Lock, Play } from 'lucide-react';
import type { Obituary } from '../page';

interface LivestreamEmbedProps {
  obituaries: Obituary[];
}

export function LivestreamEmbed({ obituaries }: LivestreamEmbedProps) {
  const [selectedStream, setSelectedStream] = useState<Obituary | null>(null);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const streamsAvailable = obituaries.filter((o) => o.hasStream && o.streamUrl);

  if (streamsAvailable.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-8 text-center">
        <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No live streams currently available.</p>
        <p className="text-gray-500 text-sm mt-2">Check back later or contact us for more information.</p>
      </div>
    );
  }

  const handleUnlock = () => {
    if (selectedStream && password === selectedStream.streamPassword) {
      setIsUnlocked(true);
    }
  };

  if (selectedStream && isUnlocked) {
    // Extract YouTube video ID
    const videoId = selectedStream.streamUrl?.includes('youtube.com')
      ? selectedStream.streamUrl.split('v=')[1]?.split('&')[0]
      : null;

    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Unable to load stream</p>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Stream for {selectedStream.firstName} {selectedStream.lastName}
        </p>
      </div>
    );
  }

  if (selectedStream && !isUnlocked) {
    return (
      <div className="bg-gray-50 border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3 text-gray-700">
          <Lock className="h-5 w-5" />
          <p>Enter password to view stream</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <Button onClick={handleUnlock}>Unlock</Button>
        </div>
        <Button variant="ghost" onClick={() => setSelectedStream(null)}>
          ← Back to streams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {streamsAvailable.map((obit) => (
        <div
          key={obit.id}
          className="bg-white border rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="font-medium">{obit.firstName} {obit.lastName}</p>
            <p className="text-sm text-gray-500">
              Funeral: {obit.funeralDate} at {obit.funeralTime}
            </p>
          </div>
          <Button onClick={() => setSelectedStream(obit)}>
            <Play className="h-4 w-4 mr-2" />
            Watch
          </Button>
        </div>
      ))}
    </div>
  );
}
