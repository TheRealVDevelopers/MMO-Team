import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const JustDialSettings: React.FC = () => {
    const { currentUser } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [savedApiKey, setSavedApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Load existing API key on mount
    useEffect(() => {
        loadApiKey();
    }, []);

    const loadApiKey = async () => {
        try {
            const configRef = doc(db, 'systemConfig', 'justDial');
            const configSnap = await getDoc(configRef);
            
            if (configSnap.exists()) {
                const data = configSnap.data();
                setSavedApiKey(data.apiKey || '');
                setApiKey(data.apiKey || '');
            }
        } catch (error) {
            console.error('Error loading Just Dial API key:', error);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: 'error', text: 'API key cannot be empty' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const configRef = doc(db, 'systemConfig', 'justDial');
            await setDoc(configRef, {
                apiKey: apiKey.trim(),
                updatedAt: new Date(),
                updatedBy: currentUser?.id || '',
                updatedByName: currentUser?.name || ''
            }, { merge: true });

            setSavedApiKey(apiKey.trim());
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Just Dial API key saved successfully!' });
            
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving Just Dial API key:', error);
            setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setApiKey(savedApiKey);
        setIsEditing(false);
        setMessage(null);
    };

    // Only show to Super Admin
    if (currentUser?.role !== 'Super Admin') {
        return null;
    }

    return (
        <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <KeyIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Just Dial Integration</h2>
                    <p className="text-sm text-text-secondary">Configure Just Dial API for lead import</p>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                    message.type === 'success' 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                    {message.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Just Dial API Key
                    </label>
                    <div className="relative">
                        <input
                            type={isEditing ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            disabled={!isEditing}
                            placeholder="Enter your Just Dial API key"
                            className={`w-full px-4 py-3 border rounded-lg transition-all ${
                                isEditing
                                    ? 'border-primary bg-background text-text-primary focus:ring-2 focus:ring-primary/20'
                                    : 'border-border bg-subtle-background text-text-secondary cursor-not-allowed'
                            }`}
                        />
                        {savedApiKey && !isEditing && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircleIcon className="w-5 h-5 text-success" />
                            </div>
                        )}
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                        This API key will be used to fetch leads from Just Dial. Keep it secure.
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-medium shadow-sm"
                        >
                            {savedApiKey ? 'Update API Key' : 'Add API Key'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-6 py-2.5 border border-border bg-surface text-text-secondary rounded-lg hover:bg-subtle-background transition-all font-medium"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>

                {savedApiKey && (
                    <div className="mt-6 p-4 bg-success/10 border border-success/20 rounded-lg">
                        <div className="flex items-center gap-2 text-success">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="text-sm font-semibold">Just Dial integration is active</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">
                            Sales managers can now import leads from Just Dial
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JustDialSettings;
