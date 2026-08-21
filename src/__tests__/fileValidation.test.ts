import { describe, it, expect } from 'vitest'
import { attachmentFileError, assertFileSize, FileValidationError, MAX_DOCUMENT_MB, MAX_VIDEO_MB } from '../utils/fileValidation'

const MB = 1024 * 1024

function makeFile(name: string, sizeBytes: number): File {
  const file = new File(['x'], name)
  Object.defineProperty(file, 'size', { value: sizeBytes })
  return file
}

describe('attachmentFileError', () => {
  it('acepta un documento dentro del límite', () => {
    expect(attachmentFileError(makeFile('doc.pdf', 5 * MB))).toBeNull()
  })

  it('rechaza un documento que supera 10 MB', () => {
    const error = attachmentFileError(makeFile('doc.pdf', (MAX_DOCUMENT_MB + 1) * MB))
    expect(error).toContain('documentos e imágenes')
    expect(error).toContain('10 MB')
  })

  it('rechaza una imagen que supera 10 MB', () => {
    expect(attachmentFileError(makeFile('foto.jpg', 11 * MB))).toContain('documentos e imágenes')
  })

  it('acepta un video de 60 MB', () => {
    expect(attachmentFileError(makeFile('video.mp4', 60 * MB))).toBeNull()
  })

  it('rechaza un video que supera 100 MB', () => {
    const error = attachmentFileError(makeFile('video.mp4', (MAX_VIDEO_MB + 1) * MB))
    expect(error).toContain('videos')
    expect(error).toContain('100 MB')
  })

  it('trata archivos sin extensión como documento', () => {
    expect(attachmentFileError(makeFile('archivo', 11 * MB))).toContain('documentos e imágenes')
  })

  it('assertFileSize lanza FileValidationError con el mensaje', () => {
    expect(() => assertFileSize(makeFile('video.mov', 150 * MB))).toThrow(FileValidationError)
  })
})
