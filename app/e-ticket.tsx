import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Download, Share2, Calendar, Clock, MapPin, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ETicketScreen() {
  const { booking, bookingId } = useLocalSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (booking) {
      // Sửa lỗi: ép kiểu đúng cho booking là string
      setBookingData(JSON.parse(booking as unknown as string));
      setLoading(false);
    } else if (bookingId) {
      // Nếu không có dữ liệu booking từ params, có thể fetch từ API ở đây nếu muốn
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [booking, bookingId]);

  const handleBackHome = () => {
    router.push('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.text}>Đang tải vé...</Text>
      </View>
    );
  }

  if (!bookingData) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Không tìm thấy thông tin vé.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vé điện tử</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ticketContainer}>
        <View style={styles.ticketBackground}>
          <View style={styles.goldFoil} />
          <View style={styles.ticketContent}>
            <View style={styles.ticketHeader}>
              <Text style={styles.cinemaName}>GALAXY CINEMA</Text>
              <Text style={styles.ticketSubtitle}>Trải nghiệm điện ảnh cao cấp</Text>
            </View>

            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle}>{bookingData?.screeningId?.movieId?.title || 'Phim không xác định'}</Text>
              <View style={styles.movieMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={16} color="#FFD700" />
                  <Text style={styles.metaText}>
                    {bookingData?.screeningId?.startTime ?
                      new Date(bookingData.screeningId.startTime).toLocaleDateString('vi-VN') :
                      'Ngày không xác định'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={16} color="#FFD700" />
                  <Text style={styles.metaText}>
                    {bookingData?.screeningId?.startTime ?
                      new Date(bookingData.screeningId.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) :
                      'Giờ không xác định'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ticketDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rạp:</Text>
                <Text style={styles.detailValue}>
                  {bookingData?.screeningId?.theaterId?.name ||
                   bookingData?.screeningId?.theaterName ||
                   bookingData?.theaterName ||
                   bookingData?.screeningId?.roomId?.theaterName ||
                   'Rạp không xác định'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phòng:</Text>
                <Text style={styles.detailValue}>{bookingData?.screeningId?.roomId?.name || 'Phòng không xác định'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ghế:</Text>
                <Text style={styles.detailValue}>{bookingData?.seatNumbers?.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mã vé:</Text>
                <Text style={styles.detailValue}>{bookingData?._id}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ngày đặt:</Text>
                <Text style={styles.detailValue}>
                  {bookingData?.createdAt
                    ? `${new Date(bookingData.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date(bookingData.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                    : 'N/A'}
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

      <View style={styles.footer}>
        {/* <TouchableOpacity style={styles.homeButton} onPress={handleBackHome}>
          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 8,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    gap: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
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