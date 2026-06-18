export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function validateFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return "Yalnız JPG, PNG, WEBP veya PDF yükleyebilirsin.";
  if (file.size > MAX_FILE_BYTES) return "Dosya 5MB'tan büyük olamaz.";
  return null;
}

export function uploadPath(userId: string, taskId: string, fileName: string, stamp: number): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${taskId}/${stamp}-${safe}`;
}
