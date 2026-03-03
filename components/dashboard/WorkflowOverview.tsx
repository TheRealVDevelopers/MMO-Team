import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    UserPlusIcon,
    CalendarIcon,
    PaintBrushIcon,
    CalculatorIcon,
    ShieldCheckIcon,
    BanknotesIcon,
    WrenchScrewdriverIcon,
    CheckBadgeIcon,
    ArrowDownTrayIcon,
    IdentificationIcon,
    HomeModernIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

const steps = [
    {
        id: 1,
        title: 'Lead Acquisition',
        role: 'Sales GM / Admin',
        description: 'New leads are entered manually or imported from sources like Just Dial and assigned to sales team members.',
        icon: UserPlusIcon,
        color: 'bg-blue-500',
        actions: ['Add Lead', 'Import Data', 'Assign Owner']
    },
    {
        id: 2,
        title: 'Lead Nurturing',
        role: 'Sales Team',
        description: 'Sales representative contacts the client, logs activity history, and moves lead through the pipeline.',
        icon: CalendarIcon,
        color: 'bg-purple-500',
        actions: ['Log Calls', 'Set Reminders', 'Schedule Visit']
    },
    {
        id: 3,
        title: 'Site Inspection',
        role: 'Site Engineer',
        description: 'Engineer visits the site, captures GPS-verified check-in, measurements, and uploads a comprehensive report.',
        icon: HomeModernIcon,
        color: 'bg-orange-500',
        actions: ['Travel Log', 'Check-in', 'Submit Report']
    },
    {
        id: 4,
        title: 'Design & Drawing',
        role: 'Drawing Team',
        description: 'Designers create 2D layouts and 3D renders based on site measurements and client requirements.',
        icon: PaintBrushIcon,
        color: 'bg-pink-500',
        actions: ['Upload 2D/3D', 'Version Control', 'PDF Release']
    },
    {
        id: 5,
        title: 'Commercial Proposal',
        role: 'Quotation Team',
        description: 'BOQ is created from the catalog, pricing is set with margins, and optional vendor bidding is conducted.',
        icon: CalculatorIcon,
        color: 'bg-indigo-500',
        actions: ['Generate BOQ', 'Vendor Bids', 'Submit Approval']
    },
    {
        id: 6,
        title: 'Approval & Payment',
        role: 'Admin / Accounts',
        description: 'Admin approves the quotation. Accounts Team verifies the advance payment to convert lead to project.',
        icon: ShieldCheckIcon,
        color: 'bg-emerald-500',
        actions: ['Approve Quote', 'Verify Payment', 'Convert Lead']
    },
    {
        id: 7,
        title: 'Financial Setup',
        role: 'Accounts Team',
        description: 'Project ledger is initialized, advance invoice (GRIN) is generated, and tax compliance is applied.',
        icon: BanknotesIcon,
        color: 'bg-teal-500',
        actions: ['Init P&L', 'Generate GRIN', 'GST Setup']
    },
    {
        id: 8,
        title: 'Execution Planning',
        role: 'Execution Team',
        description: 'Budget heads are allocated, tasks are created and assigned, and project timeline is set up.',
        icon: WrenchScrewdriverIcon,
        color: 'bg-cyan-500',
        actions: ['Allocate Budget', 'Assign Tasks', 'Set Timeline']
    },
    {
        id: 9,
        title: 'On-Site Execution',
        role: 'Execution & Accounts',
        description: 'Daily progress is logged, materials are requested, and expenses/vendor bills are processed.',
        icon: WrenchScrewdriverIcon,
        color: 'bg-accent',
        actions: ['Daily Updates', 'Material Requests', 'P&L Monitor']
    },
    {
        id: 10,
        title: 'JMS & Handover',
        role: 'Project Head / Client',
        description: 'Final measurements are taken with the client, both parties sign off, and project is marked complete.',
        icon: CheckBadgeIcon,
        color: 'bg-green-500',
        actions: ['Launch JMS', 'Client Sign-off', 'Final Invoice']
    }
];

const WorkflowOverview: React.FC = () => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPDF = async () => {
        if (isGenerating || !printRef.current) return;
        setIsGenerating(true);
        try {
            // Dynamic imports to keep bundle lean
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                ignoreElements: (el) => el.classList.contains('pdf-hide'),
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 14;
            const usableWidth = pdfWidth - margin * 2;

            // Branded header
            pdf.setFillColor(15, 23, 42); // slate-900
            pdf.rect(0, 0, pdfWidth, 28, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('MMO Interiors', margin, 12);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Operational Workflow Guide  •  Internal Procedural Manual', margin, 19);
            pdf.setFontSize(7);
            pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pdfWidth - margin, 19, { align: 'right' });

            // Content image (multi-page)
            const imgRatio = canvas.width / canvas.height;
            const imgWidthPx = canvas.width;
            const contentStartY = 32;
            const availHeight = pdfHeight - contentStartY - margin;

            // How many mm does the full image take?
            const totalImgHeightMm = usableWidth / imgRatio;
            let yOffset = 0;
            let pageNum = 0;

            while (yOffset < totalImgHeightMm) {
                if (pageNum > 0) {
                    pdf.addPage();
                    // Thin header on subsequent pages
                    pdf.setFillColor(15, 23, 42);
                    pdf.rect(0, 0, pdfWidth, 10, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(7);
                    pdf.text('MMO Interiors — Operational Workflow Guide', margin, 7);
                }

                const sliceHeightMm = Math.min(availHeight, totalImgHeightMm - yOffset);
                const sliceRatio = sliceHeightMm / totalImgHeightMm;
                const srcY = Math.round(yOffset / totalImgHeightMm * canvas.height);
                const srcH = Math.round(sliceRatio * canvas.height);

                // Create a slice canvas
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = imgWidthPx;
                sliceCanvas.height = srcH;
                const ctx = sliceCanvas.getContext('2d')!;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                ctx.drawImage(canvas, 0, srcY, imgWidthPx, srcH, 0, 0, imgWidthPx, srcH);

                const sliceData = sliceCanvas.toDataURL('image/png');
                const yStart = pageNum === 0 ? contentStartY : 14;
                pdf.addImage(sliceData, 'PNG', margin, yStart, usableWidth, sliceHeightMm);

                yOffset += sliceHeightMm;
                pageNum++;
            }

            // Footer on last page
            pdf.setTextColor(100, 116, 139);
            pdf.setFontSize(7);
            pdf.text('This document is confidential and for internal use only.', pdfWidth / 2, pdfHeight - 8, { align: 'center' });

            pdf.save('MMO-Operational-Workflow-Guide.pdf');
        } catch (err) {
            console.error('[WorkflowOverview] PDF generation error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-6">
            <div ref={printRef}>
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black text-text-primary tracking-tighter mb-4"
                    >
                        Operational Workflow
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-text-secondary max-w-2xl mx-auto"
                    >
                        A comprehensive guide to the MMO project lifecycle. Understanding how a lead traverses through
                        different departments to become a successful project.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-green-500 -translate-x-1/2 hidden lg:block opacity-20" />

                    <div className="space-y-12 relative">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 0 ? '' : 'lg:flex-row-reverse'}`}
                            >
                                {/* Content Card */}
                                <div className="flex-1 w-full">
                                    <div className="bg-surface border border-border/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                                        <div className={`absolute top-0 right-0 w-32 h-32 ${step.color} opacity-[0.03] rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform`} />

                                        <div className="flex items-start gap-6">
                                            <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden`}>
                                                <step.icon className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-black text-text-primary">{step.title}</h3>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary bg-subtle-background px-3 py-1 rounded-full border border-border/50">
                                                        Step {step.id}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <IdentificationIcon className="w-4 h-4 text-primary" />
                                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{step.role}</span>
                                                </div>
                                                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                                                    {step.description}
                                                </p>

                                                <div className="flex flex-wrap gap-2">
                                                    {step.actions.map(action => (
                                                        <span key={action} className="text-[9px] font-black uppercase tracking-tighter px-2 py-1 bg-background border border-border rounded-lg text-text-secondary flex items-center gap-1">
                                                            <div className={`w-1 h-1 rounded-full ${step.color}`} />
                                                            {action}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Center Point */}
                                <div className="relative z-10 hidden lg:block">
                                    <div className={`w-12 h-12 rounded-full ${step.color} border-4 border-white shadow-xl flex items-center justify-center text-white font-bold`}>
                                        {step.id}
                                    </div>
                                </div>

                                {/* Spacer for alternate layout */}
                                <div className="flex-1 hidden lg:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer Note */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-24 p-8 bg-primary/5 border border-primary/10 rounded-3xl text-center"
                >
                    <DocumentTextIcon className="w-12 h-12 mx-auto text-primary opacity-30 mb-4" />
                    <h4 className="text-lg font-bold text-text-primary mb-2">Internal Procedural Manual</h4>
                    <p className="text-sm text-text-secondary max-w-xl mx-auto">
                        This workflow is strictly enforced through the digital platform. Buttons and actions only become available
                        once the previous stage has been successfully verified.
                    </p>
                </motion.div>
            </div>

            {/* Action Buttons (outside printRef so they're excluded from PDF) */}
            <div className="mt-8 flex items-center justify-center gap-4 pdf-hide">
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-secondary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download PDF Guide
                        </>
                    )}
                </button>
                <button className="px-6 py-2.5 bg-white border border-border text-text-primary text-xs font-black uppercase tracking-widest rounded-xl hover:bg-subtle-background transition-all">
                    Contact Support
                </button>
            </div>
        </div>
    );
};

export default WorkflowOverview;
