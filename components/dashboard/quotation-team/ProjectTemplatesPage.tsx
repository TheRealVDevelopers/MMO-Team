import React from 'react';
import Card from '../../shared/Card';
import { PROJECT_TEMPLATES, formatCurrencyINR } from '../../../constants';
import { ProjectTemplate } from '../../../types';
import { ArrowLeftIcon, PlusIcon, ListBulletIcon, BanknotesIcon, BuildingOfficeIcon } from '../../icons/IconComponents';

const TemplateCard: React.FC<{ template: ProjectTemplate }> = ({ template }) => (
    <Card className="hover:border-primary hover:shadow-md transition-all">
        <h3 className="font-bold text-text-primary">{template.name}</h3>
        <p className="text-xs text-text-secondary mt-1 h-8">{template.description}</p>
        <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-text-secondary flex items-center"><BuildingOfficeIcon className="w-4 h-4 mr-1.5" />Type</span>
                <span className="font-medium text-text-primary">{template.projectType}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-text-secondary flex items-center"><ListBulletIcon className="w-4 h-4 mr-1.5" />Items</span>
                <span className="font-medium text-text-primary">{template.itemCount}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-text-secondary flex items-center"><BanknotesIcon className="w-4 h-4 mr-1.5" />Avg. Cost</span>
                <span className="font-bold text-primary">{formatCurrencyINR(template.avgCost)}</span>
            </div>
        </div>
        <button className="w-full mt-4 py-1.5 bg-primary-subtle-background text-primary text-sm font-semibold rounded-md hover:bg-primary/30">
            Use Template
        </button>
    </Card>
);


interface ProjectTemplatesPageProps {
    templates: ProjectTemplate[];
    setCurrentPage: (page: string) => void;
    onAddTemplate: () => void;
}

const ProjectTemplatesPage: React.FC<ProjectTemplatesPageProps> = ({ templates, setCurrentPage, onAddTemplate }) => {
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
                    <h2 className="text-2xl font-bold text-text-primary">Project Templates</h2>
                </div>
                <button
                    onClick={onAddTemplate}
                    className="flex items-center space-x-2 bg-primary text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary mt-2 sm:mt-0"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New Template</span>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates.map(template => <TemplateCard key={template.id} template={template} />)}
            </div>
        </div>
    );
};

export default ProjectTemplatesPage;