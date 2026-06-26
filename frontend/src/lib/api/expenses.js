import client from './client';

export const submitExpense = async ({ amount, category, description }) => {
  const response = await client.post('/expenses/submit', { amount, category, description });
  return response.data;
};

export const getExpenseHistory = async (statusFilter) => {
  const config = {};
  if (statusFilter) {
    config.params = { status: statusFilter };
  }
  const response = await client.get('/expenses/history', config);
  return response.data;
};
