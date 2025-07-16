import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPublicMovies } from './movie';
import { getActivePromotions } from './promotion';
import { getTheaters } from './theater';
import { getRooms } from './room';
import { getPublicScreenings } from './screening';

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  mentionedMovies?: any[];
  mentionedPromotions?: any[];
  mentionedTheaters?: any[]; // Thêm trường này
  isBookingConfirmation?: boolean;
  showSeatAdvice?: boolean;
  bookingDetails?: {
    movieId: string;
    theaterId: string;
    screeningId: string;
    selectedDate: string;
    selectedTime: string;
    selectedSeats: string[];
    ticketPrice: number;
    totalPrice: number;
    discount?: number;
    appliedPromoCode?: string;
    movieTitle?: string;
    theaterName?: string;
  }; // Thêm thông tin chi tiết đặt vé
}

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI('AIzaSyCYwE3AzTwTDDSSMyWSrYrCvFAegWDNe8A');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Tạo context cho chatbot từ dữ liệu thực
const getContextData = async () => {
  try {
    // Lấy dữ liệu từ các service functions
    const [movies, promotions, theaters, rooms, screenings] = await Promise.all([
      getPublicMovies(),
      getActivePromotions(),
      getTheaters(),
      getRooms(),
      getPublicScreenings()
    ]);
    
    let context = "Thông tin hiện tại:\n";
    
    // Thêm thông tin phim đang chiếu
    context += "PHIM ĐANG CHIẾU:\n";
    movies
      .filter(m => m.showingStatus === 'now-showing')
      .slice(0, 5)
      .forEach((movie) => {
        context += `- ${movie.title} (${movie.duration} phút, Thể loại: ${movie.genre || 'Chưa cập nhật'}, Đạo diễn: ${movie.directors?.join(', ') || 'Chưa cập nhật'}, Diễn viên: ${movie.actors?.slice(0, 2).join(', ') || 'Chưa cập nhật'}, Đánh giá: ${movie.rating || 'Chưa cập nhật'}): ${movie.description.substring(0, 100)}...\n`;
      });

    // Thêm thông tin phim sắp chiếu
    context += "\nPHIM SẮP CHIẾU:\n";
    movies
      .filter(m => m.showingStatus === 'coming-soon')
      .slice(0, 5)
      .forEach((movie) => {
      context += `- ${movie.title} (${movie.duration} phút): ${movie.description.substring(0, 100)}...\n`;
      });
    
    // Thêm thông tin rạp chiếu phim
    context += "\nCÁC RẠP GALAXY CINEMA:\n";
    theaters.slice(0, 5).forEach((theater) => {
      // Đếm số phòng cho mỗi rạp
      const theaterRooms = rooms.filter(room => {
        const roomTheaterId = typeof room.theaterId === 'object' ? room.theaterId._id : room.theaterId;
        return roomTheaterId === theater._id;
      });
      
      context += `- ${theater.name}: ${theater.address}. Liên hệ: ${theater.phone}. Số phòng chiếu: ${theaterRooms.length || theater.screens || 'chưa xác định'}\n`;
    });
    
    // Thêm thông tin suất chiếu sắp tới
    context += "\nSUẤT CHIẾU SẮP TỚI:\n";
    // Lọc các suất chiếu trong 3 ngày tới
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    
    const upcomingScreenings = screenings.filter(s => {
      const screeningDate = new Date(s.startTime);
      return screeningDate >= today && screeningDate <= threeDaysLater;
    }).slice(0, 5);
    
    if (upcomingScreenings.length > 0) {
      upcomingScreenings.forEach(screening => {
        const movieId = typeof screening.movieId === 'object' ? screening.movieId._id : screening.movieId;
        const theaterId = typeof screening.theaterId === 'object' ? screening.theaterId._id : screening.theaterId;
        
        const movie = movies.find(m => m._id === movieId);
        const theater = theaters.find(t => t._id === theaterId);
        
        if (movie && theater) {
          const screeningTime = new Date(screening.startTime);
          const formattedDate = `${screeningTime.getDate()}/${screeningTime.getMonth() + 1}/${screeningTime.getFullYear()}`;
          const formattedTime = `${screeningTime.getHours().toString().padStart(2, '0')}:${screeningTime.getMinutes().toString().padStart(2, '0')}`;
          
          context += `- ${movie.title} tại ${theater.name} vào ngày ${formattedDate} lúc ${formattedTime}, phòng ${screening.room}, giá vé: ${screening.price || screening.ticketPrice || 'chưa cập nhật'} VND\n`;
        }
      });
    } else {
      context += "- Hiện chưa có thông tin suất chiếu sắp tới\n";
    }
    
    // Thêm thông tin khuyến mãi
    context += "\nKHUYẾN MÃI HIỆN TẠI:\n";
    if (promotions && promotions.data && promotions.data.length > 0) {
      const promoList = promotions.data.slice(0, 3);
      promoList.forEach((promo) => {
        context += `- ${promo.name}: ${promo.description.substring(0, 100)}...\n`;
      });
    } else {
      context += "- Hiện chưa có thông tin khuyến mãi\n";
    }
    
    return context;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu context:', error);
    return "Thông tin hiện tại không có sẵn. Tôi vẫn có thể trả lời các câu hỏi chung về Galaxy Cinema.";
  }
};

