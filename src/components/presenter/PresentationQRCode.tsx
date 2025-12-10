'use client';

import { useMemo, useState } from 'react';
import useGameStore from '@/store/gameStore';
import { Copy, Check } from 'lucide-react';

export default function PresentationQRCode() {
  const currentRoom = useGameStore((state) => state.currentRoom);
  const [copied, setCopied] = useState(false);

  const joinUrl = useMemo(() => {
    if (!currentRoom) return '';
    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000';
    return `${baseUrl}/player/join?room=${currentRoom.joinCode}`;
  }, [currentRoom]);

  const qrCodeUrl = useMemo(() => {
    if (!joinUrl) return '';
    // Generate QR code using free API service
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(joinUrl)}`;
  }, [joinUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-center text-xl font-bold text-gray-800 mb-4">
        Room Join Information
      </h3>

      <div className="flex flex-col items-center gap-4">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code for room join"
              className="w-64 h-64"
            />
          )}
        </div>

        {/* Join Link */}
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Join Link:
          </p>
          <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
            <input
              type="text"
              value={joinUrl}
              readOnly
              className="flex-1 bg-transparent font-mono text-sm text-gray-700 outline-none overflow-x-auto"
            />
            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Room Code */}
        <div className="w-full max-w-md bg-blue-50 p-4 rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">
            Room Code (Manual Entry):
          </p>
          <p className="text-2xl font-bold text-blue-600 text-center">
            {currentRoom.joinCode}
          </p>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-600 text-center max-w-md">
          Players can scan the QR code or enter the room code manually to join.
          The join link can also be shared directly.
        </p>
      </div>
    </div>
  );
}
