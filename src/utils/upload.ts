import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/webm'];

export type MediaType = 'image' | 'video';

export interface UploadResult {
  url: string;
  mediaType: MediaType;
  expiresAt: Date;
}

export async function uploadMedia(file: File, routineId: string): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기가 50MB를 초과합니다.');
  }

  // Validate file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error('지원하지 않는 파일 형식입니다.');
  }

  const mediaType: MediaType = isImage ? 'image' : 'video';

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('로그인이 필요합니다.');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${routineId}_${timestamp}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('verifications')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error('파일 업로드에 실패했습니다.');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('verifications')
    .getPublicUrl(fileName);

  // Calculate expiration time (12 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12);

  return {
    url: publicUrl,
    mediaType,
    expiresAt,
  };
}

export async function deleteMedia(url: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.indexOf('verifications');
    if (bucketIndex === -1) return;

    const filePath = urlParts.slice(bucketIndex + 1).join('/');

    // Delete from storage
    const { error } = await supabase.storage
      .from('verifications')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
    }
  } catch (error) {
    console.error('Error deleting media:', error);
  }
}

export function isImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type);
}

export function isVideoFile(file: File): boolean {
  return ALLOWED_VIDEO_TYPES.includes(file.type);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function getFileSizeMB(file: File): number {
  return Math.round((file.size / (1024 * 1024)) * 100) / 100;
}
