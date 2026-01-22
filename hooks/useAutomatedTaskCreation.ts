import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { SiteVisit, SiteVisitStatus, Lead, LeadPipelineStatus } from '../types';
import { createNotification, logActivity } from '../services/liveDataService';
import { UserRole, ActivityStatus } from '../types';

/**
 * Hook to manage automated task creation after site inspection completion
 * When a site engineer completes inspection, automatically creates "Start Drawing" task
 */
export const useAutomatedTaskCreation = () => {

    /**
     * Triggers automatic drawing task creation when site visit is completed
     */
    const handleSiteVisitCompletion = async (
        siteVisit: SiteVisit,
        leadId: string,
        siteEngineerId: string
    ) => {
        try {
            // Update lead status to "Waiting for Drawing"
            const leadRef = doc(db, 'leads', leadId);
            await updateDoc(leadRef, {
                status: LeadPipelineStatus.WAITING_FOR_DRAWING,
                'history': [{
                    action: 'Site inspection completed - Awaiting drawing',
                    user: 'System',
                    timestamp: new Date(),
                    notes: `Completed by site engineer. Drawing task auto-created with 24-hour deadline.`
                }]
            });

            // Create "Start Drawing" task for the same engineer
            // Since the work is done by the same person, assign to site engineer
            const drawingTask = {
                leadId,
                projectName: siteVisit.projectName,
                clientName: siteVisit.clientName,
                assignedTo: siteEngineerId, // Same engineer does the drawing
                requestedBy: siteVisit.requesterId, // Sales member who requested
                status: 'Pending',
                taskType: 'Start Drawing',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                createdAt: new Date(),
                siteVisitId: siteVisit.id,
                priority: siteVisit.priority || 'Medium',
                metadata: {
                    siteAddress: siteVisit.siteAddress,
                    siteType: siteVisit.siteType,
                    measurements: siteVisit.notes?.measurements,
                    clientPreferences: siteVisit.notes?.clientPreferences
                }
            };

            const taskRef = await addDoc(collection(db, 'drawingTasks'), drawingTask);

            // Notify the site engineer about new drawing task
            await createNotification({
                title: 'New Drawing Task',
                message: `Site inspection complete for ${siteVisit.projectName}. Please start drawing within 24 hours.`,
                user_id: siteEngineerId,
                entity_type: 'task',
                entity_id: taskRef.id,
                type: 'info'
            });

            // Notify sales member that inspection is complete
            await createNotification({
                title: 'Site Inspection Complete',
                message: `${siteVisit.projectName}: Inspection completed. Drawing task initiated.`,
                user_id: siteVisit.requesterId,
                entity_type: 'lead',
                entity_id: leadId,
                type: 'success'
            });

            // Log activity
            await logActivity({
                description: `DRAWING TASK AUTO-CREATED: ${siteVisit.projectName} - 24-hour deadline set`,
                team: UserRole.SITE_ENGINEER,
                userId: siteEngineerId,
                status: ActivityStatus.PENDING,
                projectId: leadId
            });

            return taskRef.id;
        } catch (error) {
            console.error('Error creating automated drawing task:', error);
            throw error;
        }
    };

    /**
     * Handles drawing completion and triggers BOQ submission requirement
     */
    const handleDrawingCompletion = async (
        taskId: string,
        leadId: string,
        engineerId: string,
        projectName: string,
        salesMemberId: string
    ) => {
        try {
            // Update task status
            const taskRef = doc(db, 'drawingTasks', taskId);
            await updateDoc(taskRef, {
                status: 'Completed',
                completedAt: new Date()
            });

            // Update lead status
            const leadRef = doc(db, 'leads', leadId);
            await updateDoc(leadRef, {
                status: LeadPipelineStatus.WAITING_FOR_QUOTATION
            });

            // Notify sales member
            await createNotification({
                title: 'Drawing Completed',
                message: `${projectName}: Drawings are complete. Please review and change status to "Waiting for Quotation".`,
                user_id: salesMemberId,
                entity_type: 'lead',
                entity_id: leadId,
                type: 'success'
            });

            // Log activity
            await logActivity({
                description: `DRAWING COMPLETE: ${projectName} - Ready for BOQ and quotation`,
                team: UserRole.SITE_ENGINEER,
                userId: engineerId,
                status: ActivityStatus.DONE,
                projectId: leadId
            });

            return true;
        } catch (error) {
            console.error('Error handling drawing completion:', error);
            throw error;
        }
    };

    /**
     * Submits BOQ (Bill of Quantities) after drawing completion
     */
    const submitBOQ = async (
        leadId: string,
        projectName: string,
        boqData: any,
        engineerId: string,
        salesMemberId: string
    ) => {
        try {
            // Store BOQ in Firestore
            const boqRef = await addDoc(collection(db, 'boqs'), {
                leadId,
                projectName,
                ...boqData,
                submittedBy: engineerId,
                submittedAt: new Date(),
                status: 'Submitted'
            });

            // Notify sales member
            await createNotification({
                title: 'BOQ Submitted',
                message: `${projectName}: Bill of Quantities submitted. You can now proceed with quotation.`,
                user_id: salesMemberId,
                entity_type: 'lead',
                entity_id: leadId,
                type: 'info'
            });

            // Log activity
            await logActivity({
                description: `BOQ SUBMITTED: ${projectName} - Site inspection process complete`,
                team: UserRole.SITE_ENGINEER,
                userId: engineerId,
                status: ActivityStatus.DONE,
                projectId: leadId
            });

            return boqRef.id;
        } catch (error) {
            console.error('Error submitting BOQ:', error);
            throw error;
        }
    };

    return {
        handleSiteVisitCompletion,
        handleDrawingCompletion,
        submitBOQ
    };
};
