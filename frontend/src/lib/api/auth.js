import client from './client';

export const login = async (email, password) => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email, password, fullName, department, role) => {
  const response = await client.post('/auth/register', {
    email,
    password,
    full_name: fullName,
    department,
    role
  });
  return response.data;
};
