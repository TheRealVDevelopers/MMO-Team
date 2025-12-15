import React from 'react';
import { ArrowLeftIcon } from '../icons/IconComponents';

interface BackButtonProps {
    onClick?: () => void;
    label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back' }) => {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-kurchi-espresso-900 dark:hover:text-white hover:bg-subtle-background dark:hover:bg-surface transition-all duration-200 group"
        >
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>{label}</span>
        </button>
    );
};

export default BackButton;
