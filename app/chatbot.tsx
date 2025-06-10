import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Send, Bus, Navigation, Ticket, CalendarClock, MapPin } from 'lucide-react-native';

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  suggestions?: Suggestion[];
}

// Định nghĩa kiểu dữ liệu cho gợi ý
interface Suggestion {
  id: string;
  text: string;
  icon: string; // Tên icon
  action: string; // Loại hành động khi nhấp vào
}

// Danh sách các gợi ý mặc định khi bắt đầu chat
const initialSuggestions: Suggestion[] = [
  { id: '1', text: 'Tìm tuyến xe', icon: 'search', action: 'search_route' },
  { id: '2', text: 'Đặt vé xe', icon: 'ticket', action: 'book_ticket' },
  { id: '3', text: 'Kiểm tra vé của tôi', icon: 'check', action: 'check_tickets' },
  { id: '4', text: 'Tra cứu lịch trình', icon: 'calendar', action: 'schedule' },
  { id: '5', text: 'Tìm bến xe gần đây', icon: 'map', action: 'nearby_stations' },
];

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là BusGo Assistant, tôi có thể giúp gì cho bạn?',
      isUser: false,
      timestamp: new Date(),
      suggestions: initialSuggestions,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Cuộn xuống tin nhắn mới nhất khi có tin nhắn mới
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Xử lý khi người dùng gửi tin nhắn
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Giả lập bot đang trả lời
    setTimeout(() => {
      handleBotResponse(inputText);
      setIsTyping(false);
    }, 1000);
  };

  // Xử lý phản hồi của bot dựa trên tin nhắn của người dùng
  const handleBotResponse = (userInput: string) => {
    const lowercaseInput = userInput.toLowerCase();
    let botMessage: Message;

    // Phản hồi dựa trên từ khóa trong tin nhắn người dùng
    if (lowercaseInput.includes('đặt vé') || lowercaseInput.includes('mua vé')) {
      botMessage = {
        id: Date.now().toString(),
        text: 'Bạn muốn đặt vé xe buýt? Vui lòng cho tôi biết điểm đi và điểm đến của bạn.',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          { id: '1', text: 'Hà Nội - Sài Gòn', icon: 'route', action: 'route_hn_sg' },
          { id: '2', text: 'Đà Nẵng - Huế', icon: 'route', action: 'route_dn_hue' },
          { id: '3', text: 'Nha Trang - Đà Lạt', icon: 'route', action: 'route_nt_dl' },
        ],
      };
    } else if (
      lowercaseInput.includes('tìm tuyến') ||
      lowercaseInput.includes('tuyến xe') ||
      lowercaseInput.includes('lộ trình')
    ) {
      botMessage = {
        id: Date.now().toString(),
        text: 'Bạn muốn tìm tuyến xe? Vui lòng chọn một trong những tùy chọn sau:',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          { id: '1', text: 'Tìm theo địa điểm', icon: 'map-pin', action: 'search_by_location' },
          { id: '2', text: 'Xem tất cả các tuyến', icon: 'list', action: 'all_routes' },
          { id: '3', text: 'Tuyến phổ biến', icon: 'star', action: 'popular_routes' },
        ],
      };
    } else if (lowercaseInput.includes('vé của tôi') || lowercaseInput.includes('kiểm tra vé')) {
      botMessage = {
        id: Date.now().toString(),
        text: 'Đang chuyển đến trang vé của bạn...',
        isUser: false,
        timestamp: new Date(),
      };
      // Chuyển đến màn hình vé sau 1 giây
      setTimeout(() => {
        router.push('/(tabs)/tickets');
      }, 1000);
    } else if (lowercaseInput.includes('lịch trình') || lowercaseInput.includes('giờ xe')) {
      botMessage = {
        id: Date.now().toString(),
        text: 'Bạn muốn xem lịch trình xe? Vui lòng chọn tuyến xe cụ thể:',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          { id: '1', text: 'Xe buýt nội thành', icon: 'bus', action: 'city_bus' },
          { id: '2', text: 'Xe liên tỉnh', icon: 'truck', action: 'intercity_bus' },
        ],
      };
    } else if (lowercaseInput.includes('bến xe') || lowercaseInput.includes('gần đây')) {
      botMessage = {
        id: Date.now().toString(),
        text: 'Đang tìm bến xe gần vị trí của bạn... Để tiếp tục, bạn cần cấp quyền truy cập vị trí.',
        isUser: false,
        timestamp: new Date(),
        suggestions: [
          { id: '1', text: 'Cho phép truy cập vị trí', icon: 'map-pin', action: 'allow_location' },
          { id: '2', text: 'Nhập địa chỉ thủ công', icon: 'edit', action: 'manual_location' },
        ],
      };
    } else {
      botMessage = {
        id: Date.now().toString(),
        text: 'Tôi có thể giúp gì thêm cho bạn?',
        isUser: false,
        timestamp: new Date(),
        suggestions: initialSuggestions,
      };
    }

    setMessages((prev) => [...prev, botMessage]);
  };

  // Xử lý khi người dùng nhấp vào một gợi ý
  const handleSuggestionPress = (suggestion: Suggestion) => {
    // Thêm tin nhắn từ người dùng dựa trên gợi ý đã chọn
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion.text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Xử lý theo loại hành động
    setTimeout(() => {
      switch (suggestion.action) {
        case 'search_route':
          handleBotResponse('tìm tuyến xe');
          break;
        case 'book_ticket':
          handleBotResponse('đặt vé');
          break;
        case 'check_tickets':
          handleBotResponse('vé của tôi');
          break;
        case 'schedule':
          handleBotResponse('lịch trình');
          break;
        case 'nearby_stations':
          handleBotResponse('bến xe gần đây');
          break;
        case 'route_hn_sg':
        case 'route_dn_hue':
        case 'route_nt_dl':
          // Giả lập chuyển đến trang đặt vé
          const botResponseSearch = {
            id: Date.now().toString(),
            text: `Đang tìm kiếm tuyến xe cho lộ trình ${suggestion.text}...`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botResponseSearch]);
          setTimeout(() => {
            router.push('/booking');
          }, 1000);
          break;
        default:
          // Xử lý các trường hợp khác
          handleBotResponse(suggestion.text);
          break;
      }
      setIsTyping(false);
    }, 1000);
  };

  // Hiển thị biểu tượng cho từng loại gợi ý
  const renderSuggestionIcon = (iconName: string) => {
    switch (iconName) {
      case 'search':
        return <Navigation size={18} color="#2563EB" />;
      case 'ticket':
        return <Ticket size={18} color="#2563EB" />;
      case 'check':
        return <Ticket size={18} color="#2563EB" />;
      case 'calendar':
        return <CalendarClock size={18} color="#2563EB" />;
      case 'map':
      case 'map-pin':
        return <MapPin size={18} color="#2563EB" />;
      case 'bus':
      case 'route':
        return <Bus size={18} color="#2563EB" />;
      default:
        return <Bus size={18} color="#2563EB" />;
    }
  };

  // Hiển thị tin nhắn
  const renderMessage = (message: Message) => {
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!message.isUser && (
          <View style={styles.botAvatar}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712010.png' }}
              style={{ width: 30, height: 30 }}
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, message.isUser ? styles.userMessageText : {}]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  // Hiển thị các gợi ý
  const renderSuggestions = (suggestions?: Suggestion[]) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              {renderSuggestionIcon(suggestion.icon)}
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BusGo Assistant</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View key={message.id}>
              {renderMessage(message)}
              {message.suggestions && renderSuggestions(message.suggestions)}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.botMessageContainer]}>
              <View style={styles.botAvatar}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712010.png' }}
                  style={{ width: 30, height: 30 }}
                />
              </View>
              <View style={[styles.messageBubble, styles.botMessageBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingTop: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    maxWidth: '100%',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '75%',
  },
  botMessageBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1F2937',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 44,
  },
  suggestionButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 48,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 15,
    bottom: 15,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  typingBubble: {
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  typingIndicator: {
    flexDirection: 'row',
    width: 32,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  typingDot2: {
    opacity: 0.7,
    transform: [{ scale: 1 }],
  },
  typingDot3: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
});
