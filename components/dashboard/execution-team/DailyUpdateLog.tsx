import React, { useState, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { DailyUpdate } from '../../../types';
import { CameraIcon, PlusIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { USERS } from '../../../constants';

interface DailyUpdateLogProps {
    projectId: string;
    updates: DailyUpdate[];
    onAddUpdate: (update: DailyUpdate) => void;
}

const DailyUpdateLog: React.FC<DailyUpdateLogProps> = ({ projectId, updates, onAddUpdate }) => {
    const { currentUser } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [workDesc, setWorkDesc] = useState('');
    const [manpower, setManpower] = useState(0);
    const [weather, setWeather] = useState('Sunny');
    const [completionPercent, setCompletionPercent] = useState(0);
    const [blocker, setBlocker] = useState<string>('');
    const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newPhotos: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                const result = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                newPhotos.push(result);
            }
            setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
        } catch (error) {
            console.error('Error reading files:', error);
            alert('Failed to upload photos');
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (index: number) => {
        setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newUpdate: DailyUpdate = {
            id: `du-${Date.now()}`,
            projectId,
            date: new Date().toISOString(),
            workDescription: workDesc,
            manpowerCount: manpower,
            weather,
            photos: uploadedPhotos,
            createdBy: currentUser?.id || 'unknown',
            createdAt: new Date(),
            // @ts-ignore - extending type for new fields
            completionPercent,
            blocker
        };
        onAddUpdate(newUpdate);
        setIsFormOpen(false);
        setWorkDesc('');
        setManpower(0);
        setCompletionPercent(0);
        setBlocker('');
        setUploadedPhotos([]);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">Daily Site Journal</h3>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Log Update
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-surface p-6 rounded-xl border border-border shadow-md animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">New Entry</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Manpower Count</label>
                                <input
                                    type="number"
                                    value={manpower}
                                    onChange={e => setManpower(parseInt(e.target.value))}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-1">Weather</label>
                                <select
                                    value={weather}
                                    onChange={e => setWeather(e.target.value)}
                                    className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                >
                                    <option>Sunny</option>
                                    <option>Cloudy</option>
                                    <option>Rainy</option>
                                </select>
                            </div>
                        </div>

                        {/* NEW: Completion % */}
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Task Completion %</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={completionPercent}
                                onChange={e => setCompletionPercent(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="text-right text-sm font-medium text-primary">{completionPercent}%</div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Work Description</label>
                            <textarea
                                value={workDesc}
                                onChange={e => setWorkDesc(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                                placeholder="What was accomplished today?"
                            />
                        </div>

                        {/* NEW: Blocker Selection */}
                        <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">Any Blockers?</label>
                            <select
                                value={blocker}
                                onChange={e => setBlocker(e.target.value)}
                                className="w-full p-2 border border-border rounded-lg bg-surface text-text-primary"
                            >
                                <option value="">No Blockers</option>
                                <option value="material">Material not arrived</option>
                                <option value="client">Client not available</option>
                                <option value="design">Design clarification needed</option>
                                <option value="weather">Weather conditions</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Photo Upload */}
                        <div className="space-y-3">
                            <label className="block text-xs font-medium text-text-secondary">Site Photos</label>

                            <div className="grid grid-cols-4 gap-2">
                                {uploadedPhotos.map((photo, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                        <img src={photo} alt="Site update" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="sr-only">Remove</span>
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg hover:bg-subtle-background transition-colors text-text-tertiary hover:text-primary"
                                >
                                    <CameraIcon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px]">{uploading ? '...' : 'Add Photo'}</span>
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-1.5 text-sm text-text-secondary hover:bg-subtle-background rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                            >
                                Save Entry
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {updates.map((update, idx) => {
                    const author = USERS.find(u => u.id === update.createdBy);
                    return (
                        <div key={update.id} className="relative pl-6 pb-6 border-l-2 border-border last:pb-0 last:border-l-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-subtle border-2 border-primary" />

                            <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-text-primary">
                                            {format(new Date(update.date), 'EEEE, d MMM yyyy')}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-subtle-background rounded text-text-secondary">
                                                {update.weather}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-primary-subtle text-primary rounded">
                                                {update.manpowerCount} Workers
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-text-primary">{author?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-text-tertiary">{format(new Date(update.createdAt), 'h:mm a')}</div>
                                    </div>
                                </div>

                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{update.workDescription}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyUpdateLog;
