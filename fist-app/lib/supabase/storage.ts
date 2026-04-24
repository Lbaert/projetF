import { createClient } from './client'

const BUCKET_NAME = 'clips'

export async function uploadFile(
  file: File,
  folder: string = 'uploads'
): Promise<string | null> {
  const supabase = createClient()

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${folder}/${timestamp}_${sanitizedName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  return getPublicUrl(filePath)
}

export function getPublicUrl(filePath: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteFile(filePath: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    return false
  }

  return true
}

export async function downloadFile(filePath: string): Promise<Blob | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath)

  if (error) {
    console.error('Download error:', error)
    return null
  }

  return data
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024

export function isFileTooLarge(file: File): boolean {
  return file.size > MAX_FILE_SIZE
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}