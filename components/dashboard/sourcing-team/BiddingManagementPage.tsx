import React, { useState, useEffect } from 'react';
import { MATERIAL_REQUESTS, PROJECTS, RFQS, formatDate } from '../../../constants';
import { MaterialRequest, MaterialRequestStatus, RFQ, RFQStatus } from '../../../types';
import { ClockIcon, FireIcon, ArrowLeftIcon, PlusIcon, XMarkIcon, ChartBarIcon } from '../../icons/IconComponents';
import Modal from '../../shared/Modal';
import ComparativeStatement from './ComparativeStatement';
import InitiateRFQModal from './InitiateRFQModal';
import SubmitQuoteModal from '../../shared/SubmitQuoteModal';
import { useToast } from '../../shared/toast/ToastProvider';

// --- Start: NewRequestModal Component ---

interface NewRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddRequest: (requestData: Omit<MaterialRequest, 'id' | 'status' | 'projectName'> & { projectId: string }) => void;
}

const NewRequestModal: React.FC<NewRequestModalProps> = ({ isOpen, onClose, onAddRequest }) => {
    const toast = useToast();
    const [projectId, setProjectId] = useState(PROJECTS[0]?.id || '');
    const [materials, setMaterials] = useState<{ name: string; spec: string }[]>([{ name: '', spec: '' }]);
    const [requiredBy, setRequiredBy] = useState('');
    const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

    const handleMaterialChange = (index: number, field: 'name' | 'spec', value: string) => {
        const newMaterials = [...materials];
        newMaterials[index][field] = value;
        setMaterials(newMaterials);
    };

    const addMaterial = () => {
        setMaterials([...materials, { name: '', spec: '' }]);
    };

    const removeMaterial = (index: number) => {
        if (materials.length > 1) {
            const newMaterials = materials.filter((_, i) => i !== index);
            setMaterials(newMaterials);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !requiredBy || materials.some(m => !m.name.trim())) {
            toast.error('Please fill all required fields.');
            return;
        }

        onAddRequest({
            projectId,
            materials,
            requiredBy: new Date(requiredBy),
            priority,
        });

        // Reset form
        setProjectId(PROJECTS[0]?.id || '');
        setMaterials([{ name: '', spec: '' }]);
        setRequiredBy('');
        setPriority('Medium');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Material Request" size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-text-primary">Project</label>
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="mt-1 block w-full p-2 border border-border rounded-md bg-surface"
                        required
                    >
                        {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.projectName} - {p.clientName}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Materials</label>
                    <div className="space-y-2">
                        {materials.map((material, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Material Name (e.g., LED Downlights)"
                                    value={material.name}
                                    onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                    className="flex-grow p-2 border border-border rounded-md bg-surface"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Specification (e.g., 4-inch, Warm White)"
                                    value={material.spec}
                                    onChange={(e) => handleMaterialChange(index, 'spec', e.target.value)}
                                    className="flex-grow p-2 border border-border rounded-md bg-surface"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(index)}
                                    className="p-2 text-error hover:bg-error/10 rounded-full disabled:opacity-50"
                                    disabled={materials.length <= 1}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="mt-2 flex items-center text-sm font-medium text-primary"
                    >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add another material
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary">Required By</label>
                        <input
                            type="date"
                            value={requiredBy}
                            onChange={(e) => setRequiredBy(e.target.value)}
                            className="mt-1 block w-full p-2 border border-border rounded-md bg-surface"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                            className="mt-1 block w-full p-2 border border-border rounded-md bg-surface"
                            required
                        >
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Create Request</button>
                </div>
            </form>
        </Modal>
    );
};
// --- End: NewRequestModal Component ---

// --- Start: EditRequestModal Component ---
interface EditRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: MaterialRequest | null;
    onUpdateRequest: (updatedRequest: MaterialRequest) => void;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ isOpen, onClose, request, onUpdateRequest }) => {
    const [editedRequestData, setEditedRequestData] = useState<MaterialRequest | null>(null);

    useEffect(() => {
        if (request) {
            setEditedRequestData(JSON.parse(JSON.stringify(request)));
        }
    }, [request]);

    if (!isOpen || !editedRequestData) return null;

    const handleMaterialChange = (index: number, field: 'name' | 'spec', value: string) => {
        const newMaterials = [...editedRequestData.materials];
        newMaterials[index][field] = value;
        setEditedRequestData({ ...editedRequestData, materials: newMaterials });
    };

    const addMaterial = () => {
        setEditedRequestData({
            ...editedRequestData,
            materials: [...editedRequestData.materials, { name: '', spec: '' }],
        });
    };

    const removeMaterial = (index: number) => {
        const newMaterials = editedRequestData.materials.filter((_, i) => i !== index);
        setEditedRequestData({ ...editedRequestData, materials: newMaterials });
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'requiredBy') {
            setEditedRequestData({ ...editedRequestData, requiredBy: new Date(value) });
        } else {
            setEditedRequestData({ ...editedRequestData, [name]: value as any });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateRequest(editedRequestData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Request: ${editedRequestData.projectName}`} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Materials</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {editedRequestData.materials.map((material, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Material Name"
                                    value={material.name}
                                    onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                    className="flex-grow p-2 border border-border rounded-md bg-surface"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Specification"
                                    value={material.spec}
                                    onChange={(e) => handleMaterialChange(index, 'spec', e.target.value)}
                                    className="flex-grow p-2 border border-border rounded-md bg-surface"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(index)}
                                    className="p-2 text-error hover:bg-error/10 rounded-full"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addMaterial}
                        className="mt-2 flex items-center text-sm font-medium text-primary"
                    >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Item
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary">Required By</label>
                        <input
                            type="date"
                            name="requiredBy"
                            value={new Date(editedRequestData.requiredBy).toISOString().split('T')[0]}
                            onChange={handleFieldChange}
                            className="mt-1 block w-full p-2 border border-border rounded-md bg-surface"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary">Priority</label>
                        <select
                            name="priority"
                            value={editedRequestData.priority}
                            onChange={handleFieldChange}
                            className="mt-1 block w-full p-2 border border-border rounded-md bg-surface"
                            required
                        >
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-surface border border-border rounded-md hover:bg-subtle-background">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-secondary">Save Changes</button>
                </div>
            </form>
        </Modal>
    );
};
// --- End: EditRequestModal Component ---

const KANBAN_COLUMNS: { id: string, title: string, statuses: MaterialRequestStatus[] }[] = [
    { id: 'rfq', title: 'RFQ Pending', statuses: [MaterialRequestStatus.RFQ_PENDING] },
    { id: 'bidding', title: 'Bidding Open', statuses: [MaterialRequestStatus.BIDDING_OPEN] },
    { id: 'evaluation', title: 'Under Evaluation', statuses: [MaterialRequestStatus.UNDER_EVALUATION, MaterialRequestStatus.NEGOTIATION] },
    { id: 'ordered', title: 'Order Placed', statuses: [MaterialRequestStatus.PO_READY, MaterialRequestStatus.ORDER_PLACED] },
    { id: 'delivered', title: 'Delivered', statuses: [MaterialRequestStatus.DELIVERED] },
];

const RequestCard: React.FC<{
    request: MaterialRequest;
    onStartBidding: (requestId: string) => void;
    onSelect: (request: MaterialRequest) => void;
    onCompare: (requestId: string) => void;
    onSubmitBid: (requestId: string) => void;
}> = ({ request, onStartBidding, onSelect, onCompare, onSubmitBid }) => {
    return (
        <div onClick={() => onSelect(request)} className="bg-surface p-3 rounded-xl border border-border space-y-3 cursor-pointer hover:shadow-lg transition-shadow hover:border-primary group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{request.projectName}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">{request.materials.map(m => m.name).join(', ')}</p>
                </div>
                {request.priority === 'High' && <FireIcon className="text-error w-4 h-4" />}
            </div>
            <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border pt-2 uppercase font-bold tracking-widest">
                <div className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>Due: {formatDate(request.requiredBy)}</span>
                </div>
            </div>

            {request.status === MaterialRequestStatus.RFQ_PENDING && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onStartBidding(request.id);
                    }}
                    className="w-full mt-2 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:shadow-lg transition-all"
                >
                    Initiate RFQ
                </button>
            )}

            {request.status === MaterialRequestStatus.BIDDING_OPEN && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSubmitBid(request.id);
                    }}
                    className="w-full mt-4 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:shadow-luxury transition-all"
                >
                    Submit Bid
                </button>
            )}

            {(request.status === MaterialRequestStatus.UNDER_EVALUATION || request.status === MaterialRequestStatus.NEGOTIATION) && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCompare(request.id);
                    }}
                    className="w-full mt-2 py-2 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                    <ChartBarIcon className="w-3 h-3" />
                    <span>Compare Bids</span>
                </button>
            )}
        </div>
    );
};

const BiddingManagementPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [materialRequests, setMaterialRequests] = useState(MATERIAL_REQUESTS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
    const [csRequestId, setCsRequestId] = useState<string | null>(null);
    const [rfqInitiateRequestId, setRfqInitiateRequestId] = useState<string | null>(null);
    const [submitBidRequestId, setSubmitBidRequestId] = useState<string | null>(null);
    const [rfqs, setRfqs] = useState(RFQS);

    const handleStartBidding = (requestId: string) => {
        setRfqInitiateRequestId(requestId);
    };

    const handleInitiateRFQ = (rfqData: Omit<RFQ, 'id' | 'rfqNumber' | 'createdDate'>) => {
        const newRfq: RFQ = {
            ...rfqData,
            id: `rfq-${Date.now()}`,
            rfqNumber: `RFQ-2024-${Math.floor(Math.random() * 1000)}`,
            createdDate: new Date(),
        };

        setRfqs(prev => [newRfq, ...prev]);
        setMaterialRequests(prev => prev.map(req =>
            req.id === rfqData.procurementRequestId
                ? { ...req, status: MaterialRequestStatus.BIDDING_OPEN }
                : req
        ));
        setRfqInitiateRequestId(null);
    };

    const handleAddNewRequest = (newRequestData: Omit<MaterialRequest, 'id' | 'status' | 'projectName'> & { projectId: string }) => {
        const project = PROJECTS.find(p => p.id === newRequestData.projectId);
        if (!project) return;

        const newRequest: MaterialRequest = {
            id: `mr-${Date.now()}`,
            status: MaterialRequestStatus.RFQ_PENDING,
            projectName: project.projectName,
            projectId: newRequestData.projectId,
            materials: newRequestData.materials,
            requiredBy: newRequestData.requiredBy,
            priority: newRequestData.priority,
        };
        setMaterialRequests(prev => [newRequest, ...prev]);
        setIsCreateModalOpen(false);
    };

    const handleUpdateRequest = (updatedRequest: MaterialRequest) => {
        setMaterialRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
        setSelectedRequest(null);
    };

    const handleAwardPO = (bidId: string) => {
        if (csRequestId) {
            setMaterialRequests(prev => prev.map(req =>
                req.id === csRequestId
                    ? { ...req, status: MaterialRequestStatus.PO_READY }
                    : req
            ));
            setCsRequestId(null);
        }
    };

    return (
        <>
            <div className="space-y-6 h-full flex flex-col">
                <div className="sm:flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentPage('overview')}
                            className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            <span>Back</span>
                        </button>
                        <h2 className="text-2xl font-serif font-bold text-text-primary uppercase tracking-tighter">Bidding Command Center</h2>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-luxury"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Create Material Request</span>
                    </button>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    {KANBAN_COLUMNS.map(column => (
                        <div key={column.id} className="bg-subtle-background/50 border border-border/50 rounded-2xl p-4 flex flex-col">
                            <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4 px-1">{column.title}</h3>
                            <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                                {materialRequests
                                    .filter(p => column.statuses.includes(p.status))
                                    .map(request => (
                                        <RequestCard
                                            key={request.id}
                                            request={request}
                                            onStartBidding={handleStartBidding}
                                            onSelect={setSelectedRequest}
                                            onCompare={(id) => setCsRequestId(id)}
                                            onSubmitBid={(id) => setSubmitBidRequestId(id)}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <NewRequestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onAddRequest={handleAddNewRequest}
            />
            <EditRequestModal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
                onUpdateRequest={handleUpdateRequest}
            />
            {csRequestId && (
                <ComparativeStatement
                    isOpen={!!csRequestId}
                    onClose={() => setCsRequestId(null)}
                    requestId={csRequestId}
                    onAward={handleAwardPO}
                />
            )}
            <InitiateRFQModal
                isOpen={!!rfqInitiateRequestId}
                onClose={() => setRfqInitiateRequestId(null)}
                request={materialRequests.find(r => r.id === rfqInitiateRequestId) || null}
                onInitiate={handleInitiateRFQ}
            />
            {submitBidRequestId && (
                <SubmitQuoteModal
                    isOpen={!!submitBidRequestId}
                    onClose={() => setSubmitBidRequestId(null)}
                    rfq={rfqs.find(r => r.procurementRequestId === submitBidRequestId) || RFQS[0]}
                />
            )}
        </>
    );
};

export default BiddingManagementPage;