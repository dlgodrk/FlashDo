import { useState, useRef } from 'react';
import { Camera as CameraIcon, X, RotateCcw, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Props = {
  routineId: string;
  onComplete: () => void;
  onCancel: () => void;
};

export function Camera({ routineId, onComplete, onCancel }: Props) {
  const { certifyRoutine } = useApp();
  const [captured, setCaptured] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setCaptured(true);
    }
  };

  const handleRetake = () => {
    setCaptured(false);
    setImageUrl(null);
    setText('');
  };

  const handleSubmit = () => {
    if (imageUrl) {
      certifyRoutine(routineId, imageUrl, text || undefined);
      onComplete();
    }
  };

  if (!captured) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
      {/* Image Preview */}
      <div className="flex-1 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
            <p className="text-white">이미지를 불러오는 중...</p>
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
            className="flex-1 py-4 bg-neutral-800 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold"
          >
            <RotateCcw className="w-5 h-5" />
            다시 찍기
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 py-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-2xl flex items-center justify-center gap-2 font-semibold"
          >
            <Check className="w-5 h-5" />
            인증 완료
          </button>
        </div>
      </div>
    </div>
  );
}
