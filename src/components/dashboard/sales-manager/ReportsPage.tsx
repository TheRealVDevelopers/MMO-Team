
import React from 'react';
import {
    ArrowDownTrayIcon,
    ChartPieIcon,
    PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { ContentCard, PrimaryButton, staggerContainer } from '../shared/DashboardUI';
import { motion } from 'framer-motion';

const ReportsPage: React.FC = () => {
    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ContentCard>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <ChartPieIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-text-primary">Report Engine</h3>
                            <p className="text-sm text-text-secondary font-light">Configure and export analytical data</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="report-type" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Dataset Selection</label>
                            <select id="report-type" className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer appearance-none">
                                <option>Lead Generation Performance</option>
                                <option>Sales Funnel Health</option>
                                <option>Executive Performance Summary</option>
                                <option>Revenue by Source</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="report-period" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Timeframe</label>
                            <select id="report-period" className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none cursor-pointer appearance-none">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Quarter</option>
                                <option>Year to Date</option>
                            </select>
                        </div>
                        <PrimaryButton className="w-full py-4 justify-center" icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
                            Generate Intelligence Report
                        </PrimaryButton>
                    </div>
                </ContentCard>

                <ContentCard>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-purple/10 rounded-xl text-purple">
                            <PresentationChartBarIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-serif font-bold text-text-primary">Visual Projection</h3>
                            <p className="text-sm text-text-secondary font-light">Real-time performance rendering</p>
                        </div>
                    </div>
                    <div className="h-64 bg-subtle-background/50 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center p-8 text-center group">
                        <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                            <PresentationChartBarIcon className="w-6 h-6 text-text-secondary/40" />
                        </div>
                        <p className="text-sm text-text-secondary font-medium max-w-[200px]">Graphical insights will manifest upon report generation</p>
                    </div>
                </ContentCard>
            </div>
        </motion.div>
    );
};

export default ReportsPage;
