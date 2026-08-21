const WEBP_CONVERTIBLE_TYPES = ['image/jpeg', 'image/png']
const MAX_DIMENSION = 1920
const WEBP_QUALITY = 0.8

export async function convertToWebp(file: File): Promise<File> {
  if (!WEBP_CONVERTIBLE_TYPES.includes(file.type)) return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    )
    if (!blob || blob.type !== 'image/webp') return file
    if (blob.size >= file.size && scale === 1) return file

    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}
