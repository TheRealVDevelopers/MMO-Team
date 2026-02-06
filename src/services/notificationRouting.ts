import { Notification } from '../types';

/**
 * NOTIFICATION ROUTING HELPER
 * 
 * Handles routing when user clicks a notification
 * Routes to the appropriate page with optional tab parameter
 */

export interface NotificationRouteConfig {
    page: string; // The page to navigate to (e.g., 'projects', 'leads')
    id?: string; // The ID of the entity (project, lead, etc.)
    tab?: string; // Optional tab to open (e.g., 'quotations', 'tasks')
}

/**
 * Parse notification and determine routing
 */
export const getNotificationRoute = (notification: Notification): NotificationRouteConfig | null => {
    const { entity_type, entity_id } = notification;

    if (!entity_id) {
        return null;
    }

    // Route based on entity type
    switch (entity_type) {
        case 'project':
            // Navigate to project details page
            return {
                page: 'project-details',
                id: entity_id,
                // Try to determine tab from notification title
                tab: inferTabFromNotification(notification),
            };

        case 'lead':
            // Navigate to leads page (could be enhanced to open specific lead)
            return {
                page: 'leads',
                id: entity_id,
            };

        case 'task':
            // Navigate to task or project
            return {
                page: 'my-day', // Or could route to project if we have caseId
                id: entity_id,
            };

        case 'message':
            return {
                page: 'communication',
                id: entity_id,
            };

        case 'system':
            // System notifications might not have a specific route
            return null;

        default:
            return null;
    }
};

/**
 * Infer which tab to open based on notification content
 */
const inferTabFromNotification = (notification: Notification): string | undefined => {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();

    if (title.includes('quotation') || message.includes('quotation')) {
        return 'quotations';
    }

    if (title.includes('drawing') || message.includes('drawing')) {
        return 'drawings';
    }

    if (title.includes('boq') || message.includes('boq')) {
        return 'boq';
    }

    if (title.includes('task') || message.includes('task')) {
        return 'tasks';
    }

    // Default to overview
    return 'overview';
};

/**
 * Handle notification click
 * Call this when user clicks a notification
 */
export const handleNotificationClick = (
    notification: Notification,
    setCurrentPage: (page: string, params?: any) => void,
    markAsRead?: (notificationId: string) => Promise<void>
): void => {
    const route = getNotificationRoute(notification);

    if (!route) {
        console.warn('No route found for notification:', notification);
        return;
    }

    // Mark as read if function provided
    if (markAsRead) {
        markAsRead(notification.id).catch(err =>
            console.error('Failed to mark notification as read:', err)
        );
    }

    // Navigate based on route config
    if (route.page === 'project-details' && route.id) {
        // For project details, we need a special handler
        // This will be implemented in the dashboard component
        setCurrentPage('project-details', {
            caseId: route.id,
            tab: route.tab,
        });
    } else {
        // For other pages, just navigate
        setCurrentPage(route.page, { id: route.id });
    }
};

/**
 * Generate project URL with tab parameter
 * Useful for creating deep links
 */
export const getProjectUrl = (caseId: string, tab?: string): string => {
    const baseUrl = `/projects/${caseId}`;
    return tab ? `${baseUrl}?tab=${tab}` : baseUrl;
};

/**
 * Parse URL parameters for tab
 */
export const getTabFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const params = new URLSearchParams(window.location.search);
    return params.get('tab');
};

/**
 * Set tab in URL without page reload
 */
export const setTabInUrl = (tab: string): void => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
};
