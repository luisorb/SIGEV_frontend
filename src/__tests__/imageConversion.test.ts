import { describe, it, expect, afterEach, vi } from 'vitest'
import { convertToWebp } from '../utils/imageConversion'

function makeFile(name: string, type: string): File {
  return new File(['contenido'], name, { type })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('convertToWebp', () => {
  it('devuelve el archivo original si no es JPEG o PNG', async () => {
    const pdf = makeFile('documento.pdf', 'application/pdf')
    const result = await convertToWebp(pdf)
    expect(result).toBe(pdf)
  })

  it('devuelve el archivo original si createImageBitmap falla', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('no soportado')))
    const png = makeFile('foto.png', 'image/png')
    const result = await convertToWebp(png)
    expect(result).toBe(png)
  })

  it('devuelve el archivo original si el navegador no codifica WebP', async () => {
    const bitmap = { width: 100, height: 100, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap))
    const canvasMock = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' })),
    }
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? canvasMock : originalCreateElement(tag)) as typeof document.createElement)

    const jpg = makeFile('foto.jpg', 'image/jpeg')
    const result = await convertToWebp(jpg)
    expect(result).toBe(jpg)
    expect(bitmap.close).toHaveBeenCalled()
  })
})
