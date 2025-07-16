import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Film, Eye, EyeOff } from 'lucide-react-native';
import { login, register } from '../services/auth';
import Toast from 'react-native-toast-message';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // State cho đăng nhập
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State cho đăng ký
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // Xử lý đăng nhập
  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Đăng nhập thất bại',
        text2: 'Vui lòng nhập đầy đủ email và mật khẩu',
        visibilityTime: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password, rememberMe);
      // Chuyển hướng sau khi đăng nhập thành công
      Toast.show({
        type: 'success',
        text1: 'Đăng nhập thành công',
        visibilityTime: 2000,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      let errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Không hiển thị tên lỗi kỹ thuật
        if (error.message.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        }
      }
      
      Toast.show({
        type: 'error',
        text1: 'Đăng nhập thất bại',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đăng ký
  const handleSignUp = async () => {
    if (!fullName || !registerEmail || !phone || !registerPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng điền đầy đủ thông tin',
        visibilityTime: 3000,
      });
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Mật khẩu xác nhận không khớp',
        visibilityTime: 3000,
      });
      return;
    }
    
    if (!acceptTerms) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Vui lòng đồng ý với điều khoản và điều kiện',
        visibilityTime: 3000,
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await register(fullName, registerEmail, phone, registerPassword);
      
      // Xóa dữ liệu form đăng ký
      const tempEmail = registerEmail; // Lưu lại email để điền vào form đăng nhập
      
      setFullName('');
      setRegisterEmail('');
      setPhone('');
      setRegisterPassword('');
      setConfirmPassword('');
      setAcceptTerms(false);
      
      // Chuyển về màn hình đăng nhập ngay lập tức
      setIsSignUp(false);
      setEmail(tempEmail);
      
      // Sau đó hiển thị Toast thông báo thành công
      Toast.show({
        type: 'success',
        text1: 'Đăng ký thành công',
        text2: 'Tài khoản của bạn đã được tạo thành công',
        visibilityTime: 3000,
      });
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 409) {
          errorMessage = 'Email đã được sử dụng. Vui lòng sử dụng email khác.';
        }
      }
      
      Toast.show({
        type: 'error',
        text1: 'Đăng ký thất bại',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  if (isSignUp) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Film size={40} color="#FFD700" />
          <Text style={styles.title}>Galaxy Cinema</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Họ và Tên"
            placeholderTextColor="#666"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            value={registerEmail}
            onChangeText={setRegisterEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mật khẩu"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={registerPassword}
              onChangeText={setRegisterPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="#666"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxSelected]}>
              {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>
              Tôi đồng ý với Điều khoản và Điều kiện
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, registerLoading && styles.disabledButton]} 
            onPress={handleSignUp}
            disabled={registerLoading}
          >
            <Text style={styles.primaryButtonText}>
              {registerLoading ? 'Đang xử lý...' : 'Đăng ký'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsSignUp(false)}
          >
            <Text style={styles.linkText}>
              Bạn đã có tài khoản? <Text style={styles.linkTextGold}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Phần đăng nhập giữ nguyên
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Film size={40} color="#FFD700" />
          <Text style={styles.title}>Galaxy Cinema</Text>
          <Text style={styles.subtitle}>Chào mừng trở lại!</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mật khẩu"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxSelected]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>Ghi nhớ tôi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.linkTextGold}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => setIsSignUp(true)}
          >
            <Text style={styles.linkText}>
              Chưa có tài khoản? <Text style={styles.linkTextGold}>Đăng ký tại đây</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Styles giữ nguyên
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: '#FFD700',
    marginTop: 12,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#F7E7CE',
    marginTop: 8,
    opacity: 0.9,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333',
    fontFamily: 'Montserrat-Regular',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFD700',
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#000000',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
  },
  linkTextGold: {
    color: '#FFD700',
    fontFamily: 'Montserrat-Medium',
  },
  disabledButton: {
    backgroundColor: '#A89347',
    opacity: 0.7,
  },
});