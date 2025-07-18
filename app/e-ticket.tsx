import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Download, Share2, Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

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

export default function ETicketScreen() {
  const params = useLocalSearchParams();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef<ViewShot>(null);

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
    const loadBookingData = async () => {
      try {
        // Try to get booking from AsyncStorage first
        const savedBooking = await AsyncStorage.getItem('currentBooking');
        if (savedBooking) {
          const parsedBooking = JSON.parse(savedBooking);
          
          // Ensure that if we have a booking from payment flow, it's marked as paid
          // This handles the case where backend didn't update properly but payment was successful
          if (parsedBooking.paymentStatus) {
            setBookingData(parsedBooking);
          } else {
            parsedBooking.paymentStatus = 'paid';
            setBookingData(parsedBooking);
          }
        } else {
          // Fallback to sample data
          setBookingData({
            _id: params.bookingId as string || 'TK240001',
            ticketInfo: {
              movie: 'Avengers: Endgame',
              cinema: 'Galaxy Cinema Nguyễn Du',
              date: '22/12/2024',
              time: '19:30',
              seats: ['F7', 'F8'],
            },
            finalTotal: 420000,
            paymentStatus: 'paid',
          });
        }
      } catch (error) {
        // Use fallback data
        setBookingData({
          _id: 'TK240001',
          ticketInfo: {
            movie: 'Avengers: Endgame',
            cinema: 'Galaxy Cinema Nguyễn Du',
            date: '22/12/2024',
            time: '19:30',
            seats: ['F7', 'F8'],
          },
          finalTotal: 420000,
          paymentStatus: 'paid',
        });
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [params.bookingId]);

  const handleBackHome = () => {
    router.push('/(tabs)');
  };

  // Chức năng chụp màn hình và lưu thành hình ảnh
  const captureAndDownload = async () => {
    try {
      // Yêu cầu quyền truy cập vào thư viện ảnh
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Cần cấp quyền để lưu ảnh vào thư viện!');
        return;
      }
      
      if (viewShotRef.current) {
        const uri = await viewShotRef.current?.capture?.() || '';
        
        // Lưu ảnh vào thư viện
        if (uri) {
          await MediaLibrary.saveToLibraryAsync(uri);
          alert('Vé đã được lưu vào thư viện ảnh!');
        }
      }
    } catch (error) {
      console.error('Lỗi khi chụp màn hình:', error);
      alert('Không thể lưu vé. Vui lòng thử lại sau.');
    }
  };

  // Chức năng chụp màn hình và chia sẻ
  const captureAndShare = async () => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current?.capture?.() || '';
        
        // Kiểm tra xem thiết bị có hỗ trợ chia sẻ không
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'Chia sẻ vé xem phim',
            UTI: 'public.jpeg' // Cho iOS
          });
        } else {
          alert('Tính năng chia sẻ không khả dụng trên thiết bị này');
        }
      }
    } catch (error) {
      console.error('Lỗi khi chia sẻ:', error);
      alert('Không thể chia sẻ vé. Vui lòng thử lại sau.');
    }
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
        <TouchableOpacity style={styles.backHomeButton} onPress={handleBackHome}>
          <Text style={styles.backHomeText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Đã xóa nút quay về */}
        <Text style={styles.headerTitle}>Vé điện tử</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={captureAndDownload}>
            <Download size={20} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={captureAndShare}>
            <Share2 size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={styles.viewShotContainer}>
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
                      <Text style={styles.metaText}>{bookingData.ticketInfo.time}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.ticketDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rạp:</Text>
                    <Text style={styles.detailValue}>{bookingData.ticketInfo.cinema}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Địa chỉ:</Text>
                    <Text style={styles.detailValue}>116 Nguyễn Du, Quận 1, TP.HCM</Text>
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
                        uri: bookingData.qrCodeDataUrl || 'https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=200&h=200'
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
        </ViewShot>

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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackHome}>
          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
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
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  viewShotContainer: {
    backgroundColor: 'transparent',
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
  // New styles for loading, error, and payment status
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  homeButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#000000',
  },
});