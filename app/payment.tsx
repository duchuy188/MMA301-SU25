import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone, Wallet, Check } from 'lucide-react-native';

const paymentMethods = [
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: Smartphone,
    color: '#D91D8B',
  },
  {
    id: 'bank',
    name: 'Thẻ ngân hàng',
    icon: CreditCard,
    color: '#2563EB',
  },
  {
    id: 'wallet',
    name: 'Ví điện tử',
    icon: Wallet,
    color: '#F97316',
  },
];

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const routeInfo = {
    company: params.company as string,
    from: params.from as string,
    to: params.to as string,
    departureTime: params.departureTime as string,
    selectedSeats: (params.selectedSeats as string)?.split(',') || [],
    totalAmount: params.totalAmount as string,
  };

  const handlePayment = () => {
    if (!selectedPayment) {
      Alert.alert('Thông báo', 'Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    // Simulate payment processing
    Alert.alert(
      'Xác nhận thanh toán',
      `Thanh toán ${parseInt(routeInfo.totalAmount).toLocaleString()}đ bằng ${paymentMethods.find(p => p.id === selectedPayment)?.name}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Thanh toán',
          onPress: () => processPayment(),
        },
      ]
    );
  };

  const processPayment = () => {
    // Simulate payment processing delay
    setTimeout(() => {
      Alert.alert(
        'Thanh toán thành công!',
        'Vé của bạn đã được đặt thành công. Vui lòng kiểm tra trong mục "Vé của tôi".',
        [
          {
            text: 'Xem vé',
            onPress: () => router.push('/(tabs)/tickets'),
          },
        ]
      );
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Thông tin đặt vé</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tuyến:</Text>
            <Text style={styles.summaryValue}>
              {routeInfo.from} → {routeInfo.to}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hãng xe:</Text>
            <Text style={styles.summaryValue}>{routeInfo.company}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giờ khởi hành:</Text>
            <Text style={styles.summaryValue}>{routeInfo.departureTime}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ghế:</Text>
            <Text style={styles.summaryValue}>
              {routeInfo.selectedSeats.join(', ')}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalValue}>
              {parseInt(routeInfo.totalAmount).toLocaleString()}đ
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ và tên"
              value={customerInfo.name}
              onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, name: text }))}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              value={customerInfo.phone}
              onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              value={customerInfo.email}
              onChangeText={(text) => setCustomerInfo(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          {paymentMethods.map((method) => {
            const IconComponent = method.icon;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => setSelectedPayment(method.id)}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.paymentIcon, { backgroundColor: method.color + '20' }]}>
                    <IconComponent size={20} color={method.color} />
                  </View>
                  <Text style={styles.paymentName}>{method.name}</Text>
                </View>
                
                {selectedPayment === method.id && (
                  <View style={styles.selectedIcon}>
                    <Check size={16} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.termsText}>
            Bằng cách tiếp tục, bạn đồng ý với{' '}
            <Text style={styles.termsLink}>Điều khoản sử dụng</Text>
            {' '}và{' '}
            <Text style={styles.termsLink}>Chính sách bảo mật</Text>
            {' '}của chúng tôi.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Tổng thanh toán:</Text>
          <Text style={styles.totalPrice}>
            {parseInt(routeInfo.totalAmount).toLocaleString()}đ
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
        >
          <Text style={styles.payButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  paymentMethod: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  bottomAction: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
  },
  payButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});