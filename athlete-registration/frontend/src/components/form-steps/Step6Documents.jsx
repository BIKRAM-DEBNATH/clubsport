import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import api from '../../utils/api';

const DOC_FIELDS = [
  { key: 'photo', label: 'Passport Photo', required: true, accept: 'image/*', hint: 'JPG/PNG, max 1MB', icon: '🖼️' },
  { key: 'aadhaar', label: 'Aadhaar Card', required: true, accept: '.pdf,image/*', hint: 'PDF/JPG/PNG, max 2MB', icon: '🪪' },
  { key: 'birthCertificate', label: 'Birth Certificate', required: true, accept: '.pdf,image/*', hint: 'PDF/JPG/PNG, max 2MB', icon: '📜' },
  { key: 'addressProof', label: 'Address Proof', required: false, accept: '.pdf,image/*', hint: 'PDF/JPG/PNG, max 2MB', icon: '🏠' },
  { key: 'clubLetter', label: 'Club Authorization Letter', required: false, accept: '.pdf,image/*', hint: 'PDF/JPG/PNG, max 2MB', icon: '📋' },
  { key: 'parentConsent', label: 'Parent Consent Form', required: false, accept: '.pdf,image/*', hint: 'PDF/JPG/PNG, max 2MB (required if under 18)', icon: '✍️' },
];

export default function Step6Documents({ formData, update, errors, isMinor, athleteId }) {
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploaded, setUploaded] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});
  const fileRefs = useRef({});

  async function handleFile(fieldKey, file) {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    // Validate type
    if (!isImage && !isPdf) {
      setUploadErrors(prev => ({ ...prev, [fieldKey]: 'Only images or PDF allowed' }));
      return;
    }

    // Validate size
    const maxSize = fieldKey === 'photo' ? 1 : 2;
    let processedFile = file;

    if (isImage) {
      if (file.size > maxSize * 1024 * 1024) {
        // Compress image
        try {
          processedFile = await imageCompression(file, { maxSizeMB: maxSize, maxWidthOrHeight: 1024, useWebWorker: true });
        } catch { processedFile = file; }
      }
      // Generate preview
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => ({ ...prev, [fieldKey]: e.target.result }));
      reader.readAsDataURL(processedFile);
    } else {
      setPreviews(prev => ({ ...prev, [fieldKey]: 'pdf' }));
    }

    if (processedFile.size > maxSize * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [fieldKey]: `File too large. Max ${maxSize}MB` }));
      return;
    }

    setUploadErrors(prev => ({ ...prev, [fieldKey]: null }));
    setFiles(prev => ({ ...prev, [fieldKey]: processedFile }));
    update({ [`doc_${fieldKey}`]: processedFile.name });
  }

  function removeFile(fieldKey) {
    setFiles(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
    setPreviews(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
    setUploaded(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
    update({ [`doc_${fieldKey}`]: null });
  }

  async function uploadAll() {
    if (!athleteId || Object.keys(files).length === 0) return;
    const formDataObj = new FormData();
    Object.entries(files).forEach(([key, file]) => formDataObj.append(key, file));

    setUploading({ all: true });
    try {
      await api.post(`/athlete/upload-documents/${athleteId}`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUploaded = {};
      Object.keys(files).forEach(k => newUploaded[k] = true);
      setUploaded(newUploaded);
    } catch (err) {
      setUploadErrors(prev => ({ ...prev, all: err.response?.data?.message || 'Upload failed' }));
    } finally {
      setUploading({});
    }
  }

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        📁 Upload your documents below. Photos are compressed automatically. Max: Photo 1MB, Others 2MB.
        {!athleteId && ' Documents will be uploaded after registration is submitted.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {DOC_FIELDS.map(field => {
          const hasFile = !!files[field.key];
          const isUploaded = !!uploaded[field.key];
          const isDragging = dragOver === field.key;
          const preview = previews[field.key];

          return (
            <div key={field.key}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent)' : hasFile ? 'var(--accent2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: 16,
                background: isDragging ? 'rgba(0,200,255,0.05)' : hasFile ? 'rgba(0,136,255,0.05)' : 'var(--bg2)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                position: 'relative',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(field.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => { e.preventDefault(); setDragOver(null); handleFile(field.key, e.dataTransfer.files[0]); }}
              onClick={() => !hasFile && fileRefs.current[field.key]?.click()}
            >
              <input type="file" ref={el => fileRefs.current[field.key] = el} accept={field.accept}
                style={{ display: 'none' }} onChange={e => handleFile(field.key, e.target.files[0])} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{field.icon}</span>
                {isUploaded && <span style={{ color: 'var(--green)', fontSize: 18 }}>✅</span>}
                {field.required && !hasFile && <span style={{ color: 'var(--red)', fontSize: 10, fontWeight: 700 }}>REQUIRED</span>}
              </div>

              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, marginBottom: 4 }}>{field.label}</p>
              <p style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 10 }}>{field.hint}</p>

              {preview ? (
                <div>
                  {preview === 'pdf' ? (
                    <div style={{ background: 'var(--card)', borderRadius: 8, padding: '12px', textAlign: 'center', color: 'var(--accent)', fontSize: 13 }}>
                      📄 PDF Selected
                    </div>
                  ) : (
                    <img src={preview} alt="preview" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                  )}
                  <button className="btn-danger btn-sm" style={{ marginTop: 8, width: '100%' }}
                    onClick={e => { e.stopPropagation(); removeFile(field.key); }}>
                    🗑️ Remove
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>⬆️</div>
                  Drop file here or click to browse
                </div>
              )}

              {uploadErrors[field.key] && <p className="error-msg">{uploadErrors[field.key]}</p>}
            </div>
          );
        })}
      </div>

      {athleteId && Object.keys(files).length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {uploadErrors.all && <p className="error-msg" style={{ marginBottom: 8 }}>{uploadErrors.all}</p>}
          <button className="btn-primary" onClick={uploadAll} disabled={uploading.all}>
            {uploading.all ? <span className="loader" /> : `⬆️ Upload ${Object.keys(files).length} Document(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
