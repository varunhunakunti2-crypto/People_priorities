import client from './client';

export const getPendingApprovals = async () => {
  const response = await client.get('/manager/approvals');
  return response.data;
};

export const updateApprovalStatus = async (id, status) => {
  const response = await client.put(`/manager/approvals/${id}`, { status });
  return response.data;
};

export const getDepartmentBudget = async () => {
  const response = await client.get('/manager/budget');
  return response.data;
};

export const getCategoryBreakdown = async () => {
  const response = await client.get('/manager/budget/breakdown');
  return response.data;
};
