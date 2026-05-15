import { useState, useRef, useCallback } from 'react'
import { uploadAPI } from '../utils/api'
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react'

export default function ImageUpload({ value, onChange }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const upload = async (file) => {
    if (!file) return
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setError('Only JPG, PNG, or WebP images allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }
    setError('')
    setUploading(true)
    try {
      const res = await uploadAPI.image(file)
      onChange(res.data.url)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onFileChange = (e) => { const file = e.target.files?.[0]; if (file) upload(file) }

  return (
    <div>
      {value ? (
        /* Preview */
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card2)' }}>
          <img
            src={value}
            alt="Product"
            style={{ width: '100%', height: 180, objectFit: 'contain', display: 'block', padding: 8 }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
              padding: '4px 10px', fontSize: 11, color: '#fff', cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-blue, #3b82f6)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '32px 20px',
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            background: dragging ? 'rgba(59,130,246,0.05)' : 'var(--bg-card2)',
            transition: 'all 0.15s',
          }}
        >
          {uploading ? (
            <>
              <Loader2 size={28} style={{ animation: 'spin 0.7s linear infinite', color: 'var(--text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploading...</div>
            </>
          ) : (
            <>
              <ImagePlus size={28} style={{ color: dragging ? '#3b82f6' : 'var(--text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: dragging ? '#3b82f6' : 'var(--text-secondary)' }}>
                {dragging ? 'Drop image here' : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, WebP · Max 5MB</div>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'var(--accent-red)' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }} onChange={onFileChange} />
    </div>
  )
}