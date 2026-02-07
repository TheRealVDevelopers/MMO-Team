import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case, CaseStatus, UserRole } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
}

interface JMSDocument {
  id: string;
  caseId: string;
  documentUrl: string;
  signedBy?: string;
  signedAt?: any;
  status: 'pending' | 'signed';
  uploadedBy: string;
  uploadedAt: any;
  notes?: string;
}

const ExecutionJMS: React.FC<Props> = ({ caseId }) => {
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [jmsDocuments, setJmsDocuments] = useState<JMSDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    // Fetch case data
    const fetchCase = async () => {
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      const caseSnap = await getDoc(caseRef);
      if (caseSnap.exists()) {
        setCaseData(caseSnap.data() as Case);
      }
    };
    fetchCase();

    // Fetch JMS documents
    const jmsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS);
    const q = query(jmsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedJMS = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as JMSDocument[];
      setJmsDocuments(fetchedJMS);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching JMS documents:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleUploadJMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !currentUser) return;

    setUploading(true);
    try {
      const jmsRef = collection(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS);
      await addDoc(jmsRef, {
        caseId,
        documentUrl,
        status: 'pending',
        uploadedBy: currentUser.id,
        uploadedAt: serverTimestamp(),
        notes: notes || null
      });

      setDocumentUrl('');
      setNotes('');
      setShowUploadForm(false);
      
      alert('JMS document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading JMS:', error);
      alert('Failed to upload JMS document.');
    } finally {
      setUploading(false);
    }
  };

  const handleSignJMS = async (jmsId: string) => {
    if (!caseId || !currentUser) return;

    const confirmed = window.confirm('Are you sure you want to sign this JMS document? This will mark the project as COMPLETED.');
    if (!confirmed) return;

    try {
      // Update JMS document
      const jmsRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId, FIRESTORE_COLLECTIONS.JMS, jmsId);
      await updateDoc(jmsRef, {
        status: 'signed',
        signedBy: currentUser.id,
        signedAt: serverTimestamp()
      });

      // Update Case closure and status
      const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
      await updateDoc(caseRef, {
        closure: {
          jmsSigned: true,
          completedAt: serverTimestamp(),
          completedBy: currentUser.id
        },
        status: CaseStatus.COMPLETED,
        updatedAt: serverTimestamp()
      });

      alert('JMS signed successfully! Project marked as COMPLETED.');
    } catch (error) {
      console.error('Error signing JMS:', error);
      alert('Failed to sign JMS.');
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

  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN;
  const isCompleted = caseData?.closure?.jmsSigned || false;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Management Sheet (JMS)</h1>
        {!isCompleted && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {showUploadForm ? 'Cancel' : '+ Upload JMS'}
          </button>
        )}
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <h2 className="text-xl font-semibold text-green-800">Project Completed</h2>
              <p className="text-sm text-green-700 mt-1">
                JMS signed on {caseData?.closure?.completedAt instanceof Date ? caseData.closure.completedAt.toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && !isCompleted && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload JMS Document</h2>
          <p className="text-sm text-text-secondary mb-4">
            Upload the final Job Management Sheet for client sign-off.
          </p>
          
          <form onSubmit={handleUploadJMS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Document URL *</label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="https://..."
                required
              />
              <p className="text-xs text-text-secondary mt-1">
                Note: File upload to storage is not implemented. Provide direct URL.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload JMS'}
            </button>
          </form>
        </div>
      )}

      {/* JMS Documents List */}
      {loading ? (
        <div className="text-center py-12"><p>Loading JMS documents...</p></div>
      ) : jmsDocuments.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary">No JMS documents uploaded yet.</p>
          <p className="text-xs text-text-secondary mt-2">Upload the final JMS for project sign-off.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jmsDocuments.map((jms) => (
            <div key={jms.id} className="bg-surface border border-border rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📋</span>
                    <h3 className="text-lg font-semibold">JMS Document</h3>
                    {jms.status === 'signed' ? (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">✓ Signed</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">Pending Signature</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-text-secondary">
                    Uploaded: {jms.uploadedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                  </p>
                  
                  {jms.status === 'signed' && (
                    <p className="text-sm text-green-600 mt-1">
                      Signed: {jms.signedAt?.toDate?.().toLocaleDateString() || 'N/A'}
                    </p>
                  )}
                  
                  {jms.notes && (
                    <p className="text-sm text-text-secondary mt-2">{jms.notes}</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <a
                    href={jms.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Document
                  </a>
                  
                  {isAdmin && jms.status === 'pending' && (
                    <button
                      onClick={() => handleSignJMS(jms.id)}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Sign JMS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Summary (if completed) */}
      {isCompleted && caseData && (
        <div className="bg-surface border border-border rounded-xl p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Project Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">Project Name</p>
              <p className="font-semibold">{caseData.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Status</p>
              <p className="font-semibold text-green-600">COMPLETED</p>
            </div>
            {caseData.costCenter && (
              <>
                <div>
                  <p className="text-sm text-text-secondary">Total Budget</p>
                  <p className="font-semibold">₹{caseData.costCenter.totalBudget.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Spent</p>
                  <p className="font-semibold">₹{caseData.costCenter.spentAmount.toLocaleString()}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm text-text-secondary">Completed On</p>
              <p className="font-semibold">
                {caseData.closure?.completedAt instanceof Date ? caseData.closure.completedAt.toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionJMS;
