function getRequiredEnv(name) {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`[env] Missing required variable: ${name}`)
  }

  return value.trim()
}

export const API_BASE_URL = getRequiredEnv('VITE_API_BASE_URL')
export const CLOUDINARY_CLOUD_NAME = getRequiredEnv('VITE_CLOUDINARY_CLOUD_NAME')
export const CLOUDINARY_UPLOAD_PRESET = getRequiredEnv('VITE_CLOUDINARY_UPLOAD_PRESET')
