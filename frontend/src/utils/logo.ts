// Loads a company logo (data URI or remote URL) into a format jsPDF can embed synchronously.
export async function loadLogoImage(src?: string | null): Promise<{ dataUri: string; format: 'PNG' | 'JPEG' } | null> {
  if (!src) return null;
  if (src.startsWith('data:')) {
    const format: 'PNG' | 'JPEG' = src.includes('image/png') ? 'PNG' : 'JPEG';
    return { dataUri: src, format };
  }
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: 'PNG' | 'JPEG' = blob.type.includes('png') ? 'PNG' : 'JPEG';
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return { dataUri, format };
  } catch {
    return null;
  }
}
