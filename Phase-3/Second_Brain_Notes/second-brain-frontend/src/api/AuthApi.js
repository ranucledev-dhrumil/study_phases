import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function loginUser(credentials) {
  const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
  return response.data;
}

async function registerUser(userData) {
  const response = await axios.post(`${BASE_URL}/auth/register`, userData);
  return response.data;
}

export { loginUser, registerUser };