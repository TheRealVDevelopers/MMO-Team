import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../firebase';

export interface UploadResult {
  url: string;
  fullPath: string;
  name: string;
  sizeBytes: number;
  contentType?: string;
}

export async function uploadToStorage(params: {
  path: string; // full storage path including filename
  file: File;
  onProgress?: (pct: number) => void;
}): Promise<UploadResult> {
  const { path, file, onProgress } = params;
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (!onProgress) return;
        const pct = snap.totalBytes > 0 ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
        onProgress(pct);
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  const url = await getDownloadURL(task.snapshot.ref);
  return {
    url,
    fullPath: task.snapshot.ref.fullPath,
    name: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  };
}


