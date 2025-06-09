import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { QrCode, Clock, MapPin, User, X, Eye } from 'lucide-react-native';

const userTickets = [
  {
    id: 'VE001',
    company: 'Xe Thành Bưởi',
    from: 'Hà Nội',
    to: 'Hồ Chí Minh',
    date: '25/12/2024',
    departureTime: '20:00',
    arrivalTime: '14:00+1',
    seat: 'A12',
    price: '450.000đ',
    status: 'confirmed',
    passengerName: 'Nguyễn Văn A',
    phone: '0987654321',
    bookingDate: '20/12/2024',
  },
  {
    id: 'VE002',
    company: 'Xe Phương Trang',
    from: 'Hồ Chí Minh',
    to: 'Đà Lạt',
    date: '30/12/2024',
    departureTime: '08:00',
    arrivalTime: '15:00',
    seat: 'B05',
    price: '180.000đ',
    status: 'confirmed',
    passengerName: 'Nguyễn Văn A',
    phone: '0987654321',
    bookingDate: '22/12/2024',
  },
  {
    id: 'VE003',
    company: 'Xe Hoàng Long',
    from: 'Đà Nẵng',
    to: 'Hà Nội',
    date: '15/12/2024',
    departureTime: '19:00',
    arrivalTime: '07:00+1',
    seat: 'C08',
    price: '320.000đ',
    status: 'used',
    passengerName: 'Nguyễn Văn A',
    phone: '0987654321',
    bookingDate: '10/12/2024',
  },
];

export default function TicketsScreen() {
  const [tickets, setTickets] = useState(userTickets);

  const handleCancelTicket = (ticketId: string) => {
    Alert.alert(
      'Hủy vé',
      'Bạn có chắc chắn muốn hủy vé này không?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy vé',
          style: 'destructive',
          onPress: () => {
            setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
            Alert.alert('Thành công', 'Vé đã được hủy thành công');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'used':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'used':
        return 'Đã sử dụng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return 'Không xác định';
    }
  };

  const canCancel = (ticket: any) => {
    const today = new Date();
    const tripDate = new Date();
    // Simple date parsing - in real app, use proper date parsing
    const [day, month, year] = ticket.date.split('/');
    tripDate.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return ticket.status === 'confirmed' && tripDate > today;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vé của tôi</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
            <Text style={styles.emptySubtitle}>
              Vé đã đặt sẽ hiển thị tại đây
            </Text>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.bookNowButtonText}>Đặt vé ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              {/* Ticket Header */}
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketId}>#{ticket.id}</Text>
                  <Text style={styles.company}>{ticket.company}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                    {getStatusText(ticket.status)}
                  </Text>
                </View>
              </View>

              {/* Route Info */}
              <View style={styles.routeInfo}>
                <View style={styles.routePoint}>
                  <Text style={styles.time}>{ticket.departureTime}</Text>
                  <Text style={styles.location}>{ticket.from}</Text>
                </View>
                
                <View style={styles.routeMiddle}>
                  <View style={styles.routeLine}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <View style={styles.dot} />
                  </View>
                  <Text style={styles.date}>{ticket.date}</Text>
                </View>

                <View style={styles.routePoint}>
                  <Text style={styles.time}>{ticket.arrivalTime}</Text>
                  <Text style={styles.location}>{ticket.to}</Text>
                </View>
              </View>

              {/* Ticket Details */}
              <View style={styles.ticketDetails}>
                <View style={styles.detailRow}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{ticket.passengerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>Ghế: {ticket.seat}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.priceLabel}>Giá vé:</Text>
                  <Text style={styles.price}>{ticket.price}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.ticketActions}>
                <TouchableOpacity style={styles.qrButton}>
                  <QrCode size={16} color="#2563EB" />
                  <Text style={styles.qrButtonText}>Mã QR</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.viewButton}>
                  <Eye size={16} color="#6B7280" />
                  <Text style={styles.viewButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>

                {canCancel(ticket) && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelTicket(ticket.id)}
                  >
                    <X size={16} color="#EF4444" />
                    <Text style={styles.cancelButtonText}>Hủy vé</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  company: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeMiddle: {
    flex: 2,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginLeft: 'auto',
  },
  ticketActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
  },
  qrButtonText: {
    fontSize: 12,
    color: '#2563EB',
    marginLeft: 4,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
    fontWeight: '600',
  },
});