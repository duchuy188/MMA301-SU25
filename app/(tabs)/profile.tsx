import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { User, Phone, Mail, CreditCard, Bell, CircleHelp as HelpCircle, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

const menuItems = [
  {
    id: 1,
    title: 'Thông tin cá nhân',
    icon: User,
    action: 'personal-info',
  },
  {
    id: 2,
    title: 'Phương thức thanh toán',
    icon: CreditCard,
    action: 'payment-methods',
  },
  {
    id: 3,
    title: 'Thông báo',
    icon: Bell,
    action: 'notifications',
  },
  {
    id: 4,
    title: 'Cài đặt',
    icon: Settings,
    action: 'settings',
  },
  {
    id: 5,
    title: 'Trợ giúp',
    icon: HelpCircle,
    action: 'help',
  },
];

export default function ProfileScreen() {
  // Sử dụng hook useAuth để lấy trạng thái đăng nhập và thông tin người dùng
  const { isLoggedIn, user, isLoading, logout, refreshAuthStatus } = useAuth();
  const navigation = useNavigation();

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'personal-info':
        Alert.alert('Thông tin cá nhân', 'Chức năng đang phát triển');
        break;
      case 'payment-methods':
        Alert.alert('Phương thức thanh toán', 'Chức năng đang phát triển');
        break;
      case 'notifications':
        Alert.alert('Thông báo', 'Chức năng đang phát triển');
        break;
      case 'settings':
        Alert.alert('Cài đặt', 'Chức năng đang phát triển');
        break;
      case 'help':
        Alert.alert('Trợ giúp', 'Chức năng đang phát triển');
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            logout();
            Alert.alert('Thành công', 'Đã đăng xuất thành công');
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/login');
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshAuthStatus(); // Gọi hàm refresh từ useAuth
    });

    return unsubscribe;
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>

        <View style={styles.loginPrompt}>
          <User size={64} color="#6B7280" />
          <Text style={styles.loginTitle}>Chưa đăng nhập</Text>
          <Text style={styles.loginSubtitle}>
            Đăng nhập để quản lý vé và thông tin cá nhân
          </Text>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerButtonText}>Đăng ký tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <User size={32} color="#FFFFFF" />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.contactInfo}>
              <Phone size={14} color="#6B7280" />
              <Text style={styles.contactText}>{user?.phone}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Mail size={14} color="#6B7280" />
              <Text style={styles.contactText}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.action)}
              >
                <View style={styles.menuLeft}>
                  <IconComponent size={20} color="#6B7280" />
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>BusGo v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 BusGo. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
  },
  registerButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

