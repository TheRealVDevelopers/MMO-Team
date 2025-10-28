import React, { useState } from 'react';
import { ChatChannel, QuickClarifyQuestion } from '../../types';
import { QuestionMarkCircleIcon, PlusIcon } from '../icons/IconComponents';
import QuestionCard from './QuestionCard';
import QuickClarifyModal from './QuickClarifyModal';
import { useAuth } from '../../context/AuthContext';

interface QuickClarifyChannelProps {
  channel: ChatChannel;
  questions: QuickClarifyQuestion[];
  onAskQuestion: (question: QuickClarifyQuestion) => void;
}

const QuickClarifyChannel: React.FC<QuickClarifyChannelProps> = ({ channel, questions, onAskQuestion }) => {
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleModalSubmit = (questionData: Omit<QuickClarifyQuestion, 'id' | 'channelId' | 'senderId' | 'timestamp'>) => {
        if (!currentUser) return;
        
        const newQuestion: QuickClarifyQuestion = {
            id: `qc-${Date.now()}`,
            channelId: '#quick-clarify',
            senderId: currentUser.id,
            timestamp: new Date(),
            ...questionData
        };

        onAskQuestion(newQuestion);
    };

    return (
        <>
            <div className="flex-1 flex flex-col min-h-0 bg-subtle-background">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-surface flex-shrink-0">
                    <div className="flex items-center">
                        <QuestionMarkCircleIcon className="w-6 h-6 text-text-secondary"/>
                        <h2 className="text-lg font-bold text-text-primary ml-2">{channel.name}</h2>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                        <PlusIcon className="w-4 h-4"/>
                        <span>Ask a Question</span>
                    </button>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {questions.length > 0 ? (
                        [...questions].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(q => <QuestionCard key={q.id} question={q} />)
                    ) : (
                         <div className="flex items-center justify-center h-full text-text-secondary text-center">
                            <div>
                                <h3 className="text-lg font-bold">No questions yet.</h3>
                                <p className="mt-1">Be the first to ask a structured question!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <QuickClarifyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAskQuestion={handleModalSubmit}
            />
        </>
    );
};

export default QuickClarifyChannel;
