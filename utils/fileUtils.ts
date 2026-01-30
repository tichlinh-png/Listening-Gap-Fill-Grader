import { FileData } from '../types';

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const processFile = async (file: File): Promise<FileData> => {
  const base64 = await readFileAsBase64(file);
  const previewUrl = URL.createObjectURL(file);
  
  return {
    file,
    previewUrl,
    base64,
    mimeType: file.type
  };
};
