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
  Image,
  StatusBar,
  SafeAreaView,
  Animated as RNAnimated,
  Alert,
  ScrollView,
} from 'react-native';
import { Send, Bot, PlusCircle, Monitor, Ticket, Gift, Film, MapPin, Calendar, Star, Info } from 'lucide-react-native';
import { getGeminiResponse } from '../../services/gemini';
import { router } from 'expo-router';
import { Movie, getPublicMovies } from '../../services/movie';
import { Promotion, getActivePromotions } from '../../services/promotion';
import { Theater, getTheaters } from '../../services/theater';
import { getPublicScreenings } from '../../services/screening';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';

// Add shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Định nghĩa kiểu dữ liệu cho tin nhắn
type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  mentionedMovies?: Movie[];
  mentionedPromotions?: Promotion[];
  mentionedTheaters?: Theater[];
  mentionedScreenings?: any[]; // Thêm mảng lịch chiếu được đề cập
  showSeatAdvice?: boolean; // Thêm trường để đánh dấu tin nhắn có chứa tư vấn ghế
};

// Thêm import cho các hình ảnh rạp
const nguyen_van_qua = require('../../assets/images/theater/Nguyễn Văn Quá.jpg');
const truong_chinh = require('../../assets/images/theater/Trường Chinh.jpg');
const huynh_tan_phat = require('../../assets/images/theater/Huỳnh Tấn Phát.jpg');
const trung_chanh = require('../../assets/images/theater/Trung Chánh.jpg');
const nguyen_du = require('../../assets/images/theater/Nguyễn Du.jpg');
const thiso_mall = require('../../assets/images/theater/Thiso Mall.webp');

