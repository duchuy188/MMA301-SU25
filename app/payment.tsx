import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Shield, CreditCard, Smartphone, QrCode, Tag, Check } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking } from '../services/booking';
import { validatePromotionCode, getAllPromotions, Promotion } from '../services/promotion';

interface TicketInfo {
  movie: string;
  cinema: string;
  date: string;
  time: string;
  seats: string[];
  screeningId: string;
  ticketPrice: number;
  bookingId?: string; // Thêm bookingId
}

const paymentMethods = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: <Smartphone size={24} color="#FFD700" />,
    description: 'Thanh toán qua ví điện tử MoMo',
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: <QrCode size={24} color="#FFD700" />,
    description: 'Thanh toán qua ví ZaloPay',
  },
  {
    id: 'visa',
    name: 'Thẻ Visa/Mastercard',
    icon: <CreditCard size={24} color="#FFD700" />,
    description: 'Thanh toán bằng thẻ tín dụng',
  },
];

export default function PaymentScreen() {
  const [selectedMethod, setSelectedMethod] = useState('momo');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [isLoadingPromo, setIsLoadingPromo] = useState(false);
  const params = useLocalSearchParams();

  // Computed values
  const finalTotal = ticketInfo ? Math.max(0, ticketInfo.ticketPrice - discount) : 0;

  // Debug log để xem params nhận được
  console.log('PaymentScreen params:', params);

  // Debug useEffect to track discount changes
  useEffect(() => {
    console.log('Discount changed:', discount, 'Final total is now:', finalTotal);
  }, [discount, finalTotal]);

  useEffect(() => {
    // Nhận dữ liệu từ route params
    const loadTicketInfo = async () => {
      try {
        // Kiểm tra xem có params không
        if (params && Object.keys(params).length > 0) {
          console.log('Received params:', params);
          
          // Thử lấy từ params với structure mới: movie, cinema, date, time, seats, bookingId
          if (params.movie && params.cinema && params.date && params.time && params.seats) {
            // Parse seats từ string "H5,H6" thành array ["H5", "H6"]
            const seats = typeof params.seats === 'string' 
              ? params.seats.split(',').map(seat => seat.trim())
              : Array.isArray(params.seats) ? params.seats : ['F7', 'F8'];
            
            const ticketPriceParam = Array.isArray(params.ticketPrice) ? params.ticketPrice[0] : params.ticketPrice;
            const ticketPrice = parseInt(ticketPriceParam || '200000') || 200000;
            
            const movieTitle = Array.isArray(params.movie) ? params.movie[0] : params.movie;
            const cinemaName = Array.isArray(params.cinema) ? params.cinema[0] : params.cinema;
            const selectedDate = Array.isArray(params.date) ? params.date[0] : params.date;
            const selectedTime = Array.isArray(params.time) ? params.time[0] : params.time;
            const screeningId = Array.isArray(params.screeningId) ? params.screeningId[0] : (params.screeningId || 'sample_screening_id');
            const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId; // Lấy bookingId
            
            // Tính toán tổng tiền
            const totalTicketPrice = ticketPrice * seats.length;
            
            console.log('Setting ticket info from params:', {
              movieTitle,
              cinemaName,
              selectedDate,
              selectedTime,
              seats,
              screeningId,
              bookingId,
              ticketPrice: totalTicketPrice,
              discount: 0,
              total: totalTicketPrice
            });
            
            setTicketInfo({
              movie: movieTitle,
              cinema: cinemaName,
              date: selectedDate,
              time: selectedTime,
              seats: seats,
              screeningId: screeningId,
              ticketPrice: totalTicketPrice,
              bookingId: bookingId, // Lưu bookingId
            });
            return;
          }
          
          // Fallback: thử với structure cũ nếu có
          if (params.movieTitle && params.cinemaName && params.selectedDate && params.selectedTime && params.selectedSeats) {
            const seats = typeof params.selectedSeats === 'string' 
              ? JSON.parse(params.selectedSeats) 
              : Array.isArray(params.selectedSeats) ? params.selectedSeats : ['F7', 'F8'];
            
            const ticketPriceParam = Array.isArray(params.ticketPrice) ? params.ticketPrice[0] : params.ticketPrice;
            const ticketPrice = parseInt(ticketPriceParam || '200000') || 200000;
            
            const movieTitle = Array.isArray(params.movieTitle) ? params.movieTitle[0] : params.movieTitle;
            const cinemaName = Array.isArray(params.cinemaName) ? params.cinemaName[0] : params.cinemaName;
            const selectedDate = Array.isArray(params.selectedDate) ? params.selectedDate[0] : params.selectedDate;
            const selectedTime = Array.isArray(params.selectedTime) ? params.selectedTime[0] : params.selectedTime;
            const screeningId = Array.isArray(params.screeningId) ? params.screeningId[0] : (params.screeningId || 'sample_screening_id');
            
            setTicketInfo({
              movie: movieTitle,
              cinema: cinemaName,
              date: selectedDate,
              time: selectedTime,
              seats: seats,
              screeningId: screeningId,
              ticketPrice: ticketPrice * seats.length,
            });
            return;
          }
        }
        
        // Nếu không có params hoặc params không đầy đủ, dùng dữ liệu mẫu
        console.log('Using fallback data');
        setTicketInfo({
          movie: 'Avengers: Endgame',
          cinema: 'Galaxy Cinema Nguyễn Du',
          date: '22/12/2024',
          time: '19:30',
          seats: ['F7', 'F8'],
          screeningId: 'sample_screening_id',
          ticketPrice: 400000,
        });
      } catch (error) {
        console.error('Error loading ticket info:', error);
        // Fallback data
        setTicketInfo({
          movie: 'Avengers: Endgame',
          cinema: 'Galaxy Cinema Nguyễn Du',
          date: '22/12/2024',
          time: '19:30',
          seats: ['F7', 'F8'],
          screeningId: 'sample_screening_id',
          ticketPrice: 400000,
        });
      }
    };

    loadTicketInfo();
  }, [params.movie, params.cinema, params.date, params.time, params.seats, params.screeningId, params.bookingId, params.movieTitle, params.cinemaName, params.selectedDate, params.selectedTime, params.selectedSeats]); // Dependency array hỗ trợ cả 2 structure và bookingId

  // Load available promotions
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        // Get all promotions and filter active ones
        const response = await getAllPromotions();
        if (response.success && response.data) {
          // Filter active promotions on the client side
          const activePromotions = response.data.filter(promotion => 
            promotion.isActive && 
            promotion.status === 'approved' &&
            new Date(promotion.endDate) > new Date()
          );
          setAvailablePromotions(activePromotions);
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
      }
    };

    loadPromotions();
  }, []);

  const applyPromoCode = async () => {
    if (!ticketInfo || !promoCode.trim()) return;
    
    console.log('Applying promo code:', promoCode.trim());
    setIsLoadingPromo(true);
    try {
      // Test với dữ liệu mẫu cho mã "EEEE" và "RRRR"
      if (promoCode.trim().toUpperCase() === 'EEEE' || promoCode.trim().toUpperCase() === 'RRRR') {
        let testPromotion: Promotion;
        
        if (promoCode.trim().toUpperCase() === 'EEEE') {
          console.log('Using test promotion for EEEE');
          testPromotion = {
            _id: 'test_eeee',
            code: 'EEEE',
            name: 'Test Fixed Promotion',
            description: 'Test fixed discount',
            type: 'fixed',
            value: 10000,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            isActive: true,
            status: 'approved',
            createdBy: 'test',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01'
          };
        } else {
          console.log('Using test promotion for RRRR');
          testPromotion = {
            _id: 'test_rrrr',
            code: 'RRRR',
            name: 'Test Percent Promotion',
            description: 'Test percent discount',
            type: 'percent',
            value: 2,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            isActive: true,
            status: 'approved',
            createdBy: 'test',
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01'
          };
        }
        
        console.log('Test promotion data:', testPromotion);
        
        // Calculate discount
        let discountAmount = 0;
        console.log('Calculating discount for type:', testPromotion.type, 'value:', testPromotion.value);
        
        if (testPromotion.type === 'percent') {
          const percentageAmount = (ticketInfo.ticketPrice * testPromotion.value) / 100;
          discountAmount = Math.round(percentageAmount);
          console.log('Percent calculation:', {
            ticketPrice: ticketInfo.ticketPrice,
            percentValue: testPromotion.value,
            percentageAmount: percentageAmount,
            roundedAmount: discountAmount
          });
        } else if (testPromotion.type === 'fixed') {
          discountAmount = testPromotion.value;
          console.log('Fixed discount amount:', discountAmount);
        }
        
        // Ensure discount doesn't exceed ticket price
        discountAmount = Math.min(discountAmount, ticketInfo.ticketPrice);
        
        const newTotal = ticketInfo.ticketPrice - discountAmount;
        
        console.log('Test Before update:', { 
          ticketPrice: ticketInfo.ticketPrice, 
          discountAmount, 
          newTotal,
          oldDiscount: discount,
          currentFinalTotal: finalTotal
        });
        
        setAppliedPromo(testPromotion);
        setDiscount(discountAmount);
        
        console.log('Test Updated discount:', discountAmount, 'New final total should be:', newTotal);
        
        Alert.alert(
          'Áp dụng thành công!', 
          `Mã "${testPromotion.code}" đã được áp dụng. ${testPromotion.type === 'percent' ? `Giảm ${testPromotion.value}%` : `Giảm ${testPromotion.value.toLocaleString('vi-VN')} VNĐ`}`
        );
        setPromoCode('');
        setIsLoadingPromo(false);
        return;
      }
      
      const response = await validatePromotionCode(promoCode.trim());
      console.log('API response:', response);
      
      if (response.success && response.data) {
        const promotion = response.data;
        console.log('Promotion data:', promotion);
        
        // Calculate discount
        let discountAmount = 0;
        console.log('API - Calculating discount for type:', promotion.type, 'value:', promotion.value);
        
        if (promotion.type === 'percent') {
          const percentageAmount = (ticketInfo.ticketPrice * promotion.value) / 100;
          discountAmount = Math.round(percentageAmount);
          console.log('API - Percent calculation:', {
            ticketPrice: ticketInfo.ticketPrice,
            percentValue: promotion.value,
            percentageAmount: percentageAmount,
            roundedAmount: discountAmount
          });
        } else if (promotion.type === 'fixed') {
          discountAmount = promotion.value;
          console.log('API - Fixed discount amount:', discountAmount);
        }
        
        // Ensure discount doesn't exceed ticket price
        discountAmount = Math.min(discountAmount, ticketInfo.ticketPrice);
        
        const newTotal = ticketInfo.ticketPrice - discountAmount;
        
        console.log('Before update:', { 
          ticketPrice: ticketInfo.ticketPrice, 
          discountAmount, 
          newTotal,
          oldDiscount: discount,
          currentFinalTotal: finalTotal
        });
        
        setAppliedPromo(promotion);
        setDiscount(discountAmount);
        
        console.log('Updated discount:', discountAmount, 'New final total should be:', newTotal);
        
        Alert.alert(
          'Áp dụng thành công!', 
          `Mã "${promotion.code}" đã được áp dụng. ${promotion.type === 'percent' ? `Giảm ${promotion.value}%` : `Giảm ${promotion.value.toLocaleString('vi-VN')} VNĐ`}`
        );
        setPromoCode('');
      } else {
        console.log('API response not successful or no data');
        Alert.alert('Lỗi', 'Mã khuyến mãi không hợp lệ');
      }
    } catch (error: any) {
      console.error('Error validating promo code:', error);
      Alert.alert('Lỗi', error.message || 'Mã khuyến mãi không hợp lệ');
    } finally {
      setIsLoadingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscount(0);
  };

  const handlePayment = async () => {
    if (!ticketInfo) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin vé.');
      return;
    }

    setIsLoading(true);
    try {
      let booking;
      
      console.log('=== PAYMENT FLOW START ===');
      console.log('TicketInfo:', ticketInfo);
      
      // SIMPLIFIED APPROACH: Luôn tạo booking mới với status paid
      // Điều này tránh mọi vấn đề với update operations và 404 errors
      
      if (ticketInfo.bookingId) {
        console.log('=== APPROACH: Create new paid booking (workaround) ===');
        console.log('Original pending bookingId:', ticketInfo.bookingId);
      } else {
        console.log('=== APPROACH: Create new booking (normal flow) ===');
      }
      
      // Tạo booking mới với thông tin từ ticket
      const bookingData = {
        screeningId: ticketInfo.screeningId,
        seatNumbers: ticketInfo.seats,
      };
      
      console.log('Creating booking with data:', bookingData);
      booking = await createBooking(bookingData);
      
      if (!booking) {
        console.error('❌ Booking creation failed');
        Alert.alert('Lỗi', 'Đặt vé không thành công. Vui lòng thử lại.');
        return;
      }
      
      console.log('✅ Booking created successfully:', booking);
      console.log('Booking ID:', booking._id);
      console.log('Payment status:', booking.paymentStatus || 'default (should be paid)');
      
      // Lưu thông tin booking để sử dụng trong e-ticket
      const bookingToSave = {
        ...booking,
        ticketInfo: ticketInfo,
        paymentMethod: selectedMethod,
        discount: discount,
        finalTotal: finalTotal,
        // Đảm bảo có paymentStatus - backend có thể tự động set thành 'paid'
        paymentStatus: booking.paymentStatus || 'paid',
        // Thêm thông tin về original pending booking nếu có
        originalPendingBookingId: ticketInfo.bookingId || null,
      };
      
      await AsyncStorage.setItem('currentBooking', JSON.stringify(bookingToSave));
      console.log('Booking saved to AsyncStorage');
      
      Alert.alert(
        'Thanh toán thành công!', 
        'Vé của bạn đã được đặt thành công.',
        [
          {
            text: 'Xem vé',
            onPress: () => {
              console.log('Navigating to e-ticket with bookingId:', booking._id);
              router.push(`/e-ticket?bookingId=${booking._id}`);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('=== PAYMENT ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Hiển thị lỗi với thông tin hữu ích hơn
      let errorMessage = 'Vui lòng thử lại.';
      if (error.response?.status === 400) {
        errorMessage = 'Thông tin đặt vé không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy suất chiếu. Vui lòng chọn suất chiếu khác.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Ghế đã được đặt. Vui lòng chọn ghế khác.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Lỗi thanh toán', 
        `Đã xảy ra lỗi: ${errorMessage}`,
        [
          {
            text: 'Thử lại',
            onPress: () => {}
          },
          {
            text: 'Quay lại',
            onPress: () => router.back(),
            style: 'cancel'
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

      {!ticketInfo ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.content}>
            <View style={styles.ticketSummary}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle}>Thông tin vé</Text>
                <View style={styles.goldLine} />
              </View>
              
              <View style={styles.ticketDetails}>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Phim:</Text>
                  <Text style={styles.ticketValue}>{ticketInfo.movie}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Rạp:</Text>
                  <Text style={styles.ticketValue}>{ticketInfo.cinema}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Ngày:</Text>
                  <Text style={styles.ticketValue}>{ticketInfo.date}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Giờ:</Text>
                  <Text style={styles.ticketValue}>{ticketInfo.time}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Ghế:</Text>
                  <Text style={styles.ticketValue}>{ticketInfo.seats.join(', ')}</Text>
                </View>
              </View>

              <View style={styles.priceBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Giá vé ({ticketInfo.seats.length} ghế):</Text>
                  <Text style={styles.priceValue}>
                    {ticketInfo.ticketPrice.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.discountLabel}>Giảm giá ({appliedPromo?.code}):</Text>
                    <Text style={styles.discountValue}>
                      -{discount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng tiền:</Text>
                  <Text style={styles.totalValue}>
                    {finalTotal.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
            </View>

            {/* Phần mã khuyến mãi */}
            <View style={styles.promoSection}>
              <Text style={styles.sectionTitle}>Mã khuyến mãi</Text>
              
              {appliedPromo ? (
                <View style={styles.appliedPromo}>
                  <View style={styles.promoInfo}>
                    <Tag size={20} color="#FFD700" />
                    <Text style={styles.appliedPromoText}>
                      {appliedPromo.code} - {appliedPromo.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={removePromoCode} style={styles.removePromoButton}>
                    <Text style={styles.removePromoText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoInput}>
                  <TextInput
                    style={styles.promoTextInput}
                    placeholder="Nhập mã khuyến mãi"
                    placeholderTextColor="#666"
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                  />
                  <TouchableOpacity 
                    onPress={applyPromoCode} 
                    style={[styles.applyPromoButton, isLoadingPromo && styles.applyPromoButtonDisabled]}
                    disabled={!promoCode.trim() || isLoadingPromo}
                  >
                    {isLoadingPromo ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <Text style={styles.applyPromoText}>Áp dụng</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Gợi ý mã khuyến mãi từ API */}
              {availablePromotions.length > 0 && !appliedPromo && (
                <View style={styles.promoSuggestions}>
                  <Text style={styles.promoSuggestionsTitle}>Mã khuyến mãi có sẵn:</Text>
                  {availablePromotions.slice(0, 3).map((promotion) => (
                    <TouchableOpacity
                      key={promotion._id}
                      style={styles.promoSuggestion}
                      onPress={() => setPromoCode(promotion.code)}
                    >
                      <Text style={styles.promoSuggestionCode}>
                        {promotion.code}
                      </Text>
                      <Text style={styles.promoSuggestionDesc}>
                        {promotion.name} - {promotion.type === 'percent' ? `${promotion.value}%` : `${promotion.value.toLocaleString('vi-VN')} VNĐ`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Chọn phương thức thanh toán</Text>
              <View style={styles.paymentMethods}>
                {paymentMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethod,
                      selectedMethod === method.id && styles.paymentMethodSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <View style={styles.paymentIcon}>
                      {method.icon}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{method.name}</Text>
                      <Text style={styles.paymentDescription}>{method.description}</Text>
                    </View>
                    <View style={styles.radioButton}>
                      <View style={[
                        styles.radioOuter,
                        selectedMethod === method.id && styles.radioOuterSelected,
                      ]}>
                        {selectedMethod === method.id && <View style={styles.radioInner} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.securitySection}>
              <View style={styles.securityBadge}>
                <Shield size={20} color="#FFD700" />
                <Text style={styles.securityText}>Thanh toán an toàn</Text>
              </View>
              <Text style={styles.securityDescription}>
                Thông tin thanh toán được bảo mật bằng công nghệ SSL 256-bit
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]} 
              onPress={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  XÁC NHẬN THANH TOÁN
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
  },
  content: {
    flex: 1,
  },
  ticketSummary: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ticketTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 8,
  },
  goldLine: {
    width: 60,
    height: 2,
    backgroundColor: '#FFD700',
  },
  ticketDetails: {
    marginBottom: 20,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999',
  },
  ticketValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#999',
  },
  priceValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  totalLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  totalValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#FFD700',
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 15,
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  paymentMethodSelected: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentIcon: {
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  radioButton: {
    marginLeft: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FFD700',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  securitySection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 8,
    marginBottom: 8,
  },
  securityText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
  },
  securityDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  confirmButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#FFD700',
    marginTop: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  // Styles cho mã khuyến mãi
  discountLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#4CAF50',
  },
  discountValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#4CAF50',
  },
  promoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  promoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
  },
  removePromoButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removePromoText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  promoInput: {
    flexDirection: 'row',
    gap: 12,
  },
  promoTextInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  applyPromoButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyPromoButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  applyPromoText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  promoSuggestions: {
    marginTop: 16,
  },
  promoSuggestionsTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
  },
  promoSuggestion: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  promoSuggestionCode: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  promoSuggestionCodeDisabled: {
    color: '#666',
  },
  promoSuggestionDesc: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
});