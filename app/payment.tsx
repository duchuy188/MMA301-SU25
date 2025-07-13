import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Shield, CreditCard, Smartphone, QrCode, Edit3, X } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBooking, updateBookingPaymentStatus, getBookingById, updateBookingPaymentStatusViaStatus, cancelBooking, updateBooking } from '../services/booking';

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

  // Function to format time display
  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    
    // If it's a full datetime string (ISO format), convert to local time
    if (time.includes('T')) {
      try {
        const date = new Date(time);
        // Convert to local time and format as HH:MM
        return date.toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } catch (error) {
        return time;
      }
    }
    
    // If it's already in HH:MM format, return as is
    return time;
  };

  // Function to format date display to dd-mm-yyyy
  const formatDateDisplay = (date: string) => {
    if (!date) return '';
    
    // If it's already in dd-mm-yyyy format, return as is
    if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return date;
    }
    
    // If it's in yyyy-mm-dd format, convert to dd-mm-yyyy
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // If it's a full datetime string, extract and format date
    if (date.includes('T')) {
      try {
        const dateObj = new Date(date);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      } catch (error) {
        return date;
      }
    }
    
    // Try to parse other date formats
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (error) {
      // Return original if can't parse
    }
    
    return date;
  };

  useEffect(() => {
    // Nhận dữ liệu từ route params
    const loadTicketInfo = async () => {
      try {
        // Kiểm tra xem có params không
        if (params && Object.keys(params).length > 0) {
          
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
            
            // Validate MongoDB ObjectID format (24 characters, hex)
            const isValidObjectId = bookingId && bookingId.length === 24 && /^[0-9a-fA-F]{24}$/.test(bookingId);
            if (bookingId && !isValidObjectId) {
              // WARNING: Booking ID does not match MongoDB ObjectID format
            }
            
            // Nhận thông tin promo từ params
            const baseTotal = parseInt((Array.isArray(params.baseTotal) ? params.baseTotal[0] : params.baseTotal) || '0') || ticketPrice * seats.length;
            const discount = parseInt((Array.isArray(params.discount) ? params.discount[0] : params.discount) || '0') || 0;
            const finalTotal = parseInt((Array.isArray(params.finalTotal) ? params.finalTotal[0] : params.finalTotal) || '0') || (baseTotal - discount);
            const appliedPromoCode = Array.isArray(params.appliedPromoCode) ? params.appliedPromoCode[0] : (params.appliedPromoCode || '');
            
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
      
      // Check if we have an existing pending booking to update
      if (ticketInfo.bookingId && ticketInfo.bookingId.trim().length > 0) {
        
        // First, let's verify the booking exists and get its current status
        try {
          const existingBooking = await getBookingById(ticketInfo.bookingId);
          
          if (!existingBooking) {
            throw new Error('Booking not found');
          }
          
          if (existingBooking.paymentStatus === 'paid') {
            Alert.alert('Thông báo', 'Vé này đã được thanh toán rồi.');
            return;
          }
          
        } catch (verifyError: any) {
          // Don't return here - continue with the update attempt
        }
        
        // Try to update the existing booking status to paid
        try {
          const updatedBooking = await updateBookingPaymentStatusViaStatus(
            ticketInfo.bookingId, 
            'paid',
            finalTotal,
            ticketInfo.baseTotal || ticketInfo.ticketPrice,
            discount
          );
          
          if (updatedBooking) {
            const backendWorked = updatedBooking.paymentStatus === 'paid';
            
            const bookingData = {
              _id: ticketInfo.bookingId,
              screeningId: ticketInfo.screeningId,
              seatNumbers: ticketInfo.seats,
              totalPrice: finalTotal,
              basePrice: ticketInfo.baseTotal || ticketInfo.ticketPrice,
              discount: discount,
              paymentStatus: 'paid',
              backendUpdateWorked: backendWorked,
              updateMethod: 'status-endpoint',
              ...updatedBooking,
            };
            
            bookingData._id = ticketInfo.bookingId;
            bookingData.paymentStatus = 'paid';
            
            booking = { data: bookingData };
          } else {
            throw new Error('Status endpoint update returned null/undefined');
          }
        } catch (statusUpdateError: any) {
          
          // Try legacy updateBookingPaymentStatus API as fallback
          try {
            const legacyUpdate = await updateBookingPaymentStatus(ticketInfo.bookingId, 'paid');
            
            if (legacyUpdate) {
              const legacyWorked = legacyUpdate.paymentStatus === 'paid';
              
              const bookingData = {
                _id: ticketInfo.bookingId,
                screeningId: ticketInfo.screeningId,
                seatNumbers: ticketInfo.seats,
                totalPrice: finalTotal,
                basePrice: ticketInfo.baseTotal || ticketInfo.ticketPrice,
                discount: discount,
                paymentStatus: 'paid',
                backendUpdateWorked: legacyWorked,
                updateMethod: 'legacy-put',
                ...legacyUpdate,
              };
              
              bookingData._id = ticketInfo.bookingId;
              bookingData.paymentStatus = 'paid';
              
              booking = { data: bookingData };
            } else {
              throw new Error('Legacy update returned null/undefined');
            }
          } catch (legacyError: any) {
            
            // Show error to user
            Alert.alert(
              'Cảnh báo', 
              'Không thể cập nhật trạng thái thanh toán. Vui lòng liên hệ hỗ trợ khách hàng.',
              [
                {
                  text: 'Tiếp tục',
                  onPress: () => {
                    // Force continue with local paid status
                    const bookingData = {
                      _id: ticketInfo.bookingId,
                      screeningId: ticketInfo.screeningId,
                      seatNumbers: ticketInfo.seats,
                      totalPrice: finalTotal,
                      basePrice: ticketInfo.baseTotal || ticketInfo.ticketPrice,
                      discount: discount,
                      paymentStatus: 'paid',
                      backendUpdateWorked: false,
                      updateMethod: 'local-only',
                    };
                    
                    booking = { data: bookingData };
                  }
                },
                {
                  text: 'Hủy',
                  style: 'cancel',
                  onPress: () => {
                    setIsLoading(false);
                    return;
                  }
                }
              ]
            );
            return;
          }
        }
      } else {
        
        // Create a new booking with 'paid' status
        const bookingData: any = {
          screeningId: ticketInfo.screeningId,
          seatNumbers: ticketInfo.seats,
          totalPrice: finalTotal,
          basePrice: ticketInfo.baseTotal || ticketInfo.ticketPrice,
          discount: discount,
          paymentStatus: 'paid'
        };
        
        if (appliedPromoCode) {
          bookingData.code = appliedPromoCode;
        }
        
        booking = await createBooking(bookingData);
        
        if (booking && booking.data) {
          const newBookingWorked = booking.data.paymentStatus === 'paid';
          booking.data.backendUpdateWorked = newBookingWorked;
          booking.data.isNewBooking = true;
          booking.data.updateMethod = 'new-booking';
          
          if (!newBookingWorked) {
            booking.data.paymentStatus = 'paid';
          }
        }
      }
      
      if (!booking) {
        Alert.alert('Lỗi', 'Đặt vé không thành công. Vui lòng thử lại.');
        return;
      }
      
      const bookingData = booking.data || booking;
      
      if (bookingData.paymentStatus !== 'paid') {
        bookingData.paymentStatus = 'paid';
      }
      
      // Save booking information for e-ticket display
      const bookingToSave = {
        ...bookingData,
        ticketInfo: ticketInfo,
        paymentMethod: selectedMethod,
        discount: discount,
        finalTotal: finalTotal,
        paymentStatus: 'paid',
        originalPendingBookingId: ticketInfo.bookingId || null,
        backendUpdateWorked: bookingData.backendUpdateWorked || false,
        updateMethod: bookingData.updateMethod || 'unknown',
      };
      
      await AsyncStorage.setItem('currentBooking', JSON.stringify(bookingToSave));
      
      Alert.alert(
        'Thanh toán thành công!',
        'Vé của bạn đã được đặt thành công. Bạn có thể xem chi tiết vé trong mục Vé của tôi.',
        [
          {
            text: 'Xem vé',
            onPress: () => {
              router.push({
                pathname: '/e-ticket',
                params: {
                  bookingId: bookingData._id,
                  fromPayment: 'true'
                }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      
      let errorMessage = 'Vui lòng thử lại.';
      if (error.response?.status === 400) {
        errorMessage = 'Thông tin đặt vé không hợp lệ. Vui lòng kiểm tra lại.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy suất chiếu hoặc booking. Vui lòng thử lại.';
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
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!ticketInfo?.bookingId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt vé để hủy.');
      return;
    }

    Alert.alert(
      'Xác nhận hủy vé',
      'Bạn có chắc chắn muốn hủy đặt vé này không? Hành động này không thể hoàn tác.',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy vé',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await cancelBooking(ticketInfo.bookingId!);
              
              if (result.success) {
                Alert.alert(
                  'Hủy vé thành công',
                  result.message || 'Vé của bạn đã được hủy thành công.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate to home screen instead of going back
                        router.push('/(tabs)');
                      }
                    }
                  ]
                );
              } else {
                throw new Error(result.message || 'Không thể hủy vé');
              }
            } catch (error: any) {
              Alert.alert(
                'Lỗi hủy vé',
                error.message || 'Có lỗi xảy ra khi hủy vé. Vui lòng thử lại.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateBooking = async () => {
    if (!ticketInfo?.bookingId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin đặt vé để cập nhật.');
      return;
    }

    // Navigate to seat selection screen to update seats
    router.push({
      pathname: '/seat-selection',
      params: {
        screeningId: ticketInfo.screeningId,
        movieTitle: ticketInfo.movie,
        cinemaName: ticketInfo.cinema,
        selectedDate: ticketInfo.date,
        selectedTime: ticketInfo.time,
        ticketPrice: (ticketInfo.baseTotal || ticketInfo.ticketPrice).toString(),
        isUpdating: 'true',
        bookingId: ticketInfo.bookingId,
        currentSeats: JSON.stringify(ticketInfo.seats),
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Back button removed - prevent navigation back */}
        <View style={styles.backButtonPlaceholder} />
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
                  <Text style={styles.ticketValue}>{formatDateDisplay(ticketInfo.date)}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>Giờ chiếu:</Text>
                  <Text style={styles.ticketValue}>{formatTimeDisplay(ticketInfo.time)}</Text>
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
            {/* Show update and cancel buttons only if we have a booking ID (existing booking) */}
            {ticketInfo?.bookingId && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={[styles.updateButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleUpdateBooking}
                  disabled={isLoading}
                >
                  <View style={styles.buttonContent}>
                    <Edit3 size={16} color="#FFFFFF" />
                    <Text style={styles.updateButtonText}>CẬP NHẬT VÉ</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.cancelButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleCancelBooking}
                  disabled={isLoading}
                >
                  <View style={styles.buttonContent}>
                    <X size={16} color="#FF3B30" />
                    <Text style={styles.cancelButtonText}>HỦY VÉ</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]} 
              onPress={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {ticketInfo?.bookingId ? 'XÁC NHẬN THANH TOÁN' : 'ĐẶT VÉ NGAY'}
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
  backButtonPlaceholder: {
    width: 40,
    height: 40,
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
  // Action buttons styles
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  updateButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FF3B30',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Timer styles
  timerContainer: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timerText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  timerTextUrgent: {
    color: '#FF3B30',
  },
  timerSubtext: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});