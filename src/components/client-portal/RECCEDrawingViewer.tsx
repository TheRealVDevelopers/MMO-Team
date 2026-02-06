import React, { useState } from 'react';
import { DocumentArrowDownIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

interface RECCEDrawingViewerProps {
    drawingUrl: string;
    drawingName: string;
    uploadedAt: Date;
    deadline: Date;
    status: 'Pending' | 'Approved' | 'Revision Requested';
    onApprove: () => void;
    onRequestRevision: (comments: string) => void;
}

const RECCEDrawingViewer: React.FC<RECCEDrawingViewerProps> = ({
    drawingUrl,
    drawingName,
    uploadedAt,
    deadline,
    status,
    onApprove,
    onRequestRevision
}) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [comments, setComments] = useState('');

    const handleReject = () => {
        onRequestRevision(comments);
        setIsRejecting(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">RECCE Drawing</h3>
                    <p className="text-sm text-gray-500">Site measurement and initial layout plan</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === 'Approved' ? 'bg-green-100 text-green-700' :
                        status === 'Revision Requested' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                    }`}>
                    {status}
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                        <DocumentArrowDownIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">{drawingName}</p>
                        <p className="text-xs text-gray-500">Uploaded {uploadedAt.toLocaleDateString()}</p>
                    </div>
                    <a href={drawingUrl} download className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <DocumentArrowDownIcon className="w-5 h-5" />
                    </a>
                    <a href={drawingUrl} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-primary transition-colors">
                        <EyeIcon className="w-5 h-5" />
                    </a>
                </div>

                {status === 'Pending' && (
                    <div className="space-y-4">
                        {!isRejecting ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={onApprove}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Approve Drawing
                                </button>
                                <button
                                    onClick={() => setIsRejecting(true)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                    Request Changes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 animation-fade-in">
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    placeholder="Please describe the changes you need..."
                                    rows={3}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                />
                                <div className="flex items-center gap-3 justify-end">
                                    <button
                                        onClick={() => setIsRejecting(false)}
                                        className="text-gray-500 text-sm font-medium hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={!comments.trim()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        Submit Request
                                    </button>
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-center text-gray-400">
                            Auto-approval deadline: {deadline.toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RECCEDrawingViewer;
