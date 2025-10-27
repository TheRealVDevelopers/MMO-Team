
import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../../shared/Card';
import { PROJECTS, LEADS, USERS, ACTIVITIES } from '../../../constants';
import { ProjectStatus, ActivityStatus, UserRole } from '../../../types';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '../../icons/IconComponents';

// --- START: Chart Components ---

const projectStatusConfig: Record<ProjectStatus, { color: string, name: string }> = {
    [ProjectStatus.AWAITING_DESIGN]: { color: '#3b82f6', name: 'Awaiting Design' },
    [ProjectStatus.DESIGN_IN_PROGRESS]: { color: '#6366f1', name: 'Design In Progress' },
    [ProjectStatus.PENDING_REVIEW]: { color: '#a855f7', name: 'Pending Review' },
    [ProjectStatus.REVISIONS_REQUESTED]: { color: '#f97316', name: 'Revisions' },
    [ProjectStatus.AWAITING_QUOTATION]: { color: '#0ea5e9', name: 'Needs Quote' },
    [ProjectStatus.QUOTATION_SENT]: { color: '#06b6d4', name: 'Quote Sent' },
    [ProjectStatus.NEGOTIATING]: { color: '#eab308', name: 'Negotiating' },
    [ProjectStatus.APPROVED]: { color: '#22c55e', name: 'Approved' },
    [ProjectStatus.REJECTED]: { color: '#ef4444', name: 'Rejected' },
    [ProjectStatus.PROCUREMENT]: { color: '#14b8a6', name: 'Procurement' },
    [ProjectStatus.IN_EXECUTION]: { color: '#f59e0b', name: 'In Execution' },
    [ProjectStatus.COMPLETED]: { color: '#10b981', name: 'Completed' },
    [ProjectStatus.ON_HOLD]: { color: '#64748b', name: 'On Hold' },
};

