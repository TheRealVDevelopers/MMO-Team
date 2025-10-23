
import React, { useState, useMemo } from 'react';
import Card from '../../shared/Card';
import { USERS, LEADS } from '../../../constants';
import { User, UserRole, LeadPipelineStatus } from '../../../types';
import { MapPinIcon, FunnelIcon } from '../../icons/IconComponents';

const salesTeam = USERS.filter(u => u.role === UserRole.SALES_TEAM_MEMBER);
const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

const TeamMemberCard: React.FC<{ member: User }> = ({ member }) => {
    const memberLeads = LEADS.filter(l => l.assignedTo === member.id);
    const activeLeads = memberLeads.filter(l => ![LeadPipelineStatus.WON, LeadPipelineStatus.LOST].includes(l.status)).length;
    const wonLeads = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).length;
    const conversionRate = memberLeads.length > 0 ? (wonLeads / memberLeads.length) * 100 : 0;
    const revenue = memberLeads.filter(l => l.status === LeadPipelineStatus.WON).reduce((sum, l) => sum + l.value, 0);

    return (
        <Card className="flex flex-col">
            <div className="flex items-start space-x-4">
                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                <div>
                    <h4 className="text-md font-bold text-text-primary">{member.name}</h4>
                    <p className="text-sm text-text-secondary flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1"/> {member.region}
                    </p>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm flex-grow">
                <div>
                    <p className="text-text-secondary">Active Leads</p>
                    <p className="font-bold text-lg text-text-primary">{activeLeads}</p>
                </div>
                <div>
                    <p className="text-text-secondary">Conversion</p>
                    <p className="font-bold text-lg text-text-primary">{conversionRate.toFixed(1)}%</p>
                </div>
                <div className="col-span-2">
                    <p className="text-text-secondary">Revenue Generated</p>
                    <p className="font-bold text-lg text-secondary">{formatCurrency(revenue)}</p>
                </div>
            </div>
            <button className="mt-4 w-full py-1.5 bg-subtle-background text-text-primary text-sm font-semibold rounded-md hover:bg-border">View Details</button>
        </Card>
    );
};

const TeamManagementPage: React.FC = () => {
    const [regionFilter, setRegionFilter] = useState<'all' | string>('all');

    const filteredTeam = useMemo(() => {
        if (regionFilter === 'all') return salesTeam;
        return salesTeam.filter(member => member.region === regionFilter);
    }, [regionFilter]);
    
    const regions = [...new Set(salesTeam.map(m => m.region).filter(Boolean))] as string[];

    return (
        <div className="space-y-6">
            <div className="sm:flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">Team Management</h2>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <FunnelIcon className="w-5 h-5 text-text-secondary" />
                    <select 
                        value={regionFilter} 
                        onChange={e => setRegionFilter(e.target.value)}
                        className="px-3 py-1.5 border border-border rounded-md text-sm bg-surface focus:ring-primary focus:border-primary"
                    >
                        <option value="all">All Regions</option>
                        {regions.map(region => <option key={region} value={region}>{region}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTeam.map(member => (
                    <TeamMemberCard key={member.id} member={member} />
                ))}
            </div>
        </div>
    );
};

export default TeamManagementPage;