// Thêm vào file services/gemini.ts
const categorizeMoviesByGenre = (movies: any[]) => {
  // Tách phim đang chiếu và sắp chiếu
  const nowShowingMovies = movies.filter(movie => movie.showingStatus === 'now-showing');
  const comingSoonMovies = movies.filter(movie => movie.showingStatus === 'coming-soon');
  
  // Phân loại theo thể loại và trạng thái
  const categories: {[key: string]: {nowShowing: string[], comingSoon: string[]}} = {
    'hoạt hình': {nowShowing: [], comingSoon: []},
    'hành động': {nowShowing: [], comingSoon: []},
    'kinh dị': {nowShowing: [], comingSoon: []},
    'tình cảm': {nowShowing: [], comingSoon: []},
    'lãng mạn': {nowShowing: [], comingSoon: []},
    'hài': {nowShowing: [], comingSoon: []},
    'khoa học viễn tưởng': {nowShowing: [], comingSoon: []},
    'giả tưởng': {nowShowing: [], comingSoon: []},
    'phiêu lưu': {nowShowing: [], comingSoon: []},
    'gia đình': {nowShowing: [], comingSoon: []},
    'trẻ em': {nowShowing: [], comingSoon: []},
    'cao bồi': {nowShowing: [], comingSoon: []},
    'chiến tranh': {nowShowing: [], comingSoon: []},
    'giật gân': {nowShowing: [], comingSoon: []},
    'hình sự': {nowShowing: [], comingSoon: []},
    'lịch sử': {nowShowing: [], comingSoon: []},
    'bí ẩn': {nowShowing: [], comingSoon: []},
    'âm nhạc': {nowShowing: [], comingSoon: []},
    'tài liệu': {nowShowing: [], comingSoon: []},
    'chính kịch': {nowShowing: [], comingSoon: []},
    'thần thoại': {nowShowing: [], comingSoon: []},
    'thể thao': {nowShowing: [], comingSoon: []},
    'tiểu sử': {nowShowing: [], comingSoon: []}
  };
  
  // Xử lý phim đang chiếu
  nowShowingMovies.forEach(movie => {
    const title = movie.title;
    const genre = movie.genre?.toLowerCase() || '';
    
    // Phân loại theo thể loại
    if (genre.includes('hoạt hình') || genre.includes('animation')) {
      categories['hoạt hình'].nowShowing.push(title);
      // Phim hoạt hình thường cũng là phim gia đình/trẻ em
      categories['gia đình'].nowShowing.push(title);
      categories['trẻ em'].nowShowing.push(title);
    }
    if (genre.includes('hành động') || genre.includes('action')) {
      categories['hành động'].nowShowing.push(title);
    }
    if (genre.includes('kinh dị') || genre.includes('horror')) {
      categories['kinh dị'].nowShowing.push(title);
    }
    if (genre.includes('tình cảm') || genre.includes('romance') || genre.includes('lãng mạn')) {
      categories['tình cảm'].nowShowing.push(title);
      categories['lãng mạn'].nowShowing.push(title);
    }
    if (genre.includes('hài') || genre.includes('comedy')) {
      categories['hài'].nowShowing.push(title);
    }
    if (genre.includes('khoa học') || genre.includes('viễn tưởng') || genre.includes('sci-fi')) {
      categories['khoa học viễn tưởng'].nowShowing.push(title);
    }
    if (genre.includes('giả tưởng') || genre.includes('fantasy')) {
      categories['giả tưởng'].nowShowing.push(title);
    }
    if (genre.includes('phiêu lưu') || genre.includes('adventure')) {
      categories['phiêu lưu'].nowShowing.push(title);
    }
    if (genre.includes('gia đình') || genre.includes('family')) {
      categories['gia đình'].nowShowing.push(title);
    }
    if (genre.includes('cao bồi') || genre.includes('western')) {
      categories['cao bồi'].nowShowing.push(title);
    }
    if (genre.includes('chiến tranh') || genre.includes('war')) {
      categories['chiến tranh'].nowShowing.push(title);
    }
    if (genre.includes('giật gân') || genre.includes('thriller')) {
      categories['giật gân'].nowShowing.push(title);
    }
    if (genre.includes('hình sự') || genre.includes('crime')) {
      categories['hình sự'].nowShowing.push(title);
    }
    if (genre.includes('lịch sử') || genre.includes('history')) {
      categories['lịch sử'].nowShowing.push(title);
    }
    if (genre.includes('bí ẩn') || genre.includes('mystery')) {
      categories['bí ẩn'].nowShowing.push(title);
    }
    if (genre.includes('âm nhạc') || genre.includes('music')) {
      categories['âm nhạc'].nowShowing.push(title);
    }
    if (genre.includes('tài liệu') || genre.includes('documentary')) {
      categories['tài liệu'].nowShowing.push(title);
    }
    if (genre.includes('chính kịch') || genre.includes('drama')) {
      categories['chính kịch'].nowShowing.push(title);
    }
    if (genre.includes('thần thoại') || genre.includes('mythology')) {
      categories['thần thoại'].nowShowing.push(title);
    }
    if (genre.includes('thể thao') || genre.includes('sport')) {
      categories['thể thao'].nowShowing.push(title);
    }
    if (genre.includes('tiểu sử') || genre.includes('biography')) {
      categories['tiểu sử'].nowShowing.push(title);
    }
  });

  // Xử lý phim sắp chiếu
  comingSoonMovies.forEach(movie => {
    const title = movie.title;
    const genre = movie.genre?.toLowerCase() || '';

    // Phân loại theo thể loại
    if (genre.includes('hoạt hình') || genre.includes('animation')) {
      categories['hoạt hình'].comingSoon.push(title);
      // Phim hoạt hình thường cũng là phim gia đình/trẻ em
      categories['gia đình'].comingSoon.push(title);
      categories['trẻ em'].comingSoon.push(title);
    }
    if (genre.includes('hành động') || genre.includes('action')) {
      categories['hành động'].comingSoon.push(title);
    }
    if (genre.includes('kinh dị') || genre.includes('horror')) {
      categories['kinh dị'].comingSoon.push(title);
    }
    if (genre.includes('tình cảm') || genre.includes('romance') || genre.includes('lãng mạn')) {
      categories['tình cảm'].comingSoon.push(title);
      categories['lãng mạn'].comingSoon.push(title);
    }
    if (genre.includes('hài') || genre.includes('comedy')) {
      categories['hài'].comingSoon.push(title);
    }
    if (genre.includes('khoa học') || genre.includes('viễn tưởng') || genre.includes('sci-fi')) {
      categories['khoa học viễn tưởng'].comingSoon.push(title);
    }
    if (genre.includes('giả tưởng') || genre.includes('fantasy')) {
      categories['giả tưởng'].comingSoon.push(title);
    }
    if (genre.includes('phiêu lưu') || genre.includes('adventure')) {
      categories['phiêu lưu'].comingSoon.push(title);
    }
    if (genre.includes('gia đình') || genre.includes('family')) {
      categories['gia đình'].comingSoon.push(title);
    }
    if (genre.includes('cao bồi') || genre.includes('western')) {
      categories['cao bồi'].comingSoon.push(title);
    }
    if (genre.includes('chiến tranh') || genre.includes('war')) {
      categories['chiến tranh'].comingSoon.push(title);
    }
    if (genre.includes('giật gân') || genre.includes('thriller')) {
      categories['giật gân'].comingSoon.push(title);
    }
    if (genre.includes('hình sự') || genre.includes('crime')) {
      categories['hình sự'].comingSoon.push(title);
    }
    if (genre.includes('lịch sử') || genre.includes('history')) {
      categories['lịch sử'].comingSoon.push(title);
    }
    if (genre.includes('bí ẩn') || genre.includes('mystery')) {
      categories['bí ẩn'].comingSoon.push(title);
    }
    if (genre.includes('âm nhạc') || genre.includes('music')) {
      categories['âm nhạc'].comingSoon.push(title);
    }
    if (genre.includes('tài liệu') || genre.includes('documentary')) {
      categories['tài liệu'].comingSoon.push(title);
    }
    if (genre.includes('chính kịch') || genre.includes('drama')) {
      categories['chính kịch'].comingSoon.push(title);
    }
    if (genre.includes('thần thoại') || genre.includes('mythology')) {
      categories['thần thoại'].comingSoon.push(title);
    }
    if (genre.includes('thể thao') || genre.includes('sport')) {
      categories['thể thao'].comingSoon.push(title);
    }
    if (genre.includes('tiểu sử') || genre.includes('biography')) {
      categories['tiểu sử'].comingSoon.push(title);
    }
  });
  
  // Lọc bỏ các danh mục trống
  Object.keys(categories).forEach(key => {
    if (categories[key].nowShowing.length === 0 && categories[key].comingSoon.length === 0) {
      delete categories[key];
    } else {
      // Loại bỏ trùng lặp
      categories[key].nowShowing = [...new Set(categories[key].nowShowing)];
      categories[key].comingSoon = [...new Set(categories[key].comingSoon)];
    }
  });
  
  return categories;
};

