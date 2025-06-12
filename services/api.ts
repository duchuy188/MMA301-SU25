import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RegisterData } from '../types/api';
import { Alert } from 'react-native';

const BASE_URL = 'https://bebusticketsalessystem-1.onrender.com';
export const TOKEN_KEY = '@BusGo:token';
export const USER_KEY = '@BusGo:user';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
   
    const errorMessage = error.response?.data?.error || 'Đã có lỗi xảy ra';
    Alert.alert('Thông báo', errorMessage); 
    return Promise.reject(error.response?.data); 
  }
);

// Auth APIs
export const authApi = {
  register: async (data: RegisterData) => {
    console.log('Register data:', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password
    });
    const response = await api.post('/api/users/signup', {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/api/users/signin', { email, password });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/api/users/forgot-password', { email });
    return response.data;
  },

  resendOtp: async (email: string) => {
    const response = await api.post('/api/users/resend-otp', { email });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const response = await api.post('/api/users/reset-password', {
      email,
      otp,
      newPassword
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/users/signout');
    return response.data;
  },
};

// Trip APIs
export const tripApi = {
  getAllTrips: async () => {
    const response = await api.get('/api/trip');
    return response.data;
  },

  getTripById: async (id: string) => {
    const response = await api.get(`/api/trip/${id}`);
    return response.data;
  },

  updateTrip: async (id: string, data: any) => {
    const response = await api.put(`/api/trip/${id}`, data);
    return response.data;
  },

  deleteTrip: async (id: string) => {
    const response = await api.delete(`/api/trip/${id}`);
    return response.data;
  },
};

export default api;