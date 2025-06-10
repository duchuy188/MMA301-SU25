import React, { useState } from 'react';
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
import { ArrowLeft, Mail, Send, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

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

  // Sử dụng hook useAuth để truy cập hàm resetPassword
  const { resetPassword } = useAuth();

  // Code mẫu để xác thực (trong môi trường thật sẽ được tạo ngẫu nhiên và gửi qua email)
  const mockVerificationCode = "123456";

  // Xử lý gửi yêu cầu đặt lại mật khẩu
  const handleSendVerificationCode = () => {
    // Kiểm tra email đã nhập chưa
    if (!email) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email của bạn');
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setIsLoading(true);

    // Giả lập gửi mã xác nhận
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Đã gửi mã xác nhận',
        `Mã xác nhận đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư và nhập mã để tiếp tục.`,
        [{ text: 'OK' }]
      );
      // Trong bản demo này, chúng ta sẽ tiết lộ mã để dễ sử dụng
      Alert.alert('Demo', `(Demo) Mã xác nhận là: ${mockVerificationCode}`);
      setCurrentStep(ForgotPasswordStep.VERIFICATION_CODE);
    }, 1500);
  };

  // Xử lý xác thực mã
  const handleVerifyCode = () => {
    if (!verificationCode) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã xác nhận');
      return;
    }

    setIsLoading(true);

    // Kiểm tra mã xác nhận có đúng không
    setTimeout(() => {
      setIsLoading(false);

      if (verificationCode === mockVerificationCode) {
        setCurrentStep(ForgotPasswordStep.NEW_PASSWORD);
      } else {
        Alert.alert('Thông báo', 'Mã xác nhận không đúng. Vui lòng thử lại.');
      }
    }, 1000);
  };

  // Xử lý đặt mật khẩu mới
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

    setIsLoading(true);

    try {
      // Gọi hàm resetPassword từ hook useAuth với đúng tham số email và mật khẩu mới
      const success = await resetPassword(email, newPassword);

      if (success) {
        setCurrentStep(ForgotPasswordStep.SUCCESS);
      } else {
        Alert.alert('Thông báo', 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } catch (error) {
      Alert.alert('Thông báo', 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị các bước khác nhau của quy trình đặt lại mật khẩu
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
                  <Mail size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập địa chỉ email của bạn"
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Xác nhận mã</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendButton} onPress={handleSendVerificationCode}>
                <Text style={styles.resendButtonText}>Gửi lại mã</Text>
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
                  <Lock size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#6B7280" />
                    ) : (
                      <Eye size={20} color="#6B7280" />
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
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
              <CheckCircle2 size={48} color="#2563EB" />
            </View>
            <Text style={styles.successTitle}>Đặt lại mật khẩu thành công!</Text>
            <Text style={styles.successText}>
              Mật khẩu của bạn đã được thay đổi thành công. Bạn có thể sử dụng mật khẩu mới để đăng nhập.
            </Text>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.push('/login')}
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
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quên mật khẩu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Logo or Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6357/6357048.png' }}
            style={styles.image}
            resizeMode="contain"
          />
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
            onPress={() => router.push('/login')}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
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
  image: {
    width: 100,
    height: 100,
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
    backgroundColor: '#D1D5DB',
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: '#2563EB',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  completedStepDot: {
    backgroundColor: '#10B981',
  },
  instructionContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    paddingVertical: 12,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 8,
    marginLeft: 0,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginLinkText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backToLoginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  backToLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
