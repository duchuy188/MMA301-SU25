import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Film, Eye, EyeOff } from 'lucide-react-native';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleAuth = () => {
    router.replace('/(tabs)');
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
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mật khẩu"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
            <Text style={styles.primaryButtonText}>Đăng ký</Text>
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
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Mật khẩu"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
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
            <TouchableOpacity>
              <Text style={styles.linkTextGold}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
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
});