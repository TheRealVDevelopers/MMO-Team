import React from 'react';
import { QuickClarifyQuestion, QuestionUrgency, QuestionCategory } from '../../types';
import { USERS, formatDate } from '../../constants';
import { FireIcon } from '../icons/IconComponents';

const QuestionCard: React.FC<{ question: QuickClarifyQuestion }> = ({ question }) => {
    const sender = USERS.find(u => u.id === question.senderId);

    const categoryColors: Record<QuestionCategory, string> = {
        [QuestionCategory.DESIGN]: 'bg-primary-subtle-background text-primary-subtle-text',
        [QuestionCategory.SITE]: 'bg-secondary-subtle-background text-secondary-subtle-text',
        [QuestionCategory.TECHNICAL]: 'bg-purple-subtle-background text-purple-subtle-text',
        [QuestionCategory.CLIENT]: 'bg-accent-subtle-background text-accent-subtle-text',
        [QuestionCategory.PROCESS]: 'bg-slate-subtle-background text-slate-subtle-text',
    };

    return (
        <div className="bg-surface p-4 rounded-lg border border-border shadow-sm">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[question.category]}`}>
                        {question.category}
                    </span>
                    {question.urgency === QuestionUrgency.HIGH && (
                        <span className="flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error-subtle-background text-error-subtle-text">
                            <FireIcon className="w-3 h-3 mr-1" /> URGENT
                        </span>
                    )}
                </div>
                <span className="text-xs text-text-secondary flex-shrink-0 ml-2">{formatDate(question.timestamp)}</span>
            </div>

            <p className="mt-4 text-sm text-text-primary">{question.question}</p>

            {question.regarding && <p className="mt-2 text-xs text-text-secondary"><strong>Regarding:</strong> {question.regarding}</p>}

            <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src={sender?.avatar} alt={sender?.name} className="w-6 h-6 rounded-full" />
                    <span className="text-xs font-medium">{sender?.name}</span>
                </div>
                <button className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-md hover:bg-secondary">Reply</button>            </div>
        </div>
    );
};

export default QuestionCard;
