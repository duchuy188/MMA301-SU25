import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { QrCode, Clock, MapPin, Calendar } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getUserBookings } from '../../services/booking';

export default function TicketsScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const userBookings = await getUserBookings();
      setBookings(userBookings);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBookings();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusText = (paymentStatus: string, screeningTime: string) => {
    if (paymentStatus === 'cancelled') return 'Đã hủy';
    if (paymentStatus === 'pending') return 'Chờ thanh toán';
    
    const now = new Date();
    const screening = new Date(screeningTime);
    
    if (screening > now) return 'Sắp tới';
    return 'Đã sử dụng';
  };

  const getStatusStyle = (paymentStatus: string, screeningTime: string) => {
    const status = getStatusText(paymentStatus, screeningTime);
    if (status === 'Đã hủy') return styles.cancelledStatus;
    if (status === 'Chờ thanh toán') return styles.pendingStatus;
    if (status === 'Sắp tới') return styles.upcomingStatus;
    return styles.usedStatus;
  };

  const handleTicketPress = (booking: any) => {
    // Kiểm tra trạng thái payment trước khi navigate
    if (booking.paymentStatus === 'pending') {
      // Nếu vẫn pending, có thể booking chưa được thanh toán hoặc có lỗi
      // Navigate đến payment để hoàn tất thanh toán
      router.push({
        pathname: '/payment',
        params: {
          bookingId: booking._id,
          movie: booking?.screeningId?.movieId?.title || 'Phim không xác định',
          cinema: booking?.screeningId?.theaterId?.name || 'Rạp không xác định',
          date: booking?.screeningId?.startTime ? booking.screeningId.startTime.slice(0, 10) : '',
          time: booking?.screeningId?.startTime ? booking.screeningId.startTime.slice(11, 16) : '',
          seats: booking.seatNumbers.join(','),
          screeningId: booking?.screeningId?._id || booking.screeningId,
          ticketPrice: booking.totalPrice?.toString() || '90000',
        }
      });
    } else if (booking.paymentStatus === 'paid') {
      // Nếu đã thanh toán, navigate đến e-ticket
      router.push(`/e-ticket?bookingId=${booking._id}`);
    } else {
      // Cancelled hoặc trạng thái khác
      console.log('Cannot view ticket for status:', booking.paymentStatus);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải vé của bạn...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFD700"
          colors={['#FFD700']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Vé của tôi</Text>
        <Text style={styles.subtitle}>Quản lý vé đã đặt</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <QrCode size={64} color="#666" />
          <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
          <Text style={styles.emptyText}>
            Hãy đặt vé xem phim để trải nghiệm những bộ phim tuyệt vời nhất!
          </Text>
        </View>
      ) : (
        <View style={styles.ticketsList}>
          {bookings.map((booking) => {
            const movieTitle = booking?.screeningId?.movieId?.title || 
                              booking?.screeningId?.movieId?.vietnameseTitle || 
                              'Phim không xác định';
            const theaterName = booking?.screeningId?.theaterId?.name || 'Rạp không xác định';
            const startTime = booking?.screeningId?.startTime || new Date().toISOString();
            const room = booking?.screeningId?.room || 'Phòng 1';
            const posterUrl = booking?.screeningId?.movieId?.posterUrl || 
                             'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=400';

            return (
              <TouchableOpacity 
                key={booking._id} 
                style={styles.ticketCard}
                onPress={() => handleTicketPress(booking)}
              >
                <View style={styles.ticketContent}>
                  <View style={styles.ticketLeft}>
                    <Image source={{ uri: posterUrl }} style={styles.ticketImage} />
                  </View>
                  
                  <View style={styles.ticketRight}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.movieTitle} numberOfLines={1}>
                        {movieTitle}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        getStatusStyle(booking.paymentStatus, startTime)
                      ]}>
                        <Text style={styles.statusText}>
                          {getStatusText(booking.paymentStatus, startTime)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ticketDetails}>
                      <View style={styles.detailRow}>
                        <MapPin size={14} color="#666" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {theaterName}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Calendar size={14} color="#666" />
                        <Text style={styles.detailText}>{formatDate(startTime)}</Text>
                        <Clock size={14} color="#666" />
                        <Text style={styles.detailText}>{formatTime(startTime)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.seatLabel}>Ghế:</Text>
                        <Text style={styles.seatText}>{booking.seatNumbers.join(', ')}</Text>
                      </View>
                    </View>

                    {booking.paymentStatus === 'pending' && (
                      <TouchableOpacity 
                        style={styles.payButton}
                        onPress={() => handleTicketPress(booking)}
                      >
                        <Text style={styles.payButtonText}>Hoàn tất thanh toán</Text>
                      </TouchableOpacity>
                    )}

                    {booking.paymentStatus === 'paid' && (
                      <TouchableOpacity 
                        style={styles.qrButton}
                        onPress={() => handleTicketPress(booking)}
                      >
                        <QrCode size={16} color="#000000" />
                        <Text style={styles.qrButtonText}>Xem mã QR</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#F7E7CE',
    opacity: 0.9,
    marginTop: 4,
  },
  ticketsList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  ticketCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  ticketContent: {
    flexDirection: 'row',
    padding: 15,
  },
  ticketLeft: {
    marginRight: 15,
  },
  ticketImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  ticketRight: {
    flex: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  movieTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusUpcoming: {
    backgroundColor: '#FFD700',
  },
  statusUsed: {
    backgroundColor: '#333',
  },
  statusText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#000000',
  },
  ticketDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  seatLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  seatText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  qrButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#000000',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  payButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // New styles for API integration
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  cancelledStatus: {
    backgroundColor: '#FF6B6B',
  },
  pendingStatus: {
    backgroundColor: '#FFA500',
  },
  upcomingStatus: {
    backgroundColor: '#4CAF50',
  },
  usedStatus: {
    backgroundColor: '#666',
  },
});