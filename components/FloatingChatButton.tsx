import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function FloatingChatButton() {
  // Khi nhấn nút, chuyển ngay đến trang chatbot
  const handlePress = () => {
    router.push('/chatbot');
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MessageCircle size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2563EB',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 100,
  }
});
