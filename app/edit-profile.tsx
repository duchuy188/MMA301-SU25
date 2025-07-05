import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, X, Edit2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { getProfile, updateProfile } from '../services/auth';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      const user = data.user || data;
      
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || null);
      
      setLoading(false);
    } catch (error) {
      console.error('Lỗi khi tải thông tin:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể tải thông tin',
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  // Hiển thị tùy chọn ảnh khi nhấp vào avatar
  const showImageOptions = () => {
    Alert.alert(
      "Thay đổi ảnh đại diện",
      "Chọn phương thức",
      [
        {
          text: "Chụp ảnh mới",
          onPress: takePhoto
        },
        {
          text: "Chọn từ thư viện",
          onPress: pickImage
        },
        {
          text: "Hủy",
          style: "cancel"
        }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Toast.show({
          type: 'error',
          text1: 'Cần quyền truy cập thư viện ảnh',
          visibilityTime: 3000,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể chọn ảnh',
        visibilityTime: 3000,
      });
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Toast.show({
          type: 'error',
          text1: 'Cần quyền truy cập camera',
          visibilityTime: 3000,
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Lỗi khi chụp ảnh:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể chụp ảnh',
        visibilityTime: 3000,
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập họ tên',
        visibilityTime: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      
      // Thêm avatar nếu có và là ảnh mới (không phải URL từ server)
      if (avatar && !avatar.startsWith('http')) {
        const filename = avatar.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('avatar', {
          uri: avatar,
          name: filename,
          type
        } as any);
      }
      
      await updateProfile(formData);
      
      Toast.show({
        type: 'success',
        text1: 'Cập nhật thành công',
        visibilityTime: 3000,
      });
      
      router.back();
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể cập nhật thông tin',
        visibilityTime: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Avatar section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={showImageOptions}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.cameraIconOverlay}>
                <Camera size={20} color="#000000" />
              </View>
            </TouchableOpacity>
            
            {avatar && (
              <TouchableOpacity style={styles.removeAvatarButton} onPress={() => setAvatar(null)}>
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Họ và tên</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, !editingName && styles.disabledInput]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#666"
                  editable={editingName}
                />
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditingName(!editingName)}
                >
                  <Edit2 size={18} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                editable={false}
                placeholder="Email"
                placeholderTextColor="#666"
              />
              <Text style={styles.helperText}>Email không thể thay đổi</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Số điện thoại</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, !editingPhone && styles.disabledInput]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  editable={editingPhone}
                />
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditingPhone(!editingPhone)}
                >
                  <Edit2 size={18} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.savingButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 30,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  cameraIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  removeAvatarButton: {
    position: 'absolute',
    top: 0,
    right: '35%',
    backgroundColor: '#FF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
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
    flex: 1,
  },
  disabledInput: {
    backgroundColor: '#111111',
    color: '#888888',
  },
  editButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  helperText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#000000',
  },
  savingButton: {
    backgroundColor: '#A89347',
    opacity: 0.7,
  },
});