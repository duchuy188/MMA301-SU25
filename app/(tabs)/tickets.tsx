import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { QrCode, Clock, MapPin, Calendar } from 'lucide-react-native';

const tickets = [
  {
    id: '1',
    movie: 'Avengers: Endgame',
    cinema: 'Galaxy Cinema Nguyễn Du',
    date: '25/12/2024',
    time: '19:30',
    seats: 'F7, F8',
    status: 'Sắp tới',
    image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
  },
  {
    id: '2',
    movie: 'The Batman',
    cinema: 'Galaxy Cinema Landmark',
    date: '20/12/2024',
    time: '21:00',
    seats: 'G5, G6',
    status: 'Đã sử dụng',
    image: 'https://images.pexels.com/photos/7991472/pexels-photo-7991472.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
  },
  {
    id: '3',
    movie: 'Dune: Part Two',
    cinema: 'Galaxy Cinema Vincom',
    date: '15/12/2024',
    time: '16:45',
    seats: 'H3, H4',
    status: 'Đã sử dụng',
    image: 'https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
  },
];

export default function TicketsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vé của tôi</Text>
        <Text style={styles.subtitle}>Quản lý vé đã đặt</Text>
      </View>

      <View style={styles.ticketsList}>
        {tickets.map((ticket) => (
          <TouchableOpacity key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketContent}>
              <View style={styles.ticketLeft}>
                <Image source={{ uri: ticket.image }} style={styles.ticketImage} />
              </View>
              
              <View style={styles.ticketRight}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.movieTitle} numberOfLines={1}>
                    {ticket.movie}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    ticket.status === 'Sắp tới' ? styles.statusUpcoming : styles.statusUsed
                  ]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                </View>

                <View style={styles.ticketDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={14} color="#666" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {ticket.cinema}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#666" />
                    <Text style={styles.detailText}>{ticket.date}</Text>
                    <Clock size={14} color="#666" />
                    <Text style={styles.detailText}>{ticket.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.seatLabel}>Ghế:</Text>
                    <Text style={styles.seatText}>{ticket.seats}</Text>
                  </View>
                </View>

                {ticket.status === 'Sắp tới' && (
                  <TouchableOpacity style={styles.qrButton}>
                    <QrCode size={16} color="#000000" />
                    <Text style={styles.qrButtonText}>Xem mã QR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Không có vé nào khác</Text>
        <Text style={styles.emptySubtitle}>
          Hãy đặt vé xem phim để trải nghiệm những bộ phim tuyệt vời nhất!
        </Text>
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
});