import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Shield, CreditCard, Smartphone, QrCode } from 'lucide-react-native';
import { useState } from 'react';

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

  const ticketInfo = {
    movie: 'Avengers: Endgame',
    cinema: 'Galaxy Cinema Nguyễn Du',
    date: '22/12/2024',
    time: '19:30',
    seats: ['F7', 'F8'],
    ticketPrice: 400000,
    serviceFee: 20000,
    total: 420000,
  };

  const handlePayment = () => {
    router.push('/e-ticket');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
      </View>

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
              <Text style={styles.ticketValue}>{ticketInfo.date}</Text>
            </View>
            <View style={styles.ticketRow}>
              <Text style={styles.ticketLabel}>Giờ:</Text>
              <Text style={styles.ticketValue}>{ticketInfo.time}</Text>
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
                {ticketInfo.ticketPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Phí dịch vụ:</Text>
              <Text style={styles.priceValue}>
                {ticketInfo.serviceFee.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng tiền:</Text>
              <Text style={styles.totalValue}>
                {ticketInfo.total.toLocaleString('vi-VN')} VNĐ
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
        <TouchableOpacity style={styles.confirmButton} onPress={handlePayment}>
          <Text style={styles.confirmButtonText}>
            XÁC NHẬN THANH TOÁN
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
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
});