import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Mail, Send, Lock, Eye, EyeOff, CheckCircle2, Film } from 'lucide-react-native';
import { forgotPassword, verifyOtp, resetPassword, resendOtp } from '../services/auth';


// Các bước trong quy trình quên mật khẩu
enum ForgotPasswordStep {
  EMAIL_INPUT = 0,
  VERIFICATION_CODE = 1,
  NEW_PASSWORD = 2,
  SUCCESS = 3
}

export default function ForgotPasswordScreen() {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(ForgotPasswordStep.EMAIL_INPUT);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!email) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const success = await forgotPassword(email);
      if (success) {
        setCountdown(60); 
        setCurrentStep(ForgotPasswordStep.VERIFICATION_CODE);
      }
    } catch (error: any) {
      // Hiển thị thông báo lỗi tùy chỉnh thay vì lỗi mặc định
      let errorMessage = 'Không thể gửi mã xác nhận. Vui lòng thử lại sau.';
      
      if (error.response?.data?.message) {
        if (error.response.data.message === "Không tìm thấy người dùng") {
          errorMessage = "Email này chưa được đăng ký trong hệ thống.";
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã xác nhận');
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyOtp(email, verificationCode);
      if (success) {
        setCurrentStep(ForgotPasswordStep.NEW_PASSWORD);
      }
    } catch (error: any) {
      let errorMessage = 'Mã xác nhận không hợp lệ. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
      return;
    }

    // Đã bỏ đoạn kiểm tra độ mạnh mật khẩu

    setIsLoading(true);
    try {
      const success = await resetPassword(email, verificationCode, newPassword);
      if (success) {
        setCurrentStep(ForgotPasswordStep.SUCCESS);
      }
    } catch (error: any) {
      let errorMessage = 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu. Vui lòng thử lại.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const success = await resendOtp(email);
      if (success) {
        setCountdown(60);
        Alert.alert('Thông báo', 'Đã gửi lại mã OTP mới vào email của bạn');
      }
    } catch (error: any) {
      let errorMessage = 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Thông báo', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case ForgotPasswordStep.EMAIL_INPUT:
        return (
          <>
            <View style={styles.instructionContainer}>
              <Text style={styles.title}>Đặt lại mật khẩu</Text>
              <Text style={styles.subtitle}>
                Nhập địa chỉ email bạn đã đăng ký. Chúng tôi sẽ gửi mã xác nhận để bạn có thể đặt lại mật khẩu.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Địa chỉ email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#FFD700" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập địa chỉ email của bạn"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSendVerificationCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.submitButtonText}>Gửi mã xác nhận</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        );

      case ForgotPasswordStep.VERIFICATION_CODE:
        return (
          <>
            <View style={styles.instructionContainer}>
              <Text style={styles.title}>Nhập mã xác nhận</Text>
              <Text style={styles.subtitle}>
                Vui lòng nhập mã xác nhận 6 số đã được gửi đến email {email}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mã xác nhận</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="Nhập mã xác nhận"
                    placeholderTextColor="#666"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận mã</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.resendButton, 
                  countdown > 0 && styles.resendButtonDisabled
                ]} 
                onPress={handleResendOTP}
                disabled={countdown > 0}
              >
                <Text style={styles.resendButtonText}>
                  {countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );

      case ForgotPasswordStep.NEW_PASSWORD:
        return (
          <>
            <View style={styles.instructionContainer}>
              <Text style={styles.title}>Tạo mật khẩu mới</Text>
              <Text style={styles.subtitle}>
                Mã xác nhận hợp lệ. Vui lòng nhập mật khẩu mới của bạn.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#FFD700" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor="#666"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#FFD700" />
                    ) : (
                      <Eye size={20} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#FFD700" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#666"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#FFD700" />
                    ) : (
                      <Eye size={20} color="#FFD700" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.submitButtonText}>Đặt lại mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        );

      case ForgotPasswordStep.SUCCESS:
        return (
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle2 size={48} color="#FFD700" />
            </View>
            <Text style={styles.successTitle}>Đặt lại mật khẩu thành công!</Text>
            <Text style={styles.successText}>
              Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.
            </Text>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.push('/auth')}
            >
              <Text style={styles.backToLoginText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quên mật khẩu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Logo or Image */}
        <View style={styles.imageContainer}>
          <Film size={60} color="#FFD700" />
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicatorContainer}>
          {[0, 1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.stepDot,
                currentStep === step && styles.activeStepDot,
                currentStep > step && styles.completedStepDot
              ]}
            />
          ))}
        </View>

        {/* Content based on current step */}
        {renderStepContent()}

        {/* Back to Login Link - chỉ hiển thị ở bước đầu tiên */}
        {currentStep === ForgotPasswordStep.EMAIL_INPUT && (
          <TouchableOpacity
            style={styles.backToLoginLink}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.backToLoginLinkText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#111111',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFD700',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  completedStepDot: {
    backgroundColor: '#FFD700',
  },
  instructionContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Montserrat-Regular',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
    paddingVertical: 12,
    fontFamily: 'Montserrat-Regular',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 8,
    marginLeft: 0,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A89347',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Bold',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginLinkText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Montserrat-Medium',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  successText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    fontFamily: 'Montserrat-Regular',
  },
  backToLoginButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backToLoginText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Bold',
  },
});