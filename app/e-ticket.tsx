import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Download, Share2, Calendar, Clock, MapPin, Star } from 'lucide-react-native';

export default function ETicketScreen() {
  const ticket = {
    id: 'TK240001',
    movie: 'Avengers: Endgame',
    cinema: 'Galaxy Cinema Nguyễn Du',
    address: '116 Nguyễn Du, Quận 1, TP.HCM',
    date: '22/12/2024',
    time: '19:30',
    seats: ['F7', 'F8'],
    total: 420000,
    qrCode: 'https://images.pexels.com/photos/8369648/pexels-photo-8369648.jpeg?auto=compress&cs=tinysrgb&w=200&h=200',
  };

  const handleBackHome = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vé điện tử</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Download size={20} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
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
                <Text style={styles.movieTitle}>{ticket.movie}</Text>
                <View style={styles.movieMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#FFD700" />
                    <Text style={styles.metaText}>{ticket.date}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Clock size={16} color="#FFD700" />
                    <Text style={styles.metaText}>{ticket.time}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rạp:</Text>
                  <Text style={styles.detailValue}>{ticket.cinema}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Địa chỉ:</Text>
                  <Text style={styles.detailValue}>{ticket.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ghế:</Text>
                  <Text style={styles.detailValue}>{ticket.seats.join(', ')}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã vé:</Text>
                  <Text style={styles.detailValue}>{ticket.id}</Text>
                </View>
              </View>

              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <Image source={{ uri: ticket.qrCode }} style={styles.qrCode} />
                  <View style={styles.qrBorder} />
                </View>
                <Text style={styles.qrText}>
                  Vui lòng xuất trình mã QR này tại quầy vé
                </Text>
              </View>

              <View style={styles.validBadge}>
                <Star size={16} color="#FFD700" />
                <Text style={styles.validText}>VÉ HỢP LỆ</Text>
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