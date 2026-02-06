import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';

/**
 * Hook to handle notification click navigation
 * Maps notification types to appropriate routes and opens specific modals/views
 */
export const useNotificationRouter = () => {
    const navigate = useNavigate();

    const handleNotificationClick = (notification: Notification) => {
        const { entity_type, entity_id, title, message } = notification;

        // Route based on notification entity type
        switch (entity_type) {
            case 'lead':
                // Navigate to leads page and open the specific lead
                navigate(`/leads?openLead=${entity_id}`);
                break;

            case 'project':
                // Navigate to projects page and open the specific project
                navigate(`/projects?openProject=${entity_id}`);
                break;

            case 'task':
                // Check if it's a drawing task, site visit, or other task type
                if (title.toLowerCase().includes('drawing')) {
                    navigate(`/site-engineer?page=drawings&openTask=${entity_id}`);
                } else if (title.toLowerCase().includes('site visit') || title.toLowerCase().includes('inspection')) {
                    navigate(`/site-engineer?page=schedule&openVisit=${entity_id}`);
                } else {
                    navigate(`/my-day?openTask=${entity_id}`);
                }
                break;

            case 'message':
                // Navigate to communication page
                navigate(`/communication?openChat=${entity_id}`);
                break;

            case 'system':
                // Handle system notifications
                if (message.toLowerCase().includes('request') || message.toLowerCase().includes('approval')) {
                    // Navigate to requests/inbox page
                    navigate(`/requests?openRequest=${entity_id}`);
                } else if (message.toLowerCase().includes('validation')) {
                    // Navigate to validation requests
                    navigate(`/admin?page=requests&filter=validation`);
                } else {
                    // Default to dashboard
                    navigate('/dashboard');
                }
                break;

            default:
                // If no specific entity type, try to infer from title/message
                if (title.toLowerCase().includes('request') || message.toLowerCase().includes('request')) {
                    navigate(`/requests`);
                } else if (title.toLowerCase().includes('lead')) {
                    navigate('/leads');
                } else {
                    navigate('/dashboard');
                }
        }
    };

    /**
     * Get route info without navigating (for preview/testing)
     */
    const getRouteInfo = (notification: Notification): { path: string; description: string } => {
        const { entity_type, entity_id, title } = notification;

        switch (entity_type) {
            case 'lead':
                return { path: `/leads?openLead=${entity_id}`, description: 'Opens Lead Management with specific lead' };
            case 'project':
                return { path: `/projects?openProject=${entity_id}`, description: 'Opens Projects with specific project' };
            case 'task':
                if (title.toLowerCase().includes('drawing')) {
                    return { path: `/site-engineer?page=drawings&openTask=${entity_id}`, description: 'Opens Drawing Tasks page' };
                } else if (title.toLowerCase().includes('site visit')) {
                    return { path: `/site-engineer?page=schedule&openVisit=${entity_id}`, description: 'Opens Site Inspections page' };
                }
                return { path: `/my-day?openTask=${entity_id}`, description: 'Opens My Day with specific task' };
            case 'message':
                return { path: `/communication?openChat=${entity_id}`, description: 'Opens Communication with specific chat' };
            case 'system':
                return { path: '/requests', description: 'Opens Requests/Inbox' };
            default:
                return { path: '/dashboard', description: 'Opens Dashboard' };
        }
    };

    return {
        handleNotificationClick,
        getRouteInfo
    };
};
