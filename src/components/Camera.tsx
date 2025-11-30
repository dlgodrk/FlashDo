import { useState, useRef } from 'react';
import { Camera as CameraIcon, X, RotateCcw, Check, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadMedia, getFileSizeMB } from '../utils/upload';
import { supabase } from '../lib/supabase';

type Props = {
  routineId: string;
  onComplete: () => void;
  onCancel: () => void;
};

export function Camera({ routineId, onComplete, onCancel }: Props) {
  const { certifyRoutine } = useApp();
  const [captured, setCaptured] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      const sizeMB = getFileSizeMB(file);
      if (sizeMB > 50) {
        alert('파일 크기가 50MB를 초과합니다.');
        return;
      }

      // Determine media type
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');

      // Create preview URL
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaFile(file);
      setCaptured(true);
    }
  };

  const handleRetake = () => {
    setCaptured(false);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
    setMediaFile(null);
    setText('');
  };

  const handleSubmit = async () => {
    if (!mediaFile || !mediaUrl) return;

    setUploading(true);
    try {
      // Upload media to Supabase Storage
      const result = await uploadMedia(mediaFile, routineId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Save verification to database
      const { error: dbError } = await supabase
        .from('verifications')
        .insert({
          routine_id: routineId,
          user_id: user.id,
          media_url: result.url,
          media_type: result.mediaType,
          is_late: false,
          expires_at: result.expiresAt.toISOString(),
        });

      if (dbError) throw dbError;

      // Also update local storage for backward compatibility
      certifyRoutine(routineId, result.url, text || undefined);

      onComplete();
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  if (!captured) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/mov,video/webm"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Mock camera view */}
        <div className="relative w-full h-full flex items-center justify-center bg-neutral-900">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-neutral-800 flex items-center justify-center">
              <CameraIcon className="w-16 h-16 text-neutral-600" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">카메라 준비 중...</p>
            <p className="text-neutral-400 text-sm">
              실제 앱에서는 카메라가 활성화됩니다
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button
              onClick={onCancel}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/30 shadow-lg transition-transform active:scale-90"
            />

            <div className="w-14 h-14" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Media Preview */}
      <div className="flex-1 relative">
        {mediaUrl ? (
          mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-cover"
              autoPlay
              loop
            />
          ) : (
            <img
              src={mediaUrl}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <p className="text-white">미디어를 불러오는 중...</p>
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-semibold">업로드 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* Text Input */}
      <div className="bg-neutral-900 px-6 py-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="한 마디 남기기 (선택)"
          className="w-full px-4 py-3 bg-neutral-800 text-white placeholder-neutral-500 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
          rows={2}
          maxLength={100}
        />
        <p className="text-neutral-500 text-xs mt-2 text-right">
          {text.length}/100
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-neutral-900 px-6 pb-8 pt-4">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={handleRetake}
            disabled={uploading}
            className="flex-1 py-4 bg-neutral-800 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5" />
            다시 찍기
          </button>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 py-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                업로드 중
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                인증 완료
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
