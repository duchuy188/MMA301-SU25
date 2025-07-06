import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, X, Edit2, Calendar, Lock, Eye, EyeOff } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { getProfile, updateProfile, changePassword } from '../services/auth';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  
  // Date picker state
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (birthday) {
      setTempYear(birthday.getFullYear());
      setTempMonth(birthday.getMonth());
      setTempDay(birthday.getDate());
    }
  }, [birthday]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      const user = data.user || data;
      
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || null);
      
      // Xử lý ngày sinh nếu có
      if (user.birthday) {
        setBirthday(new Date(user.birthday));
      }
      
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

  const handleBirthdayPress = () => {
    if (editingBirthday) {
      setShowDatePicker(true);
    }
  };

  const handleDateChange = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    setBirthday(newDate);
    setShowDatePicker(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
    } catch (error: any) {
      console.error('Lỗi khi cập nhật:', error);
      
      let errorMessage = 'Không thể cập nhật thông tin';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate arrays for picker
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getMonthName = (month: number) => {
    return ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][month];
  };
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const days = Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1);

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
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ngày sinh</Text>
              <View style={styles.inputWrapper}>
                <TouchableOpacity 
                  style={[styles.input, !editingBirthday && styles.disabledInput, styles.dateInput]}
                  onPress={handleBirthdayPress}
                  disabled={!editingBirthday}
                >
                  <Text style={[styles.dateText, !birthday && styles.placeholderText]}>
                    {birthday ? formatDate(birthday) : "Chọn ngày sinh"}
                  </Text>
                  <Calendar size={18} color={editingBirthday ? "#FFD700" : "#666"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setEditingBirthday(!editingBirthday)}
                >
                  <Edit2 size={18} color="#FFD700" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Đặt nút Lưu thay đổi trước nút Đổi mật khẩu */}
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

            {/* Nút đổi mật khẩu được thiết kế lại */}
            <TouchableOpacity
              style={styles.securitySection}
              onPress={() => router.push('/change-password')}
            >
              <View style={styles.securityContent}>
                <Lock size={20} color="#FFD700" />
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityTitle}>Đổi mật khẩu</Text>
                  <Text style={styles.securitySubtitle}>Cập nhật mật khẩu để bảo vệ tài khoản</Text>
                </View>
              </View>
              <ArrowLeft size={20} color="#FFD700" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            
            {/* Thêm khoảng trống dưới cùng để đảm bảo có thể cuộn xuống */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      )}
      
      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
            
            <View style={styles.datePickerContent}>
              {/* Day Picker */}
              <ScrollView style={styles.pickerColumn}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={[
                      styles.pickerItem,
                      tempDay === day && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempDay(day)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempDay === day && styles.pickerItemTextSelected
                    ]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Month Picker */}
              <ScrollView style={styles.pickerColumn}>
                {months.map((month) => (
                  <TouchableOpacity
                    key={`month-${month}`}
                    style={[
                      styles.pickerItem,
                      tempMonth === month && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempMonth(month)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempMonth === month && styles.pickerItemTextSelected
                    ]}>
                      {getMonthName(month)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Year Picker */}
              <ScrollView style={styles.pickerColumn}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={`year-${year}`}
                    style={[
                      styles.pickerItem,
                      tempYear === year && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempYear(year)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempYear === year && styles.pickerItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.datePickerButton, styles.datePickerConfirmButton]}
                onPress={handleDateChange}
              >
                <Text style={[styles.datePickerButtonText, styles.datePickerConfirmText]}>
                  Xác nhận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    paddingBottom: 50,
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
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 48,
  },
  dateText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  placeholderText: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  datePickerContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#333',
  },
  datePickerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: '#FFD700',
  },
  pickerItemText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerItemTextSelected: {
    color: '#000000',
    fontFamily: 'Montserrat-Bold',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#333',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  datePickerConfirmButton: {
    backgroundColor: '#FFD700',
  },
  datePickerButtonText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  datePickerConfirmText: {
    color: '#000000',
  },
  // Style cho nút đổi mật khẩu
  securitySection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333',
  },
  securityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityTextContainer: {
    marginLeft: 12,
  },
  securityTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFD700',
  },
  securitySubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
    opacity: 0.8,
  },
  bottomSpacing: {
    height: 30,
  },
});