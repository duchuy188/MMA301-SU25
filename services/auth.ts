import api from './api';

let currentToken: string | null = null;
let currentUser: any = null;

export const register = async (fullName: string, email: string, phone: string, password: string) => {
  try {
    const userData = {
      name: fullName,
      email,
      password,
      phone,
      role: "member"
    };
    
    console.log('Dữ liệu đăng ký:', userData);
    
    const response = await api.post('/auth/register', userData);
    console.log('Đăng ký thành công:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    if (response.data.token) {
      currentToken = response.data.token;
      currentUser = response.data.user;
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
    }
    
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    throw error;
  }
};

export const logout = () => {
  currentToken = null;
  currentUser = null;
  delete api.defaults.headers.common['Authorization'];
};

export const getToken = (): string | null => {
  return currentToken;
};

export const getCurrentUser = (): any => {
  return currentUser;
};

// Thêm các hàm quên mật khẩu với TypeScript
export const forgotPassword = async (email: string): Promise<boolean> => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return true;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return true;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<boolean> => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      newPassword
    });
    return true;
  } catch (error) {
    throw error;
  }
};

export const resendOtp = async (email: string): Promise<boolean> => {
  return await forgotPassword(email);
};

export const getProfile = async (): Promise<any> => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (userData: FormData): Promise<any> => {
  try {
    const response = await api.put('/auth/profile', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};