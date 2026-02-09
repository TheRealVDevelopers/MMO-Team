import React, { useState } from 'react';
import { ClientPortalService } from '../../services/clientPortalService';
import type { JMSDoc } from '../../hooks/usePendingJMS';

interface ClientJMSFormProps {
  caseId: string;
  jmsDoc: JMSDoc;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

const ClientJMSForm: React.FC<ClientJMSFormProps> = ({
  caseId,
  jmsDoc,
  clientId,
  clientName,
  onSuccess,
  onError,
}) => {
  const [itemsDelivered, setItemsDelivered] = useState('');
  const [quantitiesReceived, setQuantitiesReceived] = useState('');
  const [missingItems, setMissingItems] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Confirm that you have reviewed the work and wish to sign off. This will mark the project as completed.')) return;
    setBusy(true);
    try {
      const signatureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=random&length=2`;
      await ClientPortalService.signJMS(caseId, {
        jmsDocId: jmsDoc.id,
        signatureUrl,
        itemsDelivered: itemsDelivered.trim() || undefined,
        quantitiesReceived: quantitiesReceived.trim() || undefined,
        missingItems: missingItems.trim() || undefined,
      }, clientId);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      onError?.('Failed to sign JMS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items delivered (summary)</label>
        <textarea
          value={itemsDelivered}
          onChange={(e) => setItemsDelivered(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="Brief summary of items received"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantities received</label>
        <textarea
          value={quantitiesReceived}
          onChange={(e) => setQuantitiesReceived(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="List quantities as agreed or as delivered"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Missing items (if any)</label>
        <textarea
          value={missingItems}
          onChange={(e) => setMissingItems(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="Leave blank if nothing missing"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all shadow-lg disabled:opacity-50"
      >
        {busy ? 'Signing…' : 'Sign Off Project'}
      </button>
    </form>
  );
};

export default ClientJMSForm;