// Thêm vào phần khai báo kiểu dữ liệu
type QuickReply = {
  text: string;
  onPress: () => void;
  icon?: React.ReactNode;
};

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
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  // Thay đổi khởi tạo ban đầu
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([
    { text: 'Phim đang chiếu', onPress: () => handleQuickReply('Phim đang chiếu'), icon: <Film size={14} color="#FFD700" /> },
    { text: 'Phim sắp chiếu', onPress: () => handleQuickReply('Phim sắp chiếu'), icon: <Calendar size={14} color="#FFD700" /> },
    { text: 'Rạp chiếu', onPress: () => handleQuickReply('Rạp Galaxy Cinema'), icon: <MapPin size={14} color="#FFD700" /> },
    { text: 'Khuyến mãi', onPress: () => handleQuickReply('Khuyến mãi hiện có'), icon: <Gift size={14} color="#FFD700" /> },
    { text: 'Lịch chiếu', onPress: () => handleQuickReply('Lịch chiếu hôm nay'), icon: <Calendar size={14} color="#FFD700" /> },
    { text: 'Tư vấn ghế', onPress: () => handleQuickReply('Tư vấn chọn ghế tốt nhất'), icon: <Info size={14} color="#FFD700" /> },
  ]);
  
  // Hiệu ứng fade in cho header
  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Cuộn xuống tin nhắn mới nhất khi có tin nhắn mới
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Xóa hoàn toàn useEffect này vì bạn đã khởi tạo quickReplies với icon ở trên
  // HOẶC sửa thành:
  useEffect(() => {
    // Thêm tùy chọn "Tư vấn ghế ngồi" vào danh sách quick replies
    setQuickReplies([
      { text: 'Phim đang chiếu', onPress: () => handleQuickReply('Phim đang chiếu'), icon: <Film size={14} color="#FFD700" /> },
      { text: 'Phim sắp chiếu', onPress: () => handleQuickReply('Phim sắp chiếu'), icon: <Calendar size={14} color="#FFD700" /> },
      { text: 'Rạp chiếu', onPress: () => handleQuickReply('Rạp Galaxy Cinema'), icon: <MapPin size={14} color="#FFD700" /> },
      { text: 'Khuyến mãi', onPress: () => handleQuickReply('Khuyến mãi hiện có'), icon: <Gift size={14} color="#FFD700" /> },
      { text: 'Lịch chiếu', onPress: () => handleQuickReply('Lịch chiếu hôm nay'), icon: <Calendar size={14} color="#FFD700" /> },
      { text: 'Tư vấn ghế', onPress: () => handleQuickReply('Tư vấn chọn ghế tốt nhất'), icon: <Info size={14} color="#FFD700" /> },
    ]);
  }, []); // Chỉ chạy một lần khi component mount

  // Nhóm tin nhắn theo ngày
  const groupMessagesByDate = () => {
    const groups: { title: string, data: Message[], id: string }[] = [];
    const messagesByDate: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!messagesByDate[dateStr]) {
        messagesByDate[dateStr] = [];
      }
      
      messagesByDate[dateStr].push(message);
    });
    
    // Chuyển đổi object thành array để render
    Object.keys(messagesByDate).forEach(dateStr => {
      groups.push({
        title: dateStr,
        data: messagesByDate[dateStr],
        id: dateStr
      });
    });
    
    return groups;
  };

  // Xử lý gửi tin nhắn
  const handleSend = async () => {
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

    try {
      // Lấy danh sách phim, khuyến mãi, rạp chiếu và lịch chiếu
      const [movies, promotionsResponse, theaters, screenings] = await Promise.all([
        getPublicMovies(),
        getActivePromotions(),
        getTheaters(),
        getPublicScreenings()
      ]);
      
      const promotions = promotionsResponse.data || [];
      
      // Kiểm tra xem người dùng có đang hỏi về khuyến mãi không
      const isAskingAboutPromotions = [
        'khuyến mãi', 'mã giảm giá', 'voucher', 'coupon', 'ưu đãi', 'giảm giá', 
        'mã', 'code', 'khuyến mại', 'khuyến mại nào', 'khuyến mãi nào'
      ].some(keyword => inputText.toLowerCase().includes(keyword.toLowerCase()));

      // Kiểm tra xem người dùng có đang hỏi về lịch chiếu không
      const isAskingAboutSchedules = inputText.toLowerCase().includes('lịch chiếu') || 
                                    inputText.toLowerCase().includes('giờ chiếu') ||
                                    inputText.toLowerCase().includes('suất chiếu');

      // Kiểm tra xem người dùng có đang hỏi về tư vấn ghế ngồi không
      const isAskingAboutSeats = 
        inputText.toLowerCase().includes('tư vấn chọn ghế') || 
        inputText.toLowerCase().includes('ghế tốt nhất') ||
        inputText.toLowerCase().includes('chỗ ngồi') ||
        inputText.toLowerCase().includes('vị trí ngồi') ||
        inputText.toLowerCase().includes('nên ngồi đâu') ||
        inputText.toLowerCase().includes('ghế nào đẹp');

      // Nếu người dùng chỉ đang hỏi về khuyến mãi
      if (isAskingAboutPromotions) {
        try {
          // Tạo tin nhắn hiển thị tất cả khuyến mãi hiện có
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
            text: "Đây là các khuyến mãi hiện có tại Galaxy Cinema 🎁✨",
        isUser: false,
        timestamp: new Date(),
            mentionedPromotions: promotions // Hiển thị tất cả khuyến mãi từ API
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
          return; // Thêm return để tránh tiếp tục xử lý
        } catch (error) {
          console.error('Error fetching promotions:', error);
        }
      }
      
      // Thêm kiểm tra trong hàm handleSend
      const isAskingAboutAllTheaters = 
        inputText.toLowerCase() === 'rạp' || 
        inputText.toLowerCase() === 'rạp galaxy cinema' ||
        inputText.toLowerCase() === 'galaxy cinema' ||
        inputText.toLowerCase() === 'các rạp' ||
        inputText.toLowerCase() === 'danh sách rạp';

      const isAskingAboutSpecificTheater = 
        inputText.toLowerCase().includes('rạp') && 
        (inputText.toLowerCase().includes('quận') || 
         inputText.toLowerCase().includes('huyện') ||
         inputText.toLowerCase().includes('thành phố') ||
         inputText.toLowerCase().includes('tp') ||
         inputText.toLowerCase().includes('đường') ||
         inputText.toLowerCase().includes('gần') ||
         inputText.toLowerCase().includes('ở đâu'));

      // Kiểm tra xem người dùng có đang hỏi về tư vấn ghế ngồi không
      if (isAskingAboutSeats) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Mình sẽ tư vấn cho bạn về vị trí ghế ngồi tốt nhất tại Galaxy Cinema nhé! 🍿🎬\n\n" +
                "👑 Ghế giữa rạp (hàng F-G, cột 3-6): Tầm nhìn tốt nhất, trải nghiệm âm thanh cân bằng\n\n" +
                "✨ Ghế VIP (thường là hàng G-H): Thoải mái hơn, rộng hơn và có giá cao hơn\n\n" +
                "🚶 Ghế cuối rạp (hàng A-B): Phù hợp cho người muốn dễ ra vào, nhưng phải ngước lên xem\n\n" +
                "🎭 Ghế đầu rạp (hàng J-K): Phù hợp cho người thích nhìn màn hình lớn, nhưng dễ mỏi cổ\n\n" +
                "🚪 Ghế cạnh lối đi (cột 1 hoặc 8): Thuận tiện cho việc ra vào nhưng tầm nhìn có thể bị lệch\n\n" +
                "Bạn đi xem phim với ai? Mình sẽ tư vấn thêm vị trí phù hợp nha! 😊",
          isUser: false,
          timestamp: new Date(),
          showSeatAdvice: true, // Thêm flag để hiển thị đặc biệt nếu cần
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        return; // Thêm return để tránh tiếp tục xử lý
      }

      // Nếu người dùng đang hỏi về tất cả các rạp
      if (isAskingAboutAllTheaters) {
        // Xáo trộn danh sách rạp và hiển thị tất cả rạp
        const randomTheaters = shuffleArray([...theaters]); // Lấy tất cả rạp, chỉ xáo trộn thứ tự
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Đây là tất cả các rạp Galaxy Cinema 🎬🏢",
          isUser: false,
          timestamp: new Date(),
          mentionedTheaters: randomTheaters
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        return; // Thêm return để tránh tiếp tục xử lý
      }

      // Nếu người dùng đang hỏi về rạp ở vị trí cụ thể, để Gemini xử lý
      if (isAskingAboutSpecificTheater) {
        // Tiếp tục xử lý bằng Gemini API
      }
      
      // Gọi API Gemini để lấy phản hồi
      let response = await getGeminiResponse(inputText, messages);
      
      // Phát hiện phim, khuyến mãi, rạp và lịch chiếu được đề cập trong phản hồi
      const mentionedMovies = detectMoviesInResponse(response, movies);
      const mentionedPromotions = isAskingAboutPromotions ? promotions : [];
      const mentionedTheaters = detectTheatersInResponse(response, theaters);
      let mentionedScreenings: any[] = detectScreeningsInResponse(response, screenings, movies, theaters);
      
      // Nếu người dùng đang hỏi về lịch chiếu, hiển thị các suất chiếu gần nhất
      if (isAskingAboutSchedules) {
        // Hiển thị một số lịch chiếu gần nhất
        mentionedScreenings = screenings
          .filter(s => new Date(s.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 6);
          
        // Làm phong phú dữ liệu suất chiếu với thông tin phim và rạp
        for (const screening of mentionedScreenings) {
          if (!screening.movieTitle && screening.movieId) {
            try {
              const movieId = typeof screening.movieId === 'object' ? screening.movieId._id : screening.movieId;
              const movie = movies.find(m => m._id === movieId);
              if (movie) {
                screening.movieTitle = movie.title;
              }
            } catch (error) {
              screening.movieTitle = 'Phim chưa xác định';
            }
          }
          
          if (!screening.theaterName && screening.theaterId) {
            try {
              const theaterId = typeof screening.theaterId === 'object' ? screening.theaterId._id : screening.theaterId;
              const theater = theaters.find(t => t._id === theaterId);
              if (theater) {
                screening.theaterName = theater.name;
              }
            } catch (error) {
              screening.theaterName = 'Rạp chưa xác định';
            }
          }
        }
        
        // Nếu đang hỏi trực tiếp về lịch chiếu, tạo tin nhắn riêng
        if (inputText.toLowerCase() === 'lịch chiếu' || inputText.toLowerCase() === 'lịch chiếu hôm nay') {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "Đây là lịch chiếu gần nhất tại Galaxy Cinema 🎬🍿",
            isUser: false,
            timestamp: new Date(),
            mentionedScreenings: mentionedScreenings
          };
          
          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          return; // Thêm return để tránh tiếp tục xử lý
        }
      }
      
      // Kiểm tra xem tin nhắn cuối cùng của bot có giống tin nhắn hiện tại không
      const lastBotMessage = messages.filter(msg => !msg.isUser).pop();
      if (lastBotMessage && lastBotMessage.text === response) {
        // Nếu giống nhau, thay đổi phản hồi để tránh trùng lặp
        if (response.includes('Vui lòng chọn phim, rạp và ghế trước khi áp dụng mã khuyến mãi')) {
          // Nếu người dùng đang hỏi về khuyến mãi
          if (isAskingAboutPromotions) {
            response = "Đây là các khuyến mãi hiện có tại Galaxy Cinema. Bạn có thể xem chi tiết từng khuyến mãi bên dưới.";
            // Đảm bảo mentionedPromotions sẽ được gán với tất cả khuyến mãi
            const botMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: response,
              isUser: false,
              timestamp: new Date(),
              mentionedPromotions: promotions
            };
            
            setMessages((prev) => [...prev, botMessage]);
            setIsTyping(false);
            return;
          } else {
            response = 'Bạn cần chọn phim và rạp trước. Mình có thể giúp bạn chọn phim không?';
          }
        } else {
          // Thêm một câu mở đầu để tránh trùng lặp hoàn toàn
          response = `Như mình đã đề cập, ${response.toLowerCase()}`;
        }
      }
      
      // Tạo tin nhắn bot với phim, khuyến mãi, rạp chiếu và lịch chiếu được đề cập
      const botMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // ID duy nhất hơn
        text: response,
        isUser: false,
        timestamp: new Date(),
        mentionedMovies: mentionedMovies.length > 0 ? mentionedMovies : undefined,
        mentionedPromotions: mentionedPromotions.length > 0 ? mentionedPromotions : undefined,
        mentionedTheaters: mentionedTheaters.length > 0 ? mentionedTheaters : undefined,
        mentionedScreenings: mentionedScreenings.length > 0 ? mentionedScreenings : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      // Xử lý lỗi
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      console.error('Error getting response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  // Hàm phát hiện phim trong phản hồi
  const detectMoviesInResponse = (response: string, movies: Movie[]) => {
    const mentionedMovies: Movie[] = [];
    const mentionedMovieIds = new Set<string>();
    
    // Kiểm tra xem phản hồi có liên quan đến phim không
    const movieRelatedKeywords = [
      'phim', 'movie', 'chiếu', 'showing', 'xem phim', 'đang chiếu', 'sắp chiếu',
      'lịch chiếu', 'suất chiếu', 'rạp chiếu', 'đặt vé'
    ];
    
    const isMovieRelated = movieRelatedKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!isMovieRelated) {
      return mentionedMovies;
    }
    
    // Kiểm tra từng phim xem có được đề cập trong phản hồi không
    movies.forEach(movie => {
      if (response.toLowerCase().includes(movie.title.toLowerCase()) && !mentionedMovieIds.has(movie._id)) {
        // Kiểm tra xem phim này đã được thêm vào danh sách chưa
        const isDuplicate = mentionedMovies.some(m => m._id === movie._id);
        if (!isDuplicate) {
          mentionedMovies.push(movie);
          mentionedMovieIds.add(movie._id);
        }
      }
    });
    
    return mentionedMovies;
  };

  // Cập nhật hàm phát hiện khuyến mãi trong phản hồi
  const detectPromotionsInResponse = (response: string, promotions: Promotion[]) => {
    const mentionedPromotions: Promotion[] = [];
    
    // Kiểm tra xem phản hồi có liên quan đến khuyến mãi không
    const promotionRelatedKeywords = [
      'khuyến mãi', 'giảm giá', 'ưu đãi', 'mã giảm', 'voucher', 'coupon',
      'promotion', 'discount', 'offer', 'deal', 'sale', 'SUMMER', 'VNPAY'
    ];
    
    const isPromotionRelated = promotionRelatedKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!isPromotionRelated) {
      return mentionedPromotions;
    }
    
    // Tìm các khuyến mãi được đề cập trong phản hồi
    promotions.forEach(promotion => {
      // Kiểm tra tên hoặc mã khuyến mãi
      if (response.toLowerCase().includes(promotion.name.toLowerCase()) || 
          response.toLowerCase().includes(promotion.code.toLowerCase())) {
        mentionedPromotions.push(promotion);
      }
    });
    
    // Nếu phản hồi có đề cập đến ShopeeePay, VNPAY hoặc "hè 2025" nhưng không tìm thấy khuyến mãi cụ thể
    // thì tìm các khuyến mãi liên quan
    if (mentionedPromotions.length === 0) {
      if (response.toLowerCase().includes('shopeepay')) {
        const shopeepayPromotions = promotions.filter(p => 
          p.name.toLowerCase().includes('shopeepay') || 
          p.code.toLowerCase().includes('shopeepay')
        );
        mentionedPromotions.push(...shopeepayPromotions);
      }
      
      if (response.toLowerCase().includes('vnpay')) {
        const vnpayPromotions = promotions.filter(p => 
          p.name.toLowerCase().includes('vnpay') || 
          p.code.toLowerCase().includes('vnpay')
        );
        mentionedPromotions.push(...vnpayPromotions);
      }
      
      if (response.toLowerCase().includes('hè 2025') || response.toLowerCase().includes('summer')) {
        const summerPromotions = promotions.filter(p => 
          p.name.toLowerCase().includes('hè') || 
          p.name.toLowerCase().includes('summer') ||
          p.code.toLowerCase().includes('summer')
        );
        mentionedPromotions.push(...summerPromotions);
      }
    }
    
    return mentionedPromotions;
  };

  // Thêm hàm phát hiện rạp chiếu trong phản hồi
  const detectTheatersInResponse = (response: string, theaters: Theater[]) => {
    const mentionedTheaters: Theater[] = [];
    const mentionedTheaterIds = new Set<string>();
    
    // Kiểm tra xem người dùng có đang hỏi về phim hoặc khuyến mãi không
    const isAskingAboutMovies = 
      response.toLowerCase().includes('phim đang chiếu') || 
      response.toLowerCase().includes('phim sắp chiếu') ||
      response.toLowerCase().includes('phim hay') ||
      response.toLowerCase().includes('đợi gì mơ dì') ||
      response.toLowerCase().includes('superman') ||
      response.toLowerCase().includes('hội nhóc quậy');
    
    const isAskingAboutPromotions =
      response.toLowerCase().includes('khuyến mãi') ||
      response.toLowerCase().includes('ưu đãi') ||
      response.toLowerCase().includes('giảm giá') ||
      response.toLowerCase().includes('voucher');
  
    // Nếu đang hỏi về phim hoặc khuyến mãi, không hiển thị rạp
    if (isAskingAboutMovies || isAskingAboutPromotions) {
      return [];
    }
    
    // Kiểm tra xem người dùng có đang hỏi về tất cả rạp không
    const isAskingAboutAllTheaters = 
      (response.toLowerCase().includes('tất cả') && response.toLowerCase().includes('rạp')) ||
      (response.toLowerCase().includes('danh sách') && response.toLowerCase().includes('rạp')) ||
      (response.toLowerCase() === 'rạp galaxy cinema') ||
      (response.toLowerCase() === 'galaxy cinema');
    
    // Nếu đang hỏi về tất cả rạp, hiển thị tất cả rạp
    if (isAskingAboutAllTheaters) {
      // Đảm bảo không có rạp trùng lặp
      const uniqueTheaters: Theater[] = [];
      const uniqueIds = new Set<string>();
      
      theaters.forEach(theater => {
        if (!uniqueIds.has(theater._id)) {
          uniqueTheaters.push(theater);
          uniqueIds.add(theater._id);
        }
      });
      
      return uniqueTheaters; // Trả về danh sách rạp không trùng lặp
    }
    
    // Kiểm tra xem người dùng có đang hỏi về rạp ở vị trí cụ thể không
    const isAskingAboutSpecificLocation = 
      response.toLowerCase().includes('quận') ||
      response.toLowerCase().includes('huyện') ||
      response.toLowerCase().includes('thành phố') ||
      response.toLowerCase().includes('tp') ||
      response.toLowerCase().includes('đường');
    
    // Nếu đang hỏi về rạp ở vị trí cụ thể, tìm các rạp phù hợp
    if (isAskingAboutSpecificLocation) {
      let foundSpecificTheaters = false;
      
      // Tìm các rạp có địa chỉ phù hợp với vị trí được hỏi
      theaters.forEach(theater => {
        const address = theater.address.toLowerCase();
        let isMatch = false;
        
        // Tìm các từ khóa vị trí trong câu hỏi
        if (response.toLowerCase().includes('quận')) {
          const quanMatch = response.toLowerCase().match(/quận\s+(\d+|[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)/i);
          if (quanMatch && address.includes(quanMatch[0])) {
            isMatch = true;
          }
        } else if (response.toLowerCase().includes('huyện')) {
          const huyenMatch = response.toLowerCase().match(/huyện\s+([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+)/i);
          if (huyenMatch && address.includes(huyenMatch[0])) {
            isMatch = true;
          }
        } else if (response.toLowerCase().includes('đường')) {
          const duongMatch = response.toLowerCase().match(/đường\s+([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\d]+)/i);
          if (duongMatch && address.includes(duongMatch[0])) {
            isMatch = true;
          }
        }
        
        // Kiểm tra các quận cụ thể
        for (let i = 1; i <= 12; i++) {
          if (response.toLowerCase().includes(`quận ${i}`) && address.includes(`quận ${i}`)) {
            isMatch = true;
            break;
          }
        }
        
        // Kiểm tra các quận có tên
        const namedDistricts = ['thủ đức', 'bình thạnh', 'gò vấp', 'phú nhuận', 'tân bình', 'tân phú', 'bình tân'];
        for (const district of namedDistricts) {
          if (response.toLowerCase().includes(district) && address.includes(district)) {
            isMatch = true;
            break;
          }
        }
        
        // Nếu rạp phù hợp và chưa được thêm vào danh sách
        if (isMatch && !mentionedTheaterIds.has(theater._id)) {
          mentionedTheaters.push(theater);
          mentionedTheaterIds.add(theater._id);
          foundSpecificTheaters = true;
        }
      });
      
      // Nếu tìm thấy rạp phù hợp, chỉ trả về những rạp đó
      if (foundSpecificTheaters) {
        return mentionedTheaters;
      }
    }
    
    // Nếu không, chỉ hiển thị rạp được đề cập cụ thể
    theaters.forEach(theater => {
      if (response.toLowerCase().includes(theater.name.toLowerCase()) && !mentionedTheaterIds.has(theater._id)) {
        mentionedTheaters.push(theater);
        mentionedTheaterIds.add(theater._id);
      }
    });
    
    // Nếu không tìm thấy rạp nào cụ thể, trả về danh sách rỗng để tránh hiển thị rạp không liên quan
    return mentionedTheaters;
  };

  // Thêm hàm phát hiện lịch chiếu trong phản hồi
  const detectScreeningsInResponse = (response: string, screenings: any[], movies: Movie[], theaters: Theater[]) => {
    const mentionedScreenings: any[] = [];
    
    // Kiểm tra xem phản hồi có liên quan đến lịch chiếu không
    const screeningRelatedKeywords = [
      'lịch chiếu', 'suất chiếu', 'xuất chiếu', 'giờ chiếu', 'xem phim lúc',
      'sáng', 'trưa', 'chiều', 'tối', 'giờ xem'
    ];
    
    const isScreeningRelated = screeningRelatedKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (!isScreeningRelated) {
      return mentionedScreenings;
    }
    
    // Nếu có đề cập đến lịch chiếu, thêm 2-3 suất chiếu gần nhất
    const now = new Date();
    const upcomingScreenings = screenings
      .filter(screening => new Date(screening.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 6);
    
    // Thêm log để xem tổng số suất chiếu
    const totalAvailableScreenings = screenings.filter(screening => new Date(screening.startTime) > now).length;
    console.log(`Tổng số suất chiếu có sẵn: ${totalAvailableScreenings}`);

    // Làm phong phú dữ liệu suất chiếu với thông tin phim và rạp
    for (const screening of upcomingScreenings) {
      // Đảm bảo có thông tin phim và rạp
      if (!screening.movieTitle && screening.movieId) {
        try {
          const movieId = typeof screening.movieId === 'object' ? screening.movieId._id : screening.movieId;
          const movie = movies.find(m => m._id === movieId);
          if (movie) {
            screening.movieTitle = movie.title;
          }
        } catch (error) {
          screening.movieTitle = 'Phim chưa xác định';
        }
      }
      
      if (!screening.theaterName && screening.theaterId) {
        try {
          const theaterId = typeof screening.theaterId === 'object' ? screening.theaterId._id : screening.theaterId;
          const theater = theaters.find(t => t._id === theaterId);
          if (theater) {
            screening.theaterName = theater.name;
          }
        } catch (error) {
          screening.theaterName = 'Rạp chưa xác định';
        }
      }
      
      mentionedScreenings.push(screening);
    }
    
    return mentionedScreenings;
  };

  // Định dạng thời gian
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  // Component hiển thị ngày
  const DateHeader = ({ date }: { date: string }) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.split('/')[0] == today.getDate().toString() && 
                    date.split('/')[1] == (today.getMonth() + 1).toString() && 
                    date.split('/')[2] == today.getFullYear().toString();
    
    const isYesterday = date.split('/')[0] == yesterday.getDate().toString() && 
                        date.split('/')[1] == (yesterday.getMonth() + 1).toString() && 
                        date.split('/')[2] == yesterday.getFullYear().toString();
    
    let displayText = date;
    if (isToday) displayText = "Hôm nay";
    if (isYesterday) displayText = "Hôm qua";
    
    return (
      <View style={styles.dateHeaderContainer}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{displayText}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  // Component hiển thị phim được đề cập
  const MoviePreview = ({ movie }: { movie: Movie }) => {
    const [isPressed, setIsPressed] = useState(false);
    
    return (
      <View style={styles.moviePreview}>
        <TouchableOpacity 
          style={[styles.movieMainContent, isPressed && styles.movieMainContentPressed]}
          onPress={() => router.push({
            pathname: '/movie-detail',
            params: { movieId: movie._id }
          })}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: movie.posterUrl }} 
            style={styles.movieImage}
            resizeMode="cover"
          />
          <View style={styles.movieInfo}>
            <Text style={styles.movieName} numberOfLines={1}>
              {movie.title}
            </Text>
            <Text style={styles.movieGenre}>
              {movie.genre}
            </Text>
            <Text style={styles.movieDuration}>
              {movie.duration} phút
            </Text>
        </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => router.push({
            pathname: '/movie-detail',
            params: { movieId: movie._id }
          })}
          activeOpacity={0.8}
        >
          <Text style={styles.detailButtonText}>Xem chi tiết</Text>
          <Film size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    );
  };

  // Thêm component hiển thị khuyến mãi
  const PromotionPreview = ({ promotion }: { promotion: Promotion }) => {
    const [isPressed, setIsPressed] = useState(false);
    
    const formatValue = (type: string, value: number) => {
      return type === 'percent' ? `${value}%` : `${value.toLocaleString('vi-VN')}đ`;
    };
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    };
    
    // Xử lý khi không có poster
    const defaultPosterUrl = 'https://galaxycine.vn/media/2019/5/6/galaxy-cinema-logo_1557130959296.jpg';
    
    return (
      <View style={styles.promotionPreview}>
        <TouchableOpacity 
          style={[styles.promotionMainContent, isPressed && styles.promotionMainContentPressed]}
          onPress={() => router.push('/offers')}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={0.7}
        >
          <Image 
            source={{ uri: promotion.posterUrl || defaultPosterUrl }} 
            style={styles.promotionImage}
            resizeMode="cover"
          />
          <View style={styles.promotionInfo}>
            <Text style={styles.promotionName} numberOfLines={1}>
              {promotion.name}
            </Text>
            <Text style={styles.promotionCode}>
              Mã: {promotion.code}
            </Text>
            <Text style={styles.promotionValue}>
              Giảm {formatValue(promotion.type, promotion.value)}
            </Text>
            <Text style={styles.promotionDate}>
              Hết hạn: {formatDate(promotion.endDate)}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => router.push('/offers')}
          activeOpacity={0.8}
        >
          <Text style={styles.detailButtonText}>Xem chi tiết</Text>
          <Gift size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    );
  };

  // Thêm component hiển thị rạp chiếu
  const TheaterPreview = ({ theater }: { theater: Theater }) => {
    const [isPressed, setIsPressed] = useState(false);
    
    // Hàm lấy hình ảnh rạp dựa trên tên
    const getTheaterImage = (name: string) => {
      if (name.includes('Nguyễn Văn Quá')) return nguyen_van_qua;
      if (name.includes('Trường Chinh')) return truong_chinh;
      if (name.includes('Huỳnh Tấn Phát')) return huynh_tan_phat;
      if (name.includes('Trung Chánh')) return trung_chanh;
      if (name.includes('Nguyễn Du')) return nguyen_du;
      if (name.includes('Thiso Mall')) return thiso_mall;
      // Hình ảnh mặc định nếu không tìm thấy
      return nguyen_van_qua; 
    };
    
    return (
      <View style={styles.theaterPreview}>
        <TouchableOpacity 
          style={[styles.theaterMainContent, isPressed && styles.theaterMainContentPressed]}
          onPress={() => router.push({
            pathname: '/theater-detail',
            params: { theaterId: theater._id }
          })}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={0.7}
        >
          <View style={styles.theaterImageContainer}>
            <Image 
              source={getTheaterImage(theater.name)} 
              style={styles.theaterImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.theaterInfo}>
            <Text style={styles.theaterName} numberOfLines={1}>
              {theater.name}
            </Text>
            <Text style={styles.theaterAddress} numberOfLines={2}>
              {theater.address}
            </Text>
            <Text style={styles.theaterContact}>
              {theater.phone}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => router.push({
            pathname: '/theater-detail',
            params: { theaterId: theater._id }
          })}
          activeOpacity={0.8}
        >
          <Text style={styles.detailButtonText}>Xem chi tiết</Text>
          <MapPin size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    );
  };

  // Thêm component hiển thị lịch chiếu
  const ScreeningPreview = ({ screening }: { screening: any }) => {
    const [isPressed, setIsPressed] = useState(false);
    
    // Format thời gian
    const formatTime = (dateTimeString: string) => {
      if (!dateTimeString) return '';
      try {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } catch (error) {
        return dateTimeString.slice(11, 16);
      }
    };

    // Format ngày
    const formatDate = (dateTimeString: string) => {
      if (!dateTimeString) return '';
      try {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch (error) {
        return dateTimeString.slice(0, 10);
      }
    };
    
    return (
      <View style={styles.screeningPreview}>
        <TouchableOpacity 
          style={[styles.screeningMainContent, isPressed && styles.screeningMainContentPressed]}
          onPress={() => router.push({
            pathname: '/seat-selection',
            params: { screeningId: screening._id }
          })}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={0.7}
        >
          <View style={styles.screeningInfo}>
            <Text style={styles.screeningMovie} numberOfLines={1}>
              {screening.movieTitle || 'Phim chưa xác định'}
            </Text>
            <Text style={styles.screeningTheater}>
              {screening.theaterName || 'Rạp chưa xác định'}
            </Text>
            <View style={styles.screeningTimeContainer}>
              <Text style={styles.screeningDate}>
                {formatDate(screening.startTime)}
              </Text>
              <Text style={styles.screeningTime}>
                {formatTime(screening.startTime)}
              </Text>
            </View>
            <Text style={styles.screeningPrice}>
              {screening.price || screening.ticketPrice || 90000} VNĐ
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bookingButton}
          onPress={() => router.push({
            pathname: '/seat-selection',
            params: { screeningId: screening._id }
          })}
          activeOpacity={0.8}
        >
          <Text style={styles.bookingButtonText}>Chọn ghế ngay</Text>
          <Ticket size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm xử lý clear chat
  const handleClearChat = () => {
    // Hiển thị hộp thoại xác nhận
    Alert.alert(
      "Tạo cuộc trò chuyện mới",
      "Bạn có muốn tạo cuộc trò chuyện mới không? Tất cả tin nhắn hiện tại sẽ bị xóa.",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        { 
          text: "Tạo mới", 
          onPress: () => {
            // Đặt lại tin nhắn về tin nhắn chào ban đầu
            setMessages([{
              id: Date.now().toString(),
              text: "Xin chào! Tôi là Galaxy AI, trợ lý ảo của Galaxy Cinema. Tôi có thể giúp gì cho bạn?",
              isUser: false,
              timestamp: new Date(),
            }]);
          },
          style: "default"
        }
      ]
    );
  };

  // Thêm hàm xử lý quick reply
  const handleQuickReply = (text: string) => {
    setInputText(text);
    handleSend();
  };

  // Thay thế component QuickReplies hiện tại bằng phiên bản mới
  const QuickReplies = () => {
    // Chia mảng quickReplies thành 2 hàng
    const firstRow = quickReplies.slice(0, 3);
    const secondRow = quickReplies.slice(3);

    return (
      <View style={styles.quickRepliesContainer}>
        <View style={styles.quickRepliesRow}>
          {firstRow.map((reply, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickReplyButton,
                index === 0 && {
                  shadowColor: "#FFD700",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                  elevation: 5
                }
              ]}
              onPress={reply.onPress}
            >
              {reply.icon}
              <Text style={styles.quickReplyText}>{reply.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.quickRepliesRow}>
          {secondRow.map((reply, index) => (
            <TouchableOpacity
              key={index + 3}
              style={styles.quickReplyButton}
              onPress={reply.onPress}
            >
              {reply.icon}
              <Text style={styles.quickReplyText}>{reply.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
        <RNAnimated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <View style={styles.botAvatarContainer}>
              <View style={styles.botAvatarCircle}>
                <Bot size={24} color="#FFD700" />
              </View>
              <View style={styles.statusIndicator} />
            </View>
            <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Galaxy AI Assistant</Text>
              <Text style={styles.headerSubtitle}>Online • Trả lời ngay lập tức</Text>
      </View>
            <TouchableOpacity 
              style={styles.clearChatButton}
              onPress={handleClearChat}
            >
              <PlusCircle size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </RNAnimated.View>

      <FlatList
        ref={flatListRef}
          data={groupMessagesByDate()}
        keyExtractor={(item) => item.id}
          renderItem={({ item: group }) => (
            <View>
              <DateHeader date={group.title} />
              {group.data.map((message: Message, messageIndex: number) => (
                <Animated.View 
                  key={`${message.id}-${messageIndex}`}
                  entering={message.isUser ? FadeInRight : FadeInLeft}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.botAvatar}>
                      <Bot size={20} color="#FFD700" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text style={message.isUser ? styles.userMessageText : styles.botMessageText}>
                      {message.text}
                    </Text>
                    
                    {/* Hiển thị phim được đề cập */}
                    {!message.isUser && message.mentionedMovies?.length && message.mentionedMovies?.length > 0 && (
                      <View style={styles.moviesContainer}>
                        {Array.from(new Set(message.mentionedMovies?.map(movie => movie.title))).map(title => {
                          // Lấy phim đầu tiên có tên này
                          const movie = message.mentionedMovies?.find(m => m.title === title);
                          return movie ? <MoviePreview key={movie._id} movie={movie} /> : null;
                        })}
                      </View>
                    )}
                      
                    {/* Hiển thị khuyến mãi được đề cập */}
                    {!message.isUser && message.mentionedPromotions && message.mentionedPromotions.length > 0 && (
                      <View style={styles.promotionsContainer}>
                        {/* Hiển thị tất cả các khuyến mãi, không lọc trùng lặp */}
                        {message.mentionedPromotions.map((promotion, index) => (
                          <PromotionPreview key={`${promotion._id}-${index}`} promotion={promotion} />
                        ))}
                      </View>
                    )}

                    {/* Hiển thị rạp chiếu được đề cập chỉ khi không có cả phim và rạp */}
                    {!message.isUser && message.mentionedTheaters?.length && message.mentionedTheaters?.length > 0 && (
                      <View style={styles.theatersContainer}>
                        {Array.from(new Set(message.mentionedTheaters?.map(theater => theater._id)))
                          .map(id => {
                            const theater = message.mentionedTheaters?.find(t => t._id === id);
                            return theater ? <TheaterPreview key={id} theater={theater} /> : null;
                          })}
                      </View>
                    )}

                    {/* Hiển thị lịch chiếu được đề cập */}
                    {!message.isUser && message.mentionedScreenings && message.mentionedScreenings.length > 0 && (
                      <View style={styles.screeningsContainer}>
                        {message.mentionedScreenings.map((screening) => (
                          <ScreeningPreview key={screening._id} screening={screening} />
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
                </Animated.View>
              ))}
            </View>
          )}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
          removeClippedSubviews={true}  // Add this to improve performance
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
            <View style={styles.botAvatarSmall}>
              <Bot size={16} color="#FFD700" />
            </View>
            <ActivityIndicator size="small" color="#FFD700" style={styles.typingDots} />
          <Text style={styles.typingText}>Galaxy AI đang nhập</Text>
        </View>
      )}

        <View>
          <QuickReplies />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#666"
          multiline
              maxLength={500}  // Add a reasonable max length
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color={inputText.trim() ? '#000000' : '#666'} />
        </TouchableOpacity>
          </View>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#000000',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  botAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  headerSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#aaa',
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
  botAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    lineHeight: 20,
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
  typingDots: {
    marginRight: 8,
  },
  typingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
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
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#FFD700',
    marginHorizontal: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    overflow: 'hidden',
    fontFamily: 'Montserrat-Medium',
  },
  moviesContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  moviePreview: {
    flexDirection: 'column',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  movieMainContent: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  movieMainContentPressed: {
    backgroundColor: '#222',
  },
  movieImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 10,
  },
  movieName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieGenre: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  movieDuration: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailButtonText: {
    color: '#FFD700',
    fontSize: 12,
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 4,
  },
  promotionsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  promotionPreview: {
    flexDirection: 'column',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  promotionMainContent: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  promotionMainContentPressed: {
    backgroundColor: '#222',
  },
  promotionImage: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  promotionInfo: {
    flex: 1,
    marginLeft: 10,
  },
  promotionName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promotionCode: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 2,
  },
  promotionValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  promotionDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#777',
  },
  theatersContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  theaterPreview: {
    flexDirection: 'column',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  theaterMainContent: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  theaterMainContentPressed: {
    backgroundColor: '#222',
  },
  theaterImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  theaterImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  theaterInfo: {
    flex: 1,
    marginLeft: 10,
  },
  theaterName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  theaterAddress: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  theaterContact: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  clearChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  headerTextContainer: {
    flex: 1,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#0A0A0A',
  },
  quickRepliesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickReplyButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,  // giảm padding ngang
    paddingVertical: 6,    // giảm padding dọc
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    flex: 1,
    marginHorizontal: 3,   // giảm margin
    alignItems: 'center',
    flexDirection: 'row',  // thêm để icon và text nằm cùng hàng
    justifyContent: 'center',
  },
  quickReplyText: {
    color: '#FFD700',
    fontSize: 11,          // giảm kích thước font
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    marginLeft: 4,         // tạo khoảng cách giữa icon và text
  },
  screeningPreview: {
    flexDirection: 'column',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  screeningMainContent: {
    padding: 14,
  },
  screeningMainContentPressed: {
    backgroundColor: '#222',
  },
  screeningInfo: {
    paddingVertical: 4,
  },
  screeningMovie: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  screeningTheater: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  screeningTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  screeningDate: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  screeningTime: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#4CAF50',
  },
  screeningPrice: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  bookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F1F1F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bookingButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 4,
  },
  screeningsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
});