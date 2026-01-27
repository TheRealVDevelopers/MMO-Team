import React, { useState } from 'react';
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
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [workDesc, setWorkDesc] = useState('');
    const [manpower, setManpower] = useState(0);
    const [weather, setWeather] = useState('Sunny');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newUpdate: DailyUpdate = {
            id: `du-${Date.now()}`,
            projectId,
            date: new Date().toISOString(),
            workDescription: workDesc,
            manpowerCount: manpower,
            weather,
            photos: [],
            createdBy: 'u-5', // Mock current user
            createdAt: new Date()
        };
        onAddUpdate(newUpdate);
        setIsFormOpen(false);
        setWorkDesc('');
        setManpower(0);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daily Site Journal</h3>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    Log Update
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md animate-in slide-in-from-top-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">New Entry</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Manpower Count</label>
                                <input
                                    type="number"
                                    value={manpower}
                                    onChange={e => setManpower(parseInt(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Weather</label>
                                <select
                                    value={weather}
                                    onChange={e => setWeather(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                >
                                    <option>Sunny</option>
                                    <option>Cloudy</option>
                                    <option>Rainy</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Work Description</label>
                            <textarea
                                value={workDesc}
                                onChange={e => setWorkDesc(e.target.value)}
                                rows={3}
                                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-slate-700 dark:border-gray-600"
                                placeholder="What was accomplished today?"
                            />
                        </div>

                        {/* Mock Photo Upload */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 cursor-not-allowed bg-gray-50 dark:bg-slate-900/50">
                            <CameraIcon className="w-6 h-6 mb-2" />
                            <span className="text-xs">Photo upload disabled in demo</span>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                        <div key={update.id} className="relative pl-6 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:pb-0 last:border-l-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500 dark:bg-blue-900" />

                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                                            {format(new Date(update.date), 'EEEE, d MMM yyyy')}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-gray-300">
                                                {update.weather}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded">
                                                {update.manpowerCount} Workers
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-medium text-gray-900 dark:text-white">{author?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-gray-500">{format(new Date(update.createdAt), 'h:mm a')}</div>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{update.workDescription}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyUpdateLog;
