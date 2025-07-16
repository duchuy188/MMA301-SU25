import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Crown, Star, Ticket, Gift, Settings, Bell, Shield, LogOut, MapPin, Calendar, Clock, QrCode } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useState, useEffect, useCallback } from 'react';
import { logout, getProfile } from '../../services/auth';
import { getUserBookings } from '../../services/booking';
import { getAllPromotions } from '../../services/promotion';

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState({
    name: 'Đang tải...',
    email: '',
    phone: '',
    avatar: null,
    role: 'member',
    status: true
  });
  const [loading, setLoading] = useState(true);
  const [totalTickets, setTotalTickets] = useState(0);
  const [recentUserTickets, setRecentUserTickets] = useState([]);
  const [promotionCount, setPromotionCount] = useState(0);

  // Lấy thông tin profile khi màn hình được tải
  useEffect(() => {
    loadUserProfile();
    fetchUserTickets();
    fetchPromotionCount();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setUserProfile(data.user || data); // Tùy vào cấu trúc API response
      setLoading(false);
    } catch (error) {
      console.log('Lỗi khi tải thông tin người dùng:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể tải thông tin',
        text2: 'Vui lòng thử lại sau',
        visibilityTime: 3000,
      });
      setLoading(false);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const result = await getUserBookings();
      const bookings = result.bookings || [];
      const ticketCount = bookings.reduce((sum, booking) => sum + (booking.seatNumbers?.length || 0), 0);
      setTotalTickets(ticketCount);
      // Get 2-3 most recent bookings
      const sorted = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentUserTickets(sorted.slice(0, 3));
    } catch (error) {
      setTotalTickets(0);
      setRecentUserTickets([]);
    }
  };

  const fetchPromotionCount = async () => {
    try {
      const res = await getAllPromotions('approved');
      if (res.data) {
        setPromotionCount(res.data.length);
      } else if (typeof res.count === 'number') {
        setPromotionCount(res.count);
      } else {
        setPromotionCount(0);
      }
    } catch {
      setPromotionCount(0);
    }
  };

  // Sử dụng useFocusEffect để tải lại dữ liệu mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
      fetchUserTickets();
      fetchPromotionCount();
    }, [])
  );

  // Xử lý đăng xuất với xác nhận
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất?",
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        { 
          text: "Đăng xuất", 
          onPress: () => {
            try {
              logout();
            } catch (error) {
              console.log('Lỗi khi đăng xuất:', error);
            }
            
            router.replace('/auth');
            
            setTimeout(() => {
              Toast.show({
                type: 'success',
                text1: 'Đăng xuất thành công',
                visibilityTime: 2000,
              });
            }, 100);
          },
          style: "destructive"
        }
      ]
    );
  };

  // Tính cấp thành viên theo điểm thưởng
  const rewardPoints = totalTickets * 100;
  let memberLevel = 'Thành viên';
  let memberColor = '#FFD700'; // vàng mặc định
  if (rewardPoints >= 5000) {
    memberLevel = 'Thành viên Kim Cương';
    memberColor = '#A259F7'; // tím
  } else if (rewardPoints >= 3000) {
    memberLevel = 'Thành viên Vàng';
    memberColor = '#FFD700'; // vàng
  } else if (rewardPoints >= 1000) {
    memberLevel = 'Thành viên Bạc';
    memberColor = '#B0B0B0'; // xám
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={() => router.push('/edit-profile')}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}> 
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.goldRing} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{userProfile.name}</Text>
        <View style={[styles.membershipBadge, { backgroundColor: memberColor }]}> 
          <Crown size={16} color="#000000" />
          <Text style={styles.membershipText}>{memberLevel}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalTickets}</Text>
          <Text style={styles.statLabel}>Vé đã đặt</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalTickets * 100}</Text>
          <Text style={styles.statLabel}>Điểm thưởng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{promotionCount}</Text>
          <Text style={styles.statLabel}>Ưu đãi</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vé gần đây</Text>
        <View style={styles.ticketsList}>
          {recentUserTickets.length === 0 ? (
            <Text style={{ color: '#999', textAlign: 'center' }}>Chưa có vé nào</Text>
          ) : (
            recentUserTickets
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 3)
              .map((ticket, idx) => (
                <View key={ticket._id || idx} style={styles.ticketCard}>
                  <View style={styles.ticketContent}>
                    <View style={styles.ticketRight}>
                      <View style={styles.ticketHeader}>
                        <Text style={styles.movieTitle} numberOfLines={1}>{ticket.movieTitle || 'Không rõ phim'}</Text>
                      </View>
                      <View style={styles.ticketDetails}>
                        <View style={styles.detailRow}>
                          <MapPin size={14} color="#666" />
                          <Text style={styles.seatText} numberOfLines={1}>{ticket.screeningId?.roomId?.theaterName || ticket.screeningId?.theaterId?.name || ticket.screeningId?.roomId?.name || 'Rạp ?'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Calendar size={14} color="#666" />
                          <Text style={styles.seatText}>{ticket.screeningTime ? new Date(ticket.screeningTime).toLocaleDateString('vi-VN') : ''}</Text>
                          <Clock size={14} color="#666" />
                          <Text style={styles.seatText}>{ticket.screeningTime ? new Date(ticket.screeningTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.seatLabel}>Ghế:</Text>
                          <Text style={styles.seatText}>{ticket.seatNumbers?.join(', ') || '?'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.seatLabel}>Phòng:</Text>
                          <Text style={styles.seatText}>{ticket.roomName || ticket.screeningId?.roomId?.name || '?'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.seatLabel}>Mã vé:</Text>
                          <Text style={styles.seatText}>{ticket.code || ticket._id}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.seatLabel}>Ngày đặt:</Text>
                          <Text style={styles.seatText}>{ticket.bookingDate ? new Date(ticket.bookingDate).toLocaleString('vi-VN') : ''}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => router.push({
                          pathname: '/historyticket',
                          params: { booking: JSON.stringify(ticket) }
                        })}
                      >
                        <QrCode size={16} color="#000" />
                        <Text style={styles.qrButtonText}>Xem mã QR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Điểm thưởng</Text>
        <View style={styles.rewardsCard}>
          <View style={styles.rewardsIcon}>
            <Star size={24} color="#FFD700" />
          </View>
          <View style={styles.rewardsContent}>
            <Text style={styles.rewardsPoints}>{totalTickets * 100} điểm</Text>
            <Text style={styles.rewardsDescription}>
              Vui lòng đến rạp để đổi điểm lấy vé xem phim và combo bắp nước
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Bell size={20} color="#FFD700" />
          <Text style={styles.menuText}>Thông báo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={20} color="#FFD700" />
          <Text style={styles.menuText}>Cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Shield size={20} color="#FFD700" />
          <Text style={styles.menuText}>Chính sách bảo mật</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut size={20} color="#FF4444" />
          <Text style={[styles.menuText, { color: '#FF4444' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  goldRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  membershipText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#000000',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 15,
  },
  ticketsList: {
    gap: 12,
  },
  ticketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketMovie: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ticketDate: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  ticketStatus: {
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
  ticketStatusText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#000000',
  },
  rewardsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  rewardsIcon: {
    marginRight: 16,
  },
  rewardsContent: {
    flex: 1,
  },
  rewardsPoints: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 4,
  },
  rewardsDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  rewardsButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rewardsButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#000000',
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  avatarEditIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  // Thêm style cho box vé gần đây
  ticketCard: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  ticketContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketRight: {
    flex: 1,
  },
  ticketHeader: {
    marginBottom: 8,
  },
  movieTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#fff',
  },
  ticketDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  seatLabel: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  seatText: {
    color: '#fff',
    fontSize: 14,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  qrButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000',
  },
});