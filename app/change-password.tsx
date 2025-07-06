import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { changePassword } from '../services/auth';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    // Đóng toast hiện tại nếu có
    Toast.hide();
    
    console.log("Checking inputs:", {
      currentPassword: currentPassword.length,
      newPassword: newPassword.length,
      confirmPassword: confirmPassword.length
    });
    
    // Kiểm tra các trường nhập liệu
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập đầy đủ thông tin',
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Mật khẩu xác nhận không khớp',
        visibilityTime: 3000,
        topOffset: 60,
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Đang gửi yêu cầu đổi mật khẩu...");
      await changePassword(currentPassword, newPassword);
      console.log("Đổi mật khẩu thành công!");
      
      Toast.show({
        type: 'success',
        text1: 'Đổi mật khẩu thành công',
        visibilityTime: 3000,
        topOffset: 60,
      });
      
      // Quay lại màn hình trước
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error: any) {
      console.log("Lỗi khi đổi mật khẩu:", error.message || error);
      
      Toast.show({
        type: 'error',
        text1: error.message || 'Không thể đổi mật khẩu',
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Mật khẩu hiện tại */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#FFD700" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#666"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                {showCurrentPassword ? (
                  <EyeOff size={20} color="#FFD700" />
                ) : (
                  <Eye size={20} color="#FFD700" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Mật khẩu mới */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mật khẩu mới</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#FFD700" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeOff size={20} color="#FFD700" />
                ) : (
                  <Eye size={20} color="#FFD700" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Xác nhận mật khẩu mới */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#FFD700" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
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
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.confirmButtonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  form: {
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Montserrat-Medium',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222222',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});