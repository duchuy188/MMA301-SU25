import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Clock, Users, Star } from 'lucide-react-native';

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const [selectedTrip, setSelectedTrip] = useState(null);

  const routeInfo = {
    company: params.company as string,
    from: params.from as string,
    to: params.to as string,
    departureTime: params.departureTime as string,
    arrivalTime: params.arrivalTime as string,
    price: params.price as string,
    duration: params.duration as string,
    busType: params.busType as string,
    availableSeats: parseInt(params.availableSeats as string),
  };

  const trips = [
    {
      id: 1,
      time: routeInfo.departureTime,
      endTime: routeInfo.arrivalTime,
      price: routeInfo.price,
      availableSeats: routeInfo.availableSeats,
      busType: routeInfo.busType,
    },
  ];

  const handleSelectTrip = (trip: any) => {
    setSelectedTrip(trip);
  };

  const handleContinue = () => {
    if (!selectedTrip) {
      Alert.alert('Thông báo', 'Vui lòng chọn chuyến xe');
      return;
    }

    router.push({
      pathname: '/seat-selection',
      params: {
        ...params,
        tripId: selectedTrip.id,
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn chuyến xe</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTitle}>
              {routeInfo.from} → {routeInfo.to}
            </Text>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{routeInfo.company}</Text>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.rating}>4.8</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.routeDetail}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.routeDetailText}>{routeInfo.duration}</Text>
            </View>
            <View style={styles.routeDetail}>
              <Users size={16} color="#10B981" />
              <Text style={styles.routeDetailText}>
                {routeInfo.availableSeats} chỗ trống
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn giờ khởi hành</Text>
          
          {trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={[
                styles.tripCard,
                selectedTrip?.id === trip.id && styles.tripCardSelected
              ]}
              onPress={() => handleSelectTrip(trip)}
            >
              <View style={styles.tripLeft}>
                <View style={styles.timeContainer}>
                  <Text style={styles.tripTime}>{trip.time}</Text>
                  <Text style={styles.tripEndTime}>{trip.endTime}</Text>
                </View>
                
                <View style={styles.tripInfo}>
                  <Text style={styles.busType}>{trip.busType}</Text>
                  <View style={styles.seatInfo}>
                    <Users size={14} color="#10B981" />
                    <Text style={styles.availableSeats}>
                      {trip.availableSeats} chỗ trống
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.tripRight}>
                <Text style={styles.tripPrice}>{trip.price}</Text>
                <View style={[
                  styles.selectButton,
                  selectedTrip?.id === trip.id && styles.selectButtonSelected
                ]}>
                  <Text style={[
                    styles.selectButtonText,
                    selectedTrip?.id === trip.id && styles.selectButtonTextSelected
                  ]}>
                    {selectedTrip?.id === trip.id ? 'Đã chọn' : 'Chọn'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến xe</Text>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Điểm đón:</Text>
              <Text style={styles.detailValue}>Bến xe {routeInfo.from}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Điểm trả:</Text>
              <Text style={styles.detailValue}>Bến xe {routeInfo.to}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.detailLabel}>Thời gian:</Text>
              <Text style={styles.detailValue}>{routeInfo.duration}</Text>
            </View>
          </View>
        </View>

        {/* Policies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chính sách</Text>
          
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Chính sách hủy vé:</Text>
            <Text style={styles.policyText}>
              • Hủy vé trước 24h: Hoàn lại 90% giá vé{'\n'}
              • Hủy vé trước 6h: Hoàn lại 70% giá vé{'\n'}
              • Hủy vé trong 6h: Không hoàn tiền
            </Text>
            
            <Text style={styles.policyTitle}>Chính sách đổi vé:</Text>
            <Text style={styles.policyText}>
              • Có thể đổi vé 1 lần miễn phí trước 12h{'\n'}
              • Chịu phí đổi vé 50.000đ sau 12h
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Tổng tiền:</Text>
          <Text style={styles.totalPrice}>
            {selectedTrip ? selectedTrip.price : routeInfo.price}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedTrip && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedTrip}
        >
          <Text style={styles.continueButtonText}>Chọn chỗ ngồi</Text>
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
  routeSummary: {
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
  routeHeader: {
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tripCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EBF4FF',
  },
  tripLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeContainer: {
    marginRight: 16,
  },
  tripTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  tripEndTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  tripInfo: {
    flex: 1,
  },
  busType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableSeats: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  tripRight: {
    alignItems: 'flex-end',
  },
  tripPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 8,
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  selectButtonSelected: {
    backgroundColor: '#2563EB',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  selectButtonTextSelected: {
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  policyText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
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
  continueButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});