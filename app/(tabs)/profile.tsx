import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Crown, Star, Ticket, Gift, Settings, Bell, Shield, LogOut } from 'lucide-react-native';

const recentTickets = [
  {
    id: '1',
    movie: 'Avengers: Endgame',
    date: '25/12/2024',
    status: 'Sắp tới',
  },
  {
    id: '2',
    movie: 'The Batman',
    date: '20/12/2024',
    status: 'Đã sử dụng',
  },
];

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150' }}
            style={styles.avatar}
          />
          <View style={styles.goldRing} />
        </View>
        <Text style={styles.userName}>Nguyễn Văn A</Text>
        <View style={styles.membershipBadge}>
          <Crown size={16} color="#000000" />
          <Text style={styles.membershipText}>Thành viên Vàng</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Vé đã đặt</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2,450</Text>
          <Text style={styles.statLabel}>Điểm thưởng</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Ưu đãi</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vé gần đây</Text>
        <View style={styles.ticketsList}>
          {recentTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketItem}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketMovie}>{ticket.movie}</Text>
                <Text style={styles.ticketDate}>{ticket.date}</Text>
              </View>
              <View style={[
                styles.ticketStatus,
                ticket.status === 'Sắp tới' ? styles.statusUpcoming : styles.statusUsed
              ]}>
                <Text style={styles.ticketStatusText}>{ticket.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Điểm thưởng</Text>
        <View style={styles.rewardsCard}>
          <View style={styles.rewardsIcon}>
            <Star size={24} color="#FFD700" />
          </View>
          <View style={styles.rewardsContent}>
            <Text style={styles.rewardsPoints}>2,450 điểm</Text>
            <Text style={styles.rewardsDescription}>
              Đổi điểm lấy vé xem phim và combo bắp nước
            </Text>
          </View>
          <TouchableOpacity style={styles.rewardsButton}>
            <Text style={styles.rewardsButtonText}>Đổi điểm</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nâng cấp thành viên</Text>
        <TouchableOpacity style={styles.upgradeCard}>
          <View style={styles.upgradeIcon}>
            <Crown size={24} color="#FFD700" />
          </View>
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>NÂNG CẤP HẠNG VIP</Text>
            <Text style={styles.upgradeDescription}>
              Trở thành thành viên Bạch Kim để nhận nhiều ưu đãi độc quyền
            </Text>
          </View>
        </TouchableOpacity>
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
        <TouchableOpacity style={styles.menuItem}>
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
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeIcon: {
    marginRight: 16,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 6,
  },
  upgradeDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
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
});