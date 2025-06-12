import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { authApi } from '../services/api';
import { User, RegisterData, AuthResponse } from '../types/api';
import { useRouter } from 'expo-router';


const USER_KEY = '@BusGo:user';
const TOKEN_KEY = '@BusGo:token';


const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (token && storedUser) {
        setIsLoggedIn(true);
        setUser(JSON.parse(storedUser));
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authApi.register(data);
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);
     
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
      
      setUser(response.user);
      setIsLoggedIn(true);
      return true;
    } catch (error: any) {
      console.error('Error during login:', error);
  
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      setIsLoading(true);
  
      await authApi.logout();
      

      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);


      setIsLoggedIn(false);
      setUser(null);

  
      router.replace('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi đăng xuất');
    } finally {
      setIsLoading(false);
    }
  };


  const resetPassword = async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authApi.resetPassword(email, otp, newPassword);
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };


  const refreshAuthStatus = () => {
    checkLoginStatus();
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authApi.forgotPassword(email);
      return true;
    } catch (error) {
      console.error('Error during forgot password:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await authApi.resendOtp(email);
      return true;
    } catch (error) {
      console.error('Error resending OTP:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoggedIn,
    user,
    isLoading,
    register,
    login,
    logout,
    resetPassword,
    refreshAuthStatus,
    forgotPassword,
    resendOtp,
  };
};

// Sử dụng cả hai cách export để đảm bảo tính tương thích
export { useAuth };
export default useAuth;
