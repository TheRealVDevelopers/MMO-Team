import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../../shared/Card';
import { PROJECTS, LEADS, USERS } from '../../../constants';

const ReportsPage: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const generateReportSummary = async () => {
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const prompt = `
                Analyze the following JSON data for an interior design company's internal management system and generate a concise weekly report summary in markdown format.
                
                The summary should include three sections:
                1.  **Project Highlights:** Mention the number of newly completed projects and any projects that are currently in the execution phase.
                2.  **Sales & Leads Overview:** Summarize the number of new leads acquired this week and the total number of deals won.
                3.  **Team Productivity:** Briefly comment on the overall team activity based on their latest status updates. Mention a few examples of what team members are working on.

                Here is the data:
                Projects: ${JSON.stringify(PROJECTS.map(p => ({ status: p.status, name: p.projectName })))}
                Leads: ${JSON.stringify(LEADS.map(l => ({ status: l.status, inquiryDate: l.inquiryDate })))}
                Users: ${JSON.stringify(USERS.map(u => ({ name: u.name, role: u.role, currentTask: u.currentTask })))}
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setSummary(response.text);

        } catch (err) {
            console.error(err);
            setError('Failed to generate summary. Please check the API key and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Reports & Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-bold">AI Weekly Summary</h3>
                    <p className="text-sm text-text-secondary mt-1">Generate an AI-powered summary of the week's activities.</p>
                    <button 
                        onClick={generateReportSummary}
                        disabled={isLoading}
                        className="mt-4 w-full bg-primary text-white py-2 rounded-md hover:opacity-90 disabled:bg-opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating...' : 'Generate Weekly Report Summary'}
                    </button>
                    {error && <p className="mt-2 text-sm text-error">{error}</p>}
                    {summary && (
                         <div className="mt-4 p-4 border border-border rounded-md bg-subtle-background prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans">{summary}</pre>
                        </div>
                    )}
                </Card>
                <Card>
                     <h3 className="text-lg font-bold">Downloadable Reports</h3>
                     <p className="text-sm text-text-secondary mt-1">Export raw data for further analysis.</p>
                     <div className="mt-4 space-y-3">
                        <button className="w-full text-left p-2 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">Download Team Activity Report (.csv)</button>
                        <button className="w-full text-left p-2 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">Download Project Progress Report (.csv)</button>
                        <button className="w-full text-left p-2 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">Download Client Leads Report (.csv)</button>
                     </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold">Team Productivity</h3>
                     <div className="mt-4 h-64 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold">Project Completion Rate</h3>
                     <div className="mt-4 h-64 bg-subtle-background rounded-md flex items-center justify-center">
                        <p className="text-text-secondary">Chart Placeholder</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;
