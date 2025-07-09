import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Shield, CreditCard, Smartphone, QrCode } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking } from '../services/booking';

interface TicketInfo {
  movie: string;
  cinema: string;
  date: string;
  time: string;
  seats: string[];
  screeningId: string;
  ticketPrice: number;
  bookingId?: string;
  baseTotal?: number;
  discount?: number;
  finalTotal?: number;
  appliedPromoCode?: string;
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
  const params = useLocalSearchParams();

  // Computed values
  const finalTotal = ticketInfo?.finalTotal || ticketInfo?.ticketPrice || 0;
  const discount = ticketInfo?.discount || 0;
  const appliedPromoCode = ticketInfo?.appliedPromoCode || '';

  // Debug log để xem params nhận được
  console.log('PaymentScreen params:', params);

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
            const bookingId = Array.isArray(params.bookingId) ? params.bookingId[0] : params.bookingId;
            
            // Nhận thông tin promo từ params
            const baseTotal = parseInt((Array.isArray(params.baseTotal) ? params.baseTotal[0] : params.baseTotal) || '0') || ticketPrice * seats.length;
            const discount = parseInt((Array.isArray(params.discount) ? params.discount[0] : params.discount) || '0') || 0;
            const finalTotal = parseInt((Array.isArray(params.finalTotal) ? params.finalTotal[0] : params.finalTotal) || '0') || (baseTotal - discount);
            const appliedPromoCode = Array.isArray(params.appliedPromoCode) ? params.appliedPromoCode[0] : (params.appliedPromoCode || '');
            
            console.log('Setting ticket info from params:', {
              movieTitle,
              cinemaName,
              selectedDate,
              selectedTime,
              seats,
              screeningId,
              bookingId,
              baseTotal,
              discount,
              finalTotal,
              appliedPromoCode,
            });
            
            setTicketInfo({
              movie: movieTitle,
              cinema: cinemaName,
              date: selectedDate,
              time: selectedTime,
              seats: seats,
              screeningId: screeningId,
              ticketPrice: baseTotal,
              bookingId: bookingId,
              baseTotal: baseTotal,
              discount: discount,
              finalTotal: finalTotal,
              appliedPromoCode: appliedPromoCode,
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
  }, [params.movie, params.cinema, params.date, params.time, params.seats, params.screeningId, params.bookingId, params.baseTotal, params.discount, params.finalTotal, params.appliedPromoCode, params.movieTitle, params.cinemaName, params.selectedDate, params.selectedTime, params.selectedSeats]);

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
      const bookingData: any = {
        screeningId: ticketInfo.screeningId,
        seatNumbers: ticketInfo.seats,
        code: null, // Luôn là null khi không có mã khuyến mãi
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
                    {(ticketInfo.baseTotal || ticketInfo.ticketPrice).toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              {discount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.discountLabel}>Giảm giá ({appliedPromoCode}):</Text>
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
  // Discount styles
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
});