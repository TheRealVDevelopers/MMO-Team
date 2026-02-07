import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Case } from '../../../types';
import { FIRESTORE_COLLECTIONS } from '../../../constants';

interface Props {
  caseId: string | null;
}

const ExecutionTimeline: React.FC<Props> = ({ caseId }) => {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }

    const fetchCase = async () => {
      try {
        const caseRef = doc(db, FIRESTORE_COLLECTIONS.CASES, caseId);
        const caseSnap = await getDoc(caseRef);
        
        if (caseSnap.exists()) {
          setCaseData(caseSnap.data() as Case);
        }
      } catch (error) {
        console.error('Error fetching case:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCase();
  }, [caseId]);

  if (!caseId) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No project selected.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!caseData?.executionPlan) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Execution Timeline</h1>
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <p className="text-text-secondary text-lg">No execution plan created yet.</p>
        </div>
      </div>
    );
  }

  const { executionPlan } = caseData;
  const totalDays = executionPlan.endDate && executionPlan.startDate
    ? Math.ceil((new Date(executionPlan.endDate).getTime() - new Date(executionPlan.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const getPhasePosition = (phase: any) => {
    if (!executionPlan.startDate) return { left: 0, width: 0 };
    
    const projectStart = new Date(executionPlan.startDate).getTime();
    const phaseStart = new Date(phase.startDate).getTime();
    const phaseEnd = new Date(phase.endDate).getTime();
    
    const startOffset = ((phaseStart - projectStart) / (1000 * 60 * 60 * 24)) / totalDays * 100;
    const duration = ((phaseEnd - phaseStart) / (1000 * 60 * 60 * 24)) / totalDays * 100;
    
    return {
      left: `${startOffset}%`,
      width: `${duration}%`
    };
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Execution Timeline</h1>
      
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">{caseData.title}</h2>
            <p className="text-sm text-text-secondary">
              {formatDate(executionPlan.startDate)} - {formatDate(executionPlan.endDate)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Total Duration</p>
            <p className="text-lg font-semibold">{totalDays} days</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-6">Phase Timeline</h3>
        
        {/* Timeline visualization */}
        <div className="space-y-6">
          {executionPlan.phases.map((phase: any, idx: number) => {
            const position = getPhasePosition(phase);
            const phaseDays = Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={idx} className="relative">
                <div className="flex items-center mb-2">
                  <div className="w-32 text-sm font-medium">{phase.name}</div>
                  <div className="flex-1 ml-4 relative">
                    {/* Background track */}
                    <div className="h-8 bg-gray-200 rounded-lg relative overflow-hidden">
                      {/* Phase bar */}
                      <div
                        className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                        style={position}
                      >
                        {phaseDays} days
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center ml-36">
                  <div className="text-xs text-text-secondary">
                    {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
                  </div>
                  <div className="ml-auto text-xs font-medium text-blue-600">
                    ₹{phase.estimatedCost?.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Total Estimated Cost:</span>
              <span className="font-semibold text-text-primary">
                ₹{executionPlan.phases.reduce((sum: number, p: any) => sum + (p.estimatedCost || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionTimeline;
