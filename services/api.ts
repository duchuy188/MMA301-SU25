import axios from 'axios';


const API_URL = 'https://galaxyticket-backend-sdn302-su25.onrender.com/api';

// Bỏ console.log ở đây
// console.log('Đang kết nối đến API:', API_URL);


const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});


api.interceptors.request.use(
  config => {
    // Bỏ console.log ở đây
    return config;
  },
  error => {
    // Bỏ console.error ở đây
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  response => {
    // Bỏ console.log ở đây
    return response;
  },
  error => {
    // Bỏ tất cả các console.log và console.error ở đây
    return Promise.reject(error);
  }
);

export default api;