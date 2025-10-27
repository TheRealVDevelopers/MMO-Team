
import React, { useMemo } from 'react';
import Card from '../../shared/Card';
import { PROJECTS, formatDate } from '../../../constants';
import { DocumentTextIcon, PaperClipIcon, PlusIcon, ArrowLeftIcon } from '../../icons/IconComponents';
import { useAuth } from '../../../context/AuthContext';

const DocumentsPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();

    const myProjectsWithDocs = useMemo(() => {
        if (!currentUser) return [];
        return PROJECTS.filter(p => p.salespersonId === currentUser.id && p.documents && p.documents.length > 0);
    }, [currentUser]);

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return '📄';
            case 'docx': return '📝';
            case 'jpg': return '🖼️';
            case 'zip': return '📦';
            default: return '📎';
        }
    }

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentPage('overview')}
                        className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <h2 className="text-2xl font-bold text-text-primary">My Documents</h2>
                </div>
                <button className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 mt-2 sm:mt-0">
                    <PlusIcon className="w-4 h-4" />
                    <span>Upload Document</span>
                </button>
            </div>

            <div className="space-y-4">
                {myProjectsWithDocs.map(project => (
                    <Card key={project.id}>
                        <h3 className="text-lg font-bold text-text-primary flex items-center">
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            {project.projectName}
                        </h3>
                        <p className="text-sm text-text-secondary">{project.clientName}</p>
                        <ul className="mt-4 divide-y divide-border">
                            {project.documents?.map(doc => (
                                <li key={doc.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center">
                                        <span className="text-xl mr-3">{getFileIcon(doc.type)}</span>
                                        <div>
                                            <a href={doc.url} className="text-sm font-medium text-primary hover:underline">{doc.name}</a>
                                            <p className="text-xs text-text-secondary">Uploaded: {formatDate(doc.uploaded)}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-text-secondary">{doc.size}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                ))}
                {myProjectsWithDocs.length === 0 && (
                    <Card className="text-center py-12">
                         <PaperClipIcon className="w-10 h-10 mx-auto text-text-secondary/50" />
                        <p className="mt-4 text-text-secondary">No documents found for your projects.</p>
                        <p className="text-sm text-text-secondary/70">Click 'Upload Document' to get started.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DocumentsPage;