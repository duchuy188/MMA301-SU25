import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Định dạng dữ liệu người dùng
export interface User {
  name: string;
  phone: string;
  email: string;
}

// Interface cho dữ liệu đăng ký
export interface RegisterData {
  name: string;
  phone: string;
  email: string;
  password: string;
}

// Key lưu trữ trong AsyncStorage
const USER_KEY = '@BusGo:user';
const AUTH_KEY = '@BusGo:isLoggedIn';
const USERS_KEY = '@BusGo:users'; // Key để lưu danh sách người dùng đã đăng ký

// Tạo hook useAuth
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kiểm tra trạng thái đăng nhập khi khởi động
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Kiểm tra trạng thái đăng nhập từ AsyncStorage
  const checkLoginStatus = async () => {
    try {
      setIsLoading(true);

      const storedLoginStatus = await AsyncStorage.getItem(AUTH_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedLoginStatus === 'true' && storedUser) {
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

  // Đăng ký tài khoản mới
  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Lấy danh sách người dùng đã đăng ký (nếu có)
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      const users = storedUsers ? JSON.parse(storedUsers) : [];

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = users.find((u: RegisterData) => u.email === data.email);
      if (existingUser) {
        Alert.alert('Lỗi đăng ký', 'Email này đã được sử dụng. Vui lòng chọn email khác.');
        return false;
      }

      // Thêm người dùng mới vào danh sách
      users.push(data);

      // Lưu danh sách người dùng mới vào AsyncStorage
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      Alert.alert('Lỗi đăng ký', 'Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại sau.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Kiểm tra thông tin đăng nhập từ danh sách người dùng đã đăng ký
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const foundUser = users.find(
          (u: RegisterData) => u.email === email && u.password === password
        );

        if (foundUser) {
          // Tạo đối tượng user để lưu trữ (loại bỏ mật khẩu)
          const userInfo: User = {
            name: foundUser.name,
            phone: foundUser.phone,
            email: foundUser.email,
          };

          // Lưu trạng thái đăng nhập vào AsyncStorage
          await AsyncStorage.setItem(AUTH_KEY, 'true');
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));

          setIsLoggedIn(true);
          setUser(userInfo);

          return true;
        }
      }

      // Nếu không tìm thấy người dùng hoặc mật khẩu sai
      Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng');
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Lỗi đăng nhập', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại sau.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);

      // Xóa thông tin đăng nhập khỏi AsyncStorage
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Đặt lại mật khẩu
  const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Lấy danh sách người dùng
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      if (!storedUsers) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return false;
      }

      const users = JSON.parse(storedUsers);

      // Tìm người dùng với email tương ứng
      const userIndex = users.findIndex((u: RegisterData) => u.email === email);
      if (userIndex === -1) {
        Alert.alert('Lỗi', 'Không tìm thấy tài khoản với email này');
        return false;
      }

      // Cập nhật mật khẩu
      users[userIndex].password = newPassword;

      // Lưu lại danh sách người dùng đã cập nhật
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đặt lại mật khẩu');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Kiểm tra lại trạng thái đăng nhập (hữu ích khi cần refresh)
  const refreshAuthStatus = () => {
    checkLoginStatus();
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
  };
};

// Sử dụng cả hai cách export để đảm bảo tính tương thích
export { useAuth };
export default useAuth;
