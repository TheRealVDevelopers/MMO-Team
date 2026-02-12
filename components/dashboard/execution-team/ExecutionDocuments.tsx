import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCaseDocuments } from '../../../hooks/useCaseDocuments';
import { DocumentType, CaseStatus } from '../../../types';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { isCaseCompleted } from '../../../services/executionStatusService';

interface Props {
  caseId: string | null;
  caseStatus?: CaseStatus;
}

const ExecutionDocuments: React.FC<Props> = ({ caseId, caseStatus }) => {
  const { currentUser } = useAuth();
  const { documents, loading, uploadDocument } = useCaseDocuments({ 
    caseId: caseId || ''
  });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const isCompleted = caseStatus ? isCaseCompleted(caseStatus) : false;
  const [uploading, setUploading] = useState(false);
  
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [docType, setDocType] = useState<DocumentType>(DocumentType.PDF);
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !currentUser) return;

    setUploading(true);
    try {
      await uploadDocument({
        caseId,
        type: docType,
        fileName,
        fileUrl,
        uploadedBy: currentUser.id,
        notes: notes || undefined
      });

      setFileName('');
      setFileUrl('');
      setDocType(DocumentType.PDF);
      setNotes('');
      setShowUploadForm(false);
      
      alert('Document added successfully!');
    } catch (error) {
      console.error('Error adding document:', error);
      alert('Failed to add document.');
    } finally {
      setUploading(false);
    }
  };

  if (!caseId) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No project selected.</p>
        </div>
      </div>
    );
  }

  const getDocTypeIcon = (type: DocumentType) => {
    const icons: any = {
      [DocumentType.PDF]: '📄',
      [DocumentType.IMAGE]: '🖼️',
      [DocumentType.TWO_D]: '📐',
      [DocumentType.THREE_D]: '🏗️',
      [DocumentType.BOQ]: '📊',
      [DocumentType.QUOTATION]: '💰',
      [DocumentType.RECCE]: '📷'
    };
    return icons[type] || '📁';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Documents</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          {showUploadForm ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Document</h2>
          <p className="text-sm text-text-secondary mb-4">
            Note: File upload to storage is not implemented. Please provide direct URLs.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">File Name *</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="e.g., Floor Plan - Ground Level.pdf"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File URL *</label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="https://..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Document Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value={DocumentType.PDF}>PDF</option>
                <option value={DocumentType.IMAGE}>Image</option>
                <option value={DocumentType.TWO_D}>2D Drawing</option>
                <option value={DocumentType.THREE_D}>3D Render</option>
                <option value={DocumentType.BOQ}>BOQ</option>
                <option value={DocumentType.QUOTATION}>Quotation</option>
                <option value={DocumentType.RECCE}>RECCE Photos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={2}
                placeholder="Additional notes about this document..."
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="text-center py-12"><p>Loading documents...</p></div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{getDocTypeIcon(doc.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{doc.fileName}</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {doc.type.toUpperCase().replace('_', ' ')}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Uploaded: {doc.uploadedAt instanceof Date ? doc.uploadedAt.toLocaleDateString() : 'N/A'}
                  </p>
                  {doc.notes && (
                    <p className="text-xs text-text-secondary mt-2">{doc.notes}</p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="text-xs px-3 py-1 border border-border rounded hover:bg-background"
                    >
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionDocuments;
