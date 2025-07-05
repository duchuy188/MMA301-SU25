import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, MessageSquare, Bot } from 'lucide-react-native';

// Định nghĩa kiểu dữ liệu cho tin nhắn
type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

// Danh sách các câu trả lời mẫu
const botResponses = [
  "Xin chào! Tôi là Galaxy AI, trợ lý ảo của Galaxy Cinema. Tôi có thể giúp gì cho bạn?",
  "Bạn có thể hỏi tôi về lịch chiếu phim, giá vé, hoặc các ưu đãi hiện có.",
  "Phim 'Avengers: Endgame' sẽ được chiếu vào lúc 19:30 tối nay tại tất cả các rạp Galaxy Cinema.",
  "Để đặt vé, bạn có thể sử dụng tính năng 'Đặt vé' trong ứng dụng hoặc truy cập website của chúng tôi.",
  "Hiện tại chúng tôi có chương trình khuyến mãi 'Mua 1 tặng 1' cho các suất chiếu sớm vào thứ 2 hàng tuần.",
  "Rất tiếc, tôi không thể trả lời câu hỏi này. Bạn có thể liên hệ trực tiếp với nhân viên hỗ trợ qua số hotline 1900 6969.",
  "Galaxy Cinema có mặt tại hơn 20 tỉnh thành trên cả nước với hơn 50 cụm rạp.",
  "Chúng tôi có nhiều loại ghế như Standard, VIP, Deluxe và Premium để bạn lựa chọn.",
  "Bạn có thể tích điểm thành viên cho mỗi lần mua vé và đổi các phần quà hấp dẫn.",
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Xin chào! Tôi là Galaxy AI, trợ lý ảo của Galaxy Cinema. Tôi có thể giúp gì cho bạn?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Cuộn xuống tin nhắn mới nhất khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Xử lý gửi tin nhắn
  const handleSend = () => {
    if (inputText.trim() === '') return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Giả lập bot đang trả lời
    setTimeout(() => {
      // Chọn ngẫu nhiên một câu trả lời từ danh sách
      const randomIndex = Math.floor(Math.random() * botResponses.length);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[randomIndex],
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Định dạng thời gian
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // Render từng tin nhắn
  const renderItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <Bot size={20} color="#FFD700" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text style={item.isUser ? styles.userMessageText : styles.botMessageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <Bot size={30} color="#FFD700" />
        <Text style={styles.headerTitle}>Galaxy AI Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Galaxy AI đang nhập</Text>
          <ActivityIndicator size="small" color="#FFD700" />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? '#000000' : '#666'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 10,
    backgroundColor: '#000000',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#1A1A1A',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  botBubble: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#FFD700',
  },
  timestamp: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 16,
    marginBottom: 8,
  },
  typingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});