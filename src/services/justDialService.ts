/**
 * JustDial Service - Stub for backward compatibility
 * @deprecated JustDial integration needs to be rebuilt
 */

export const fetchJustDialLeads = async (): Promise<any[]> => {
  console.warn('JustDial integration needs to be rebuilt');
  return [];
};

export const importJustDialLeadsToFirestore = async (leads: any[]): Promise<void> => {
  console.warn('JustDial integration needs to be rebuilt');
};

export const isJustDialConfigured = (): boolean => {
  return false;
};
