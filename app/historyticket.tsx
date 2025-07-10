import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, Share2, Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BookingData {
  _id: string;
  ticketInfo: {
    movie: string;
    cinema: string;
    date: string;
    time: string;
    seats: string[];
  };
  finalTotal: number;
  paymentStatus: string;
  qrCodeDataUrl?: string;
}

export default function HistoryTicketScreen() {
  const params = useLocalSearchParams();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to format date display to dd-mm-yyyy
  const formatDateDisplay = (date: string) => {
    if (!date) return '';
    if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return date;
    }
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = date.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
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
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch (error) {}
    return date;
  };

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        if (params.booking) {
          const parsedBooking = JSON.parse(params.booking as string);
          setBookingData({
            _id: parsedBooking._id,
            ticketInfo: {
              movie: parsedBooking?.screeningId?.movieId?.title || 'Phim không xác định',
              cinema: parsedBooking?.screeningId?.theaterId?.name || 'Rạp không xác định',
              date: parsedBooking?.screeningId?.startTime || '',
              time: parsedBooking?.screeningId?.startTime || '',
              seats: parsedBooking.seatNumbers || [],
            },
            finalTotal: parsedBooking.totalPrice || 0,
            paymentStatus: parsedBooking.paymentStatus || 'paid',
            qrCodeDataUrl: parsedBooking.qrCodeDataUrl,
          });
        } else {
          setBookingData(null);
        }
      } catch (error) {
        setBookingData(null);
      } finally {
        setLoading(false);
      }
    };
    loadBookingData();
  }, [params.booking]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải vé...</Text>
      </View>
    );
  }

  if (!bookingData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Không tìm thấy thông tin vé</Text>
        <TouchableOpacity style={styles.backHomeButton} onPress={handleBack}>
          <Text style={styles.backHomeText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết vé</Text>
        <View style={styles.headerActions} />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.ticketContainer}>
          <View style={styles.ticketBackground}>
            <View style={styles.goldFoil} />
            <View style={styles.ticketContent}>
              <View style={styles.ticketHeader}>
                <Text style={styles.cinemaName}>GALAXY CINEMA</Text>
                <Text style={styles.ticketSubtitle}>Trải nghiệm điện ảnh cao cấp</Text>
              </View>
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{bookingData.ticketInfo.movie}</Text>
                <View style={styles.movieMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#FFD700" />
                    <Text style={styles.metaText}>{formatDateDisplay(bookingData.ticketInfo.date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={16} color="#FFD700" />
                    <Text style={styles.metaText}>{
                      bookingData.ticketInfo.time
                        ? (() => {
                            // Nếu là chuỗi ISO hoặc có ký tự 'T', lấy giờ phút đúng chuẩn
                            const dateObj = new Date(bookingData.ticketInfo.time);
                            if (!isNaN(dateObj.getTime())) {
                              const hours = dateObj.getHours().toString().padStart(2, '0');
                              const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                              return `${hours}:${minutes}`;
                            }
                            // Nếu là chuỗi giờ phút, trả về luôn
                            if (/^\d{2}:\d{2}$/.test(bookingData.ticketInfo.time)) {
                              return bookingData.ticketInfo.time;
                            }
                            return bookingData.ticketInfo.time;
                          })()
                        : ''
                    }</Text>
                  </View>
                </View>
              </View>
              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rạp:</Text>
                  <Text style={styles.detailValue}>{bookingData.ticketInfo.cinema}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ghế:</Text>
                  <Text style={styles.detailValue}>{bookingData.ticketInfo.seats.join(', ')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã vé:</Text>
                  <Text style={styles.detailValue}>{bookingData._id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[
                    styles.detailValue, 
                    bookingData.paymentStatus === 'paid' ? styles.paidStatus : styles.pendingStatus
                  ]}>
                    {bookingData.paymentStatus === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tổng tiền:</Text>
                  <Text style={styles.detailValue}>
                    {bookingData.finalTotal.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
              </View>
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <Image 
                    source={{ 
                      uri: bookingData.qrCodeDataUrl && bookingData.qrCodeDataUrl !== ''
                        ? bookingData.qrCodeDataUrl
                        : 'https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=200&h=200'
                    }} 
                    style={styles.qrCode} 
                  />
                  <View style={styles.qrBorder} />
                </View>
                <Text style={styles.qrText}>
                  Vui lòng xuất trình mã QR này tại quầy vé
                </Text>
              </View>
              <View style={[
                styles.validBadge,
                bookingData.paymentStatus === 'paid' ? styles.validBadgePaid : styles.validBadgePending
              ]}>
                <Star size={16} color={bookingData.paymentStatus === 'paid' ? "#FFD700" : "#FF6B6B"} />
                <Text style={[
                  styles.validText,
                  bookingData.paymentStatus === 'paid' ? styles.validTextPaid : styles.validTextPending
                ]}>
                  {bookingData.paymentStatus === 'paid' ? 'VÉ HỢP LỆ' : 'CHƯA THANH TOÁN'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Hướng dẫn sử dụng</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              • Xuất trình mã QR tại quầy vé trước giờ chiếu 15 phút
            </Text>
            <Text style={styles.instructionItem}>
              • Vé không thể đổi trả sau khi đã thanh toán
            </Text>
            <Text style={styles.instructionItem}>
              • Vui lòng đến đúng giờ để tránh bỏ lỡ phần đầu phim
            </Text>
            <Text style={styles.instructionItem}>
              • Liên hệ hotline 1900-6017 nếu cần hỗ trợ
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    minWidth: 40,
  },
  content: {
    flex: 1,
  },
  ticketContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  ticketBackground: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  goldFoil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FFD700',
  },
  ticketContent: {
    padding: 24,
  },
  ticketHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cinemaName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  ticketSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#F7E7CE',
    marginTop: 4,
  },
  movieInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  movieTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  movieMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
  },
  ticketDetails: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  qrCode: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  qrBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
  },
  qrText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignSelf: 'center',
    gap: 6,
  },
  validText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#FFD700',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FFD700',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  backHomeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  backHomeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#000000',
  },
  paidStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  pendingStatus: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  validBadgePaid: {
    backgroundColor: '#000000',
    borderColor: '#4CAF50',
  },
  validBadgePending: {
    backgroundColor: '#000000',
    borderColor: '#FF9800',
  },
  validTextPaid: {
    color: '#4CAF50',
  },
  validTextPending: {
    color: '#FF9800',
  },
  instructions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 12,
  },
  instructionsList: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  instructionItem: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 8,
  },
});
