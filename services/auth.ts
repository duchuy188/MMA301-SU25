import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentToken: string | null = null;
let currentUser: any = null;


const saveAuthTokens = async (token: string | null, user: any) => {
  try {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    }
  } catch (error) {
    console.error('Lỗi khi lưu token:', error);
  }
};

// Thêm hàm khôi phục token từ AsyncStorage
export const loadAuthTokens = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const userJson = await AsyncStorage.getItem('auth_user');
    
    if (token) {
      currentToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (userJson) {
        currentUser = JSON.parse(userJson);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Lỗi khi khôi phục token:', error);
    return false;
  }
};

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

export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    if (response.data.token) {
      currentToken = response.data.token;
      currentUser = response.data.user;
      api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      
      // Chỉ lưu token vào AsyncStorage nếu rememberMe được bật
      if (rememberMe) {
        await saveAuthTokens(currentToken, currentUser);
      }
    }
    
    return response.data;
  } catch (error: any) {
    // Xử lý lỗi tốt hơn
    if (error.response) {
      // Có response từ server
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.status === 401) {
        throw new Error('Email hoặc mật khẩu không đúng');
      } else {
        throw new Error('Lỗi từ server: ' + error.response.status);
      }
    } else if (error.request) {
      // Không nhận được response
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      // Lỗi khi thiết lập request
      throw new Error('Lỗi khi gửi yêu cầu đăng nhập');
    }
  }
};

export const logout = async () => {
  try {
    currentToken = null;
    currentUser = null;
    delete api.defaults.headers.common['Authorization'];
    
    // Xóa token khỏi AsyncStorage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    // Xóa reviews khi đăng xuất
    await AsyncStorage.removeItem('movieReviews');
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
  }
};

export const getToken = (): string | null => {
  return currentToken;
};

export const getCurrentUser = (): any => {
  return currentUser;
};

export const forgotPassword = async (email: string): Promise<boolean> => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return true;
  } catch (error: any) {
    if (error.response) {
     
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Lỗi từ server: ' + error.response.status);
      }
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      throw new Error('Lỗi khi gửi yêu cầu: ' + error.message);
    }
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

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  try {
    console.log('Sending data:', { currentPassword, newPassword });
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword: newPassword
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.log('Error response:', error.response.data);
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else if (error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error);
      } else {
        throw new Error('Lỗi từ server: ' + error.response.status);
      }
    } else if (error.request) {
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      throw new Error('Lỗi khi gửi yêu cầu: ' + error.message);
    }
  }
};