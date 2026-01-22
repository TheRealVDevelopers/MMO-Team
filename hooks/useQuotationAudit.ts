import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import {
    Quotation,
    QuotationVersion,
    QuotationAuditLog,
    Item,
    User
} from '../types';
import { createNotification, logActivity } from '../services/liveDataService';
import { UserRole, ActivityStatus } from '../types';

export const useQuotationAudit = (userId: string, userName: string) => {

    /**
     * Calculates if approval is needed based on discount %
     */
    const checkApprovalNeeded = (totalAmount: number, discountAmount: number) => {
        if (totalAmount === 0) return false;
        const discountPercentage = (discountAmount / totalAmount) * 100;
        return discountPercentage > 5;
    };

    /**
     * Creates a new version of a quotation
     */
    const createVersion = async (
        quotationId: string,
        items: Array<{ itemId: string; quantity: number; unitPrice: number; discount: number }>,
        notes?: string
    ) => {
        try {
            // Calculate totals
            let totalAmount = 0;
            let discountAmount = 0;
            let taxAmount = 0;

            // In a real app we'd fetch item details to get GST rates, but for now we'll estimate
            // or assume the UI passes fully calculated values. 
            // For this implementation, let's recalculate based on passed items

            items.forEach(item => {
                const itemTotal = item.quantity * item.unitPrice;
                const itemDiscount = (item.discount / 100) * itemTotal;
                const taxableAmount = itemTotal - itemDiscount;
                // Assuming flat 18% GST if not available, or we'd need to look up GST from Item catalog
                const gst = taxableAmount * 0.18;

                totalAmount += itemTotal;
                discountAmount += itemDiscount;
                taxAmount += gst;
            });

            const finalAmount = totalAmount - discountAmount + taxAmount;
            const requiresApproval = checkApprovalNeeded(totalAmount, discountAmount);

            // Get current quotation to find next version number
            const cleanQuotationId = quotationId.startsWith('new-') ? null : quotationId;
            let nextVersion = 1;
            let versions: QuotationVersion[] = [];
            let auditLog: QuotationAuditLog[] = [];

            if (cleanQuotationId) {
                const quoteRef = doc(db, 'quotations', cleanQuotationId);
                const quoteSnap = await getDoc(quoteRef);
                if (quoteSnap.exists()) {
                    const data = quoteSnap.data() as Quotation;
                    nextVersion = (data.currentVersion || 0) + 1;
                    versions = data.versions || [];
                    auditLog = data.auditLog || [];
                }
            }

            const newVersion: QuotationVersion = {
                versionNumber: nextVersion,
                items,
                totalAmount,
                discountAmount,
                taxAmount,
                finalAmount,
                createdAt: new Date(),
                createdBy: userId,
                notes
            };

            // Create Audit Log Entry
            const newAuditEntry: QuotationAuditLog = {
                id: `audit-${Date.now()}`,
                quotationId: cleanQuotationId || 'pending',
                version: nextVersion,
                action: cleanQuotationId ? 'Updated' : 'Created',
                performedBy: userId,
                timestamp: new Date(),
                details: requiresApproval
                    ? `Version ${nextVersion} created. Approval REQUIRED (Discount > 5%)`
                    : `Version ${nextVersion} created.`
            };

            const quotationData: Partial<Quotation> = {
                currentVersion: nextVersion,
                versions: [...versions, newVersion],
                auditLog: [...auditLog, newAuditEntry],
                status: requiresApproval ? 'Pending Approval' : 'Draft',
                updatedAt: new Date(),
                approvalStatus: requiresApproval ? {
                    requiresApproval: true,
                    triggerReason: 'Discount exceeds 5% threshold'
                } : undefined
            };

            if (!cleanQuotationId) {
                // Create new doc
                // @ts-ignore - we'll handle the full object creation in the component
                return { ...quotationData, isNew: true, newVersion };
            } else {
                // Update existing
                const quoteRef = doc(db, 'quotations', cleanQuotationId);
                await updateDoc(quoteRef, quotationData);

                // Log generic activity
                await logActivity({
                    description: `Quotation updated to v${nextVersion}`,
                    team: UserRole.QUOTATION_TEAM,
                    userId: userId,
                    status: ActivityStatus.DONE,
                    projectId: 'unknown' // passed from component usually
                });

                return { ...quotationData, isNew: false, version: nextVersion };
            }

        } catch (error) {
            console.error('Error creating quotation version:', error);
            throw error;
        }
    };

    /**
     * Approves a quotation that was flagged for high discount
     */
    const approveQuotation = async (quotationId: string, managerId: string) => {
        try {
            const quoteRef = doc(db, 'quotations', quotationId);
            const quoteSnap = await getDoc(quoteRef);

            if (!quoteSnap.exists()) throw new Error("Quotation not found");
            const data = quoteSnap.data() as Quotation;

            const newAuditEntry: QuotationAuditLog = {
                id: `audit-${Date.now()}`,
                quotationId,
                version: data.currentVersion,
                action: 'Approved',
                performedBy: managerId,
                timestamp: new Date(),
                details: 'Manager approved high discount quotation'
            };

            await updateDoc(quoteRef, {
                status: 'approved',
                approvalStatus: {
                    ...data.approvalStatus,
                    approvedBy: managerId,
                    approvedAt: new Date(),
                    requiresApproval: false
                },
                auditLog: [...data.auditLog, newAuditEntry]
            });

            return true;
        } catch (error) {
            console.error("Error approving quotation:", error);
            throw error;
        }
    };

    return {
        createVersion,
        approveQuotation,
        checkApprovalNeeded
    };
};