const ProjectStatusDonutChart: React.FC = () => {
    const data = useMemo(() => {
        const counts = PROJECTS.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {} as Record<ProjectStatus, number>);

        return Object.entries(counts)
            .map(([status, count]) => ({
                status: status as ProjectStatus,
                count,
                color: projectStatusConfig[status as ProjectStatus]?.color || '#ccc',
                name: projectStatusConfig[status as ProjectStatus]?.name || status,
            }))
            .sort((a, b) => b.count - a.count);
    }, []);

    const totalProjects = PROJECTS.length;
    const radius = 80;
    const strokeWidth = 30;
    const innerRadius = radius - strokeWidth;
    const circumference = 2 * Math.PI * innerRadius;

    let accumulatedAngle = 0;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 h-full p-4">
            <div className="relative">
                <svg width="200" height="200" viewBox="0 0 200 200">
                    <g transform="rotate(-90 100 100)">
                        {data.map((segment) => {
                            const percentage = (segment.count / totalProjects) * 100;
                            const arcLength = (circumference * percentage) / 100;
                            const rotation = (accumulatedAngle / totalProjects) * 360;
                            accumulatedAngle += segment.count;

                            return (
                                <circle
                                    key={segment.status}
                                    cx="100" cy="100" r={innerRadius}
                                    fill="transparent"
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${arcLength} ${circumference}`}
                                    transform={`rotate(${rotation} 100 100)`}
                                >
                                    <title>{segment.name}: {segment.count} ({percentage.toFixed(1)}%)</title>
                                </circle>
                            );
                        })}
                    </g>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-text-primary">{totalProjects}</span>
                    <span className="text-xs text-text-secondary">Total Projects</span>
                </div>
            </div>
            <div className="flex-1 max-w-xs w-full">
                <ul className="space-y-2 text-sm">
                    {data.slice(0, 5).map(item => (
                        <li key={item.status} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                <span className="text-text-secondary">{item.name}</span>
                            </div>
                            <span className="font-medium text-text-primary">{item.count}</span>
                        </li>
                    ))}
                    {data.length > 5 && <li className="text-xs text-text-secondary text-center pt-1">...and {data.length - 5} more</li>}
                </ul>
            </div>
        </div>
    );
};


const TeamProductivityChart: React.FC = () => {
    const data = useMemo(() => {
        const counts = ACTIVITIES.filter(a => a.status === ActivityStatus.DONE).reduce((acc, activity) => {
            acc[activity.team] = (acc[activity.team] || 0) + 1;
            return acc;
        }, {} as Record<UserRole, number>);
        return Object.entries(counts).map(([team, count]) => ({ team: team as UserRole, count })).sort((a,b) => b.count - a.count);
    }, []);

    const maxCount = Math.max(...data.map(d => d.count), 0);
    
    return (
        <div className="p-4 h-full flex flex-col justify-end space-y-2">
            {data.map(d => {
                 const barWidth = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                 return (
                    <div key={d.team} className="flex items-center group">
                        <div className="w-32 text-right text-xs text-text-secondary pr-2 truncate" title={d.team}>
                           {d.team.replace(' Team', '').replace(' Member', '').replace(' General Manager', ' GM')}
                        </div>
                        <div className="flex-1 bg-subtle-background rounded-full h-6 relative">
                            <div 
                                className="bg-primary rounded-full h-6 flex items-center justify-start pl-2 transition-all duration-500"
                                style={{ width: `${barWidth}%`}}
                            >
                                <span className="text-xs font-bold text-white">{d.count}</span>
                            </div>
                        </div>
                    </div>
                 )
            })}
        </div>
    );
};


// --- END: Chart Components ---


const ReportsPage: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
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
                Analyze the following JSON data for an interior design company's internal management system in India and generate a concise weekly report summary in markdown format.
                The summary should be suitable for an Indian business context.

                The summary should include three sections using H3 markdown (###):
                1.  **Project Highlights:** Mention the number of newly completed projects and any projects that are currently in the execution phase.
                2.  **Sales & Leads Overview:** Summarize the number of new leads acquired this week and the total number of deals won.
                3.  **Team Productivity:** Briefly comment on the overall team activity based on their latest status updates. Mention a few examples of what team members are working on.

                Use bullet points (* or -) for lists.

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
    
    const renderMarkdown = (text: string) => {
        if (!text) return null;
        const sections = text.split(/(?=###\s)/g);
        return sections.map((section, index) => {
            const lines = section.split('\n').filter(line => line.trim() !== '');
            const heading = lines.shift()?.replace('###', '').trim();
            return (
                <div key={index}>
                    {heading && <h3 className="text-md font-bold text-text-primary mt-3 mb-1.5">{heading}</h3>}
                    <ul className="list-disc pl-5 space-y-1 text-sm text-text-secondary">
                        {lines.map((line, lineIndex) => (
                             <li key={lineIndex}>{line.replace(/[-*]\s/,'').trim()}</li>
                        ))}
                    </ul>
                </div>
            );
        });
    };
    
    const handleDownload = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);

        const convertToCSV = (objArray: any[]) => {
            const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
            const header = headers.join(',') + '\r\n';
            const body = array.map((row: any) => {
                return headers.map(fieldName => {
                    let value = row[fieldName];
                    if (value === null || value === undefined) {
                        value = '';
                    } else if (typeof value === 'object' && !(value instanceof Date)) {
                        value = JSON.stringify(value).replace(/"/g, '""');
                    } else {
                        value = String(value).replace(/"/g, '""');
                    }
                    return `"${value}"`;
                }).join(',');
            }).join('\r\n');
            return header + body;
        }
        
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className="flex items-center space-x-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <h2 className="text-2xl font-bold text-text-primary">Reports & Analytics</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col">
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
                    <div className="mt-4 p-4 border border-border rounded-md bg-subtle-background flex-grow">
                        {isLoading ? (
                             <div className="flex items-center justify-center h-full">
                                <p className="text-text-secondary">Generating your summary...</p>
                             </div>
                        ) : summary ? (
                           renderMarkdown(summary)
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-text-secondary text-center">Your generated report will appear here.</p>
                            </div>
                        )}
                    </div>
                </Card>
                <Card>
                     <h3 className="text-lg font-bold">Downloadable Reports</h3>
                     <p className="text-sm text-text-secondary mt-1">Export raw data for further analysis.</p>
                     <div className="mt-4 space-y-3">
                        <button onClick={() => handleDownload(ACTIVITIES, 'team_activity.csv')} className="w-full flex items-center p-3 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">
                            <ArrowDownTrayIcon className="w-5 h-5 mr-3 text-text-secondary"/> Download Team Activity Report (.csv)
                        </button>
                        <button onClick={() => handleDownload(PROJECTS, 'project_progress.csv')} className="w-full flex items-center p-3 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">
                            <ArrowDownTrayIcon className="w-5 h-5 mr-3 text-text-secondary"/> Download Project Progress Report (.csv)
                        </button>
                        <button onClick={() => handleDownload(LEADS, 'client_leads.csv')} className="w-full flex items-center p-3 bg-subtle-background hover:bg-border rounded-md text-sm font-medium">
                            <ArrowDownTrayIcon className="w-5 h-5 mr-3 text-text-secondary"/> Download Client Leads Report (.csv)
                        </button>
                     </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-lg font-bold">Team Productivity (Completed Tasks)</h3>
                    <div className="h-72">
                        <TeamProductivityChart />
                    </div>
                </Card>
                <Card>
                    <h3 className="text-lg font-bold">Project Status Breakdown</h3>
                     <div className="h-72">
                        <ProjectStatusDonutChart />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;