import React from 'react';
import { DocumentTextIcon, FolderIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ArchivedDocument {
    id: string;
    name: string;
    category: 'Invoice' | 'Warranty' | 'Contract' | 'Report' | 'Drawing' | 'Other';
    date: Date;
    size: string;
    url: string;
}

const DocumentsArchive: React.FC<{ documents: ArchivedDocument[] }> = ({ documents }) => {
    // Group by category
    const groupedDocs = documents.reduce((acc, doc) => {
        if (!acc[doc.category]) acc[doc.category] = [];
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<string, ArchivedDocument[]>);

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <FolderIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Document Archive</h3>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No documents archived yet.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedDocs).map(([category, docs]) => (
                        <div key={category}>
                            <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 pl-2">{category}s</h4>
                            <div className="space-y-2">
                                {docs.map((doc) => (
                                    <div key={doc.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <DocumentTextIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{doc.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" />
                                                        {doc.date.toLocaleDateString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{doc.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-300 hover:text-primary transition-colors"
                                            title="Download Document"
                                        >
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentsArchive;