// Hàm gửi tin nhắn đến Gemini và nhận phản hồi
export const getGeminiResponse = async (
  userInput: string, 
  previousMessages: Message[] = [],
  movieDetailContext?: string
) => {
  try {
    // Lấy context từ dữ liệu thực
    const contextData = await getContextData();
    
    // Lấy danh sách phim
    const movies = await getPublicMovies();
    
    // Phân loại phim theo thể loại và trạng thái
    const moviesByGenre = categorizeMoviesByGenre(movies);
    
    // Tạo danh sách phim đã được đề cập trong lịch sử trò chuyện
    const mentionedMovieTitles = new Set<string>();
    // Tạo danh sách khuyến mãi và rạp chiếu đã được đề cập
    const mentionedPromotions = new Set<string>();
    const mentionedTheaters = new Set<string>();
    // Tạo danh sách các chủ đề đã được đề cập
    const discussedTopics = new Set<string>();
    
    if (previousMessages.length > 0) {
      // Phân tích tất cả tin nhắn trước đó để hiểu ngữ cảnh cuộc trò chuyện
      previousMessages.forEach(msg => {
        // Phân tích tin nhắn của người dùng để hiểu họ đang hỏi về chủ đề gì
        if (msg.isUser) {
          const text = msg.text.toLowerCase();
          if (text.includes('phim') || text.includes('movie')) discussedTopics.add('phim');
          if (text.includes('khuyến mãi') || text.includes('ưu đãi') || text.includes('giảm giá')) discussedTopics.add('khuyến mãi');
          if (text.includes('rạp') || text.includes('theater') || text.includes('cinema')) discussedTopics.add('rạp chiếu');
          if (text.includes('đặt vé') || text.includes('mua vé') || text.includes('book')) discussedTopics.add('đặt vé');
          if (text.includes('lịch chiếu') || text.includes('suất chiếu')) discussedTopics.add('lịch chiếu');
        }
        
        // Phân tích tin nhắn của bot để biết những gì đã được đề cập
        if (!msg.isUser && msg.text) {
          // Tìm tên phim trong tin nhắn của bot
          movies.forEach(movie => {
            if (msg.text.toLowerCase().includes(movie.title.toLowerCase())) {
              mentionedMovieTitles.add(movie.title);
            }
          });
          
          // Lưu thông tin về khuyến mãi đã đề cập
          if (msg.mentionedPromotions && msg.mentionedPromotions.length > 0) {
            msg.mentionedPromotions.forEach(promo => {
              mentionedPromotions.add(promo.name);
            });
          }
          
          // Lưu thông tin về rạp chiếu đã đề cập
          if (msg.mentionedTheaters && msg.mentionedTheaters.length > 0) {
            msg.mentionedTheaters.forEach(theater => {
              mentionedTheaters.add(theater.name);
            });
          }
        }
      });
    }
    
    // Lọc phim trùng lặp theo tên trước khi tạo danh sách phim chưa đề cập
    const uniqueMovies = Array.from(
      new Map(movies.map(movie => [movie.title, movie])).values()
    );

    // Tạo danh sách phim chưa được đề cập
    const unmentionedMovieSet = new Set<string>();
    uniqueMovies
      .filter(m => (m.showingStatus === 'now-showing' || m.showingStatus === 'coming-soon') && !mentionedMovieTitles.has(m.title))
      .forEach(m => unmentionedMovieSet.add(m.title));

    const unmentionedMovies = Array.from(unmentionedMovieSet);
    
    // Tạo lịch sử trò chuyện từ tin nhắn trước đó
    let conversationHistory = "";
    const isFirstMessage = previousMessages.length <= 1; // Chỉ có tin nhắn chào ban đầu hoặc không có tin nhắn nào
    
    // Lấy tối đa 5 tin nhắn gần nhất để có ngữ cảnh đầy đủ hơn
    if (previousMessages.length > 0) {
      previousMessages.slice(-5).forEach(msg => {
        conversationHistory += `${msg.isUser ? "Người dùng" : "AI"}: ${msg.text}\n`;
      });
    }
    
    // Sửa đổi phần tạo prompt, thêm thông tin chi tiết phim nếu có
    const prompt = `
Bạn là Galaxy AI, trợ lý ảo thông minh và thân thiện của Galaxy Cinema, một chuỗi rạp chiếu phim hàng đầu tại Việt Nam.

HƯỚNG DẪN:
- Trả lời câu hỏi một cách ngắn gọn, thân thiện và hữu ích, giới hạn trong 1-3 câu.
- SỬ DỤNG NGÔN NGỮ RẤT THÂN THIỆN, GẦN GŨI VÀ NHIỆT TÌNH NHƯ MỘT NGƯỜI BẠN THÂN.
- LUÔN THÊM TỪ NGỮ THỂ HIỆN SỰ THÂN THIỆN NHƯ "NÈ", "NHA", "Á", "Ý", "LUÔN" TRONG CÂU TRẢ LỜI.
- THÊM CÁC BIỂU TƯỢNG CẢM XÚC (EMOJI) PHÙ HỢP TRONG MỖI CÂU TRẢ LỜI (ÍT NHẤT 1-2 EMOJI).
- Sử dụng các từ ngữ thân mật như "bạn", "mình", "cậu" và thêm biểu cảm vào câu trả lời.
- Tạo câu trả lời đa dạng, tránh lặp lại cùng một cấu trúc câu.
- KHÔNG CHÀO HỎI LẠI NẾU ĐÃ CÓ TIN NHẮN TRƯỚC ĐÓ TRONG CUỘC TRÒ CHUYỆN.
- CHỈ CHÀO HỎI KHI BẮT ĐẦU CUỘC TRÒ CHUYỆN HOẶC KHI NGƯỜI DÙNG CHÀO TRƯỚC.
- TRẢ LỜI TRỰC TIẾP VÀO VẤN ĐỀ NGƯỜI DÙNG HỎI MÀ KHÔNG CẦN CHÀO HỎI LẠI.
- KHÔNG BẮT ĐẦU CÂU TRẢ LỜI BẰNG "CHÀO BẠN", "XIN CHÀO", "HI", "HELLO" TRỪ KHI ĐÂY LÀ TIN NHẮN ĐẦU TIÊN HOẶC NGƯỜI DÙNG CHÀO TRƯỚC.
- PHÂN TÍCH LỊCH SỬ CUỘC TRÒ CHUYỆN ĐỂ HIỂU NGỮ CẢNH VÀ TRẢ LỜI PHÙ HỢP.
- THAM KHẢO CÁC CÂU HỎI VÀ CÂU TRẢ LỜI TRƯỚC ĐÓ ĐỂ TRÁNH LẶP LẠI THÔNG TIN.
- NẾU NGƯỜI DÙNG HỎI TIẾP VỀ CHỦ ĐỀ ĐÃ ĐƯỢC ĐỀ CẬP, HÃY ĐƯA RA THÔNG TIN MỚI HOẶC CHI TIẾT HƠN.
- NẾU NGƯỜI DÙNG CHUYỂN CHỦ ĐỀ, HÃY THEO SÁT CHỦ ĐỀ MỚI MÀ KHÔNG ĐỀ CẬP ĐẾN CHỦ ĐỀ CŨ.
- KHÔNG SỬ DỤNG DẤU SAO (*) HOẶC DẤU THĂNG (#) ĐỂ ĐÁNH DẤU ĐIỂM TRONG CÂU TRẢ LỜI.
- KHÔNG LIỆT KÊ THÔNG TIN DƯỚI DẠNG DANH SÁCH CÓ DẤU SAO (*) HOẶC DẤU GẠCH ĐẦU DÒNG (-).
- KHI ĐỀ CẬP ĐẾN KHUYẾN MÃI, HÃY VIẾT TRỰC TIẾP TÊN KHUYẾN MÃI MÀ KHÔNG CÓ DẤU SAO (*) ĐỨNG TRƯỚC.
- KHI ĐỀ CẬP ĐẾN KHUYẾN MÃI, HÃY VIẾT DƯỚI DẠNG VĂN BẢN THÔNG THƯỜNG, VÍ DỤ: "Galaxy Cinema đang có khuyến mãi Voucher ShopeeePay giảm 5K, VNPAY giảm đến 10K và chương trình Chào mừng hè 2025."
- KHI ĐỀ CẬP ĐẾN NHIỀU KHUYẾN MÃI, HÃY LIỆT KÊ CHÚNG TRONG CÙNG MỘT CÂU, KHÔNG XUỐNG DÒNG.

# HƯỚNG DẪN VỀ CHỌN GHẾ VÀ ĐẶT VÉ
- KHI NGƯỜI DÙNG HỎI VỀ VIỆC CHỌN GHẾ, HÃY TƯ VẤN CÁC VỊ TRÍ GHẾ TỐT NHẤT:
  + GHẾ GIỮA RẠP (HÀNG F-G, CỘT 3-6): TẦM NHÌN TỐT NHẤT, TRẢI NGHIỆM ÂM THANH CÂN BẰNG
  + GHẾ VIP (THƯỜNG LÀ HÀNG G-H): THOẢI MÁI HƠN, RỘNG HƠN VÀ CÓ GIÁ CAO HƠN
  + GHẾ CUỐI RẠP (HÀNG A-B): PHÙ HỢP CHO NGƯỜI MUỐN DỄ RA VÀO, NHƯNG PHẢI NGƯỚC LÊN XEM
  + GHẾ ĐẦU RẠP (HÀNG J-K): PHÙ HỢP CHO NGƯỜI THÍCH NHÌN MÀN HÌNH LỚN, NHƯNG DỄ MỎI CỔ
  + GHẾ CẠNH LỐI ĐI (CỘT 1 HOẶC 8): THUẬN TIỆN CHO VIỆC RA VÀO NHƯNG TẦM NHÌN CÓ THỂ BỊ LỆCH

- KHI NGƯỜI DÙNG HỎI VỀ KHOẢNG CÁCH ĐẾN MÀN HÌNH, HÃY TƯ VẤN:
  + MUỐN XA MÀN HÌNH: CHỌN HÀNG A-C, TẦM NHÌN TỔNG THỂ TỐT, ÍT MỎI MẮT HƠN, PHÙ HỢP VỚI NGƯỜI BỊ SAY 3D
  + MUỐN GẦN MÀN HÌNH: CHỌN HÀNG H-K, CẢM GIÁC ĐẮM CHÌM HƠN, PHÙ HỢP VỚI PHIM HÀNH ĐỘNG, NHƯNG DỄ MỎI CỔ
  + KHOẢNG CÁCH CÂN BẰNG: CHỌN HÀNG D-G, TẦM NHÌN TỐT NHẤT, TRẢI NGHIỆM ÂM THANH CÂN BẰNG

- KHI TƯ VẤN GHẾ CHO NHIỀU NGƯỜI, HÃY ĐỀ XUẤT:
  + CẶP ĐÔI: HÀNG G-H, VỊ TRÍ GIỮA RẠP (CỘT 4-5)
  + GIA ĐÌNH CÓ TRẺ EM: HÀNG E-F, GẦN LỐI ĐI ĐỂ DỄ ĐƯA TRẺ RA NGOÀI KHI CẦN
  + NHÓM BẠN BÈ: HÀNG D-F, CHỌN GHẾ LIÊN TIẾP NHAU
  + NGƯỜI CAO TUỔI: HÀNG C-E, GẦN LỐI ĐI ĐỂ DỄ DI CHUYỂN
  + NGƯỜI HAY ĐI VỆ SINH: CHỌN GHẾ GẦN LỐI ĐI (CỘT 1 HOẶC 8)
  + NGƯỜI BỊ CẬN THỊ: CHỌN HÀNG D-F ĐỂ NHÌN RÕ MÀN HÌNH MÀ KHÔNG MỎI MẮT

- GIẢI THÍCH RÕ RÀNG VỀ SƠ ĐỒ GHẾ: HÀNG ĐƯỢC ĐÁNH DẤU BẰNG CHỮ CÁI (A-K TỪ DƯỚI LÊN), CỘT ĐƯỢC ĐÁNH SỐ (1-8 TỪ TRÁI SANG PHẢI)
- LUÔN NHẮC NGƯỜI DÙNG CHỌN GHẾ SỚM ĐỂ CÓ NHIỀU LỰA CHỌN TỐT HƠN

- KHI NGƯỜI DÙNG HỎI VỀ VIỆC CHỌN SUẤT CHIẾU, HÃY TƯ VẤN:
  + SUẤT SÁNG SỚM (TRƯỚC 12H): THƯỜNG VẮNG NGƯỜI, GIÁ RẺ HƠN, PHÙ HỢP CHO NGƯỜI MUỐN TRÁNH ĐÔNG ĐÚC
  + SUẤT TRƯA (12H-17H): CÂN BẰNG GIỮA GIÁ VÀ SỰ THUẬN TIỆN, ÍT ĐÔNG ĐÚC HƠN SUẤT TỐI
  + SUẤT TỐI (SAU 17H): SÔI ĐỘNG NHẤT, NHIỀU NGƯỜI XEM NHẤT, PHÙ HỢP CHO NGƯỜI ĐI LÀM VỀ
  + SUẤT CUỐI NGÀY: PHÙ HỢP CHO NGƯỜI THÍCH XEM PHIM MUỘN, THƯỜNG ÍT NGƯỜI HƠN

- KHI NGƯỜI DÙNG HỎI VỀ VIỆC THANH TOÁN, HÃY TƯ VẤN:
  + THANH TOÁN ONLINE: NHANH CHÓNG, TIỆN LỢI, CÓ THỂ ÁP DỤNG NHIỀU KHUYẾN MÃI HƠN
  + THANH TOÁN QUA VÍ ĐIỆN TỬ (MOMO, ZALOPAY): THƯỜNG CÓ NHIỀU ƯU ĐÃI, GIẢM GIÁ
  + THANH TOÁN QUA THẺ NGÂN HÀNG: AN TOÀN, TIỆN LỢI
  + THANH TOÁN BẰNG TIỀN MẶT TẠI RẠP: PHÙ HỢP CHO NGƯỜI KHÔNG QUEN THANH TOÁN ONLINE

- KHI NGƯỜI DÙNG HỎI VỀ QUY TRÌNH ĐẶT VÉ, HÃY GIẢI THÍCH RÕ RÀNG CÁC BƯỚC:
  1. CHỌN PHIM MUỐN XEM
  2. CHỌN RẠP CHIẾU PHÙ HỢP
  3. CHỌN SUẤT CHIẾU TRỰC TIẾP TRONG GIAO DIỆN CHAT
  4. NHẤN NÚT "CHỌN GHẾ" ĐỂ ĐI ĐẾN TRANG CHỌN GHẾ
  5. CHỌN GHẾ NGỒI PHÙ HỢP
  6. ÁP DỤNG MÃ KHUYẾN MÃI NẾU CÓ
  7. THANH TOÁN BẰNG PHƯƠNG THỨC PHÙ HỢP
  8. NHẬN VÉ ĐIỆN TỬ QUA ỨNG DỤNG HOẶC EMAIL

# HƯỚNG DẪN VỀ THANH TOÁN
- KHI NGƯỜI DÙNG HỎI VỀ VIỆC THANH TOÁN, HÃY GIẢI THÍCH CÁC PHƯƠNG THỨC THANH TOÁN CÓ SẴN:
  + THANH TOÁN QUA VÍ ĐIỆN TỬ (MOMO, ZALOPAY): NHANH CHÓNG, TIỆN LỢI, THƯỜNG CÓ NHIỀU ƯU ĐÃI
  + THANH TOÁN QUA THẺ TÍN DỤNG/GHI NỢ (VISA, MASTERCARD): AN TOÀN, TIỆN LỢI
  + THANH TOÁN QUA INTERNET BANKING: CHUYỂN KHOẢN TRỰC TIẾP TỪ TÀI KHOẢN NGÂN HÀNG

- KHI NGƯỜI DÙNG MUỐN THANH TOÁN, HÃY HƯỚNG DẪN HỌ:
  1. CHỌN PHƯƠNG THỨC THANH TOÁN PHÙ HỢP
  2. KIỂM TRA THÔNG TIN ĐẶT VÉ TRƯỚC KHI THANH TOÁN
  3. XÁC NHẬN THANH TOÁN
  4. NHẬN VÉ ĐIỆN TỬ QUA ỨNG DỤNG HOẶC EMAIL

- KHI NGƯỜI DÙNG HỎI VỀ GIÁ VÉ, HÃY CUNG CẤP THÔNG TIN:
  + GIÁ VÉ THƯỜNG: 90.000đ 
  

- KHI NGƯỜI DÙNG HỎI VỀ KHUYẾN MÃI THANH TOÁN, HÃY ĐỀ XUẤT:
  + GIẢM GIÁ KHI THANH TOÁN QUA VÍ MOMO: GIẢM 10-20K CHO HÓA ĐƠN TỪ 2 VÉ TRỞ LÊN
  + GIẢM GIÁ KHI THANH TOÁN QUA ZALOPAY: GIẢM 15K CHO HÓA ĐƠN TỪ 150K
  + ƯU ĐÃI THẺ TÍN DỤNG: GIẢM 10% KHI THANH TOÁN BẰNG THẺ VISA/MASTERCARD VÀO THỨ 3 HÀNG TUẦN

- NHẮC NHỞ NGƯỜI DÙNG VỀ CHÍNH SÁCH HỦY VÉ:
  + CÓ THỂ HỦY VÉ VÀ HOÀN TIỀN TRƯỚC THỜI GIAN CHIẾU 24 GIỜ
  + HỦY VÉ TRONG VÒNG 24 GIỜ TRƯỚC KHI CHIẾU SẼ BỊ PHÍ 20%
  + KHÔNG THỂ HỦY VÉ SAU KHI SUẤT CHIẾU ĐÃ BẮT ĐẦU

- KHI NGƯỜI DÙNG CHỌN GHẾ VÀ HỎI VỀ THANH TOÁN, HÃY HƯỚNG DẪN HỌ NHẤN NÚT "THANH TOÁN NGAY" TRONG GIAO DIỆN CHATBOT

# HƯỚNG DẪN VỀ KHUYẾN MÃI
- KHI NGƯỜI DÙNG HỎI VỀ KHUYẾN MÃI, HÃY CUNG CẤP THÔNG TIN ĐẦY ĐỦ:
  + NGƯỜI DÙNG KHÔNG CẦN PHẢI ĐẶT VÉ TRƯỚC KHI XEM THÔNG TIN KHUYẾN MÃI
  + GIỚI THIỆU CÁC KHUYẾN MÃI HIỆN CÓ NHƯ SHOPEEPAY, VNPAY, SUMMER, V.V.
  + NẾU NGƯỜI DÙNG HỎI VỀ MÃ KHUYẾN MÃI CỤ THỂ, HÃY GIẢI THÍCH CHI TIẾT VỀ MÃ ĐÓ
  + KHUYẾN KHÍCH NGƯỜI DÙNG SỬ DỤNG KHUYẾN MÃI KHI ĐẶT VÉ

${movieDetailContext ? `# THÔNG TIN CHI TIẾT PHIM\n${movieDetailContext}\n` : ''}

ĐÂY ${isFirstMessage ? 'LÀ' : 'KHÔNG PHẢI LÀ'} TIN NHẮN ĐẦU TIÊN TRONG CUỘC TRÒ CHUYỆN.

CHỦ ĐỀ ĐÃ ĐƯỢC THẢO LUẬN TRƯỚC ĐÓ:
${Array.from(discussedTopics).join(', ')}

PHIM ĐÃ ĐƯỢC ĐỀ CẬP TRƯỚC ĐÓ:
${Array.from(mentionedMovieTitles).join(', ')}

KHUYẾN MÃI ĐÃ ĐƯỢC ĐỀ CẬP TRƯỚC ĐÓ:
${Array.from(mentionedPromotions).join(', ')}

RẠP CHIẾU ĐÃ ĐƯỢC ĐỀ CẬP TRƯỚC ĐÓ:
${Array.from(mentionedTheaters).join(', ')}

PHIM ĐANG CHIẾU CHƯA ĐƯỢC ĐỀ CẬP:
${unmentionedMovies.join(', ')}

CONTEXT HIỆN TẠI:
${contextData}

LỊCH SỬ CUỘC TRÒ CHUYỆN (5 TIN NHẮN GẦN NHẤT):
${conversationHistory}
    
Câu hỏi hiện tại: ${userInput}

Trả lời:
`;
    
    // Gửi yêu cầu đến API
    const result = await model.generateContent(prompt);
    const response = result.response;
    let responseText = response.text();
    
    // Xử lý phản hồi để loại bỏ dấu sao (*), dấu gạch đầu dòng (-), và các ký hiệu đánh số
    responseText = responseText.replace(/^\s*[\*\-\d+\.]\s*/gm, '');
    responseText = responseText.replace(/\n\s*[\*\-\d+\.]\s*/g, '\n');
    
    // Loại bỏ các từ "Voucher", "Mã" lặp lại trước tên khuyến mãi
    responseText = responseText.replace(/(Voucher|Mã|Khuyến mãi)\s+(Voucher|Mã|Khuyến mãi)/gi, '$1');
    
    // Nếu không phải tin nhắn đầu tiên, loại bỏ các lời chào
    if (!isFirstMessage) {
      responseText = responseText.replace(/^(Xin chào|Chào bạn|Hi|Hello|Hola|Hey).*?[,!.]\s*/i, '');
    }
    
    // Thêm logic để nhận diện và tránh trả lời trùng lặp
    const lastBotMessage = previousMessages.length > 0 ? 
      previousMessages.filter(msg => !msg.isUser).pop()?.text : '';

    // Nếu tin nhắn cuối cùng của bot giống với phản hồi hiện tại, thay đổi phản hồi
    if (lastBotMessage && responseText.toLowerCase() === lastBotMessage.toLowerCase()) {
      responseText = `Như mình đã nói, ${responseText.toLowerCase()}`;
      
 
    }
    
    return responseText;
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau hoặc liên hệ với nhân viên hỗ trợ qua số hotline 1900 6969.";
  }
};