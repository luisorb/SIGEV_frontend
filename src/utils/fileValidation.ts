export const MAX_DOCUMENT_MB = 10
export const MAX_VIDEO_MB = 100

const MB = 1024 * 1024
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi']

export class FileValidationError extends Error {}

export function attachmentFileError(file: File): string | null {
  const dotIndex = file.name.lastIndexOf('.')
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ''
  const isVideo = (VIDEO_EXTENSIONS as readonly string[]).includes(ext)
  const maxMb = isVideo ? MAX_VIDEO_MB : MAX_DOCUMENT_MB
  if (file.size > maxMb * MB) {
    const kind = isVideo ? 'videos' : 'documentos e imágenes'
    return `"${file.name}" supera el peso máximo permitido para ${kind} (${maxMb} MB)`
  }
  return null
}

export function assertFileSize(file: File): void {
  const error = attachmentFileError(file)
  if (error) throw new FileValidationError(error)
}
