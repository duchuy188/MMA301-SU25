import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, MapPin, Clock, Users, ArrowRight } from 'lucide-react-native';

const busRoutes = [
  {
    id: 1,
    company: 'Xe Thành Bưởi',
    from: 'Hà Nội',
    to: 'Hồ Chí Minh',
    departureTime: '20:00',
    arrivalTime: '14:00+1',
    price: '450.000đ',
    duration: '18h',
    availableSeats: 12,
    busType: 'Giường nằm',
  },
  {
    id: 2,
    company: 'Xe Phương Trang',
    from: 'Hà Nội',
    to: 'Hồ Chí Minh',
    departureTime: '19:30',
    arrivalTime: '13:30+1',
    price: '480.000đ',
    duration: '18h',
    availableSeats: 8,
    busType: 'Giường nằm VIP',
  },
  {
    id: 3,
    company: 'Xe Hoàng Long',
    from: 'Hà Nội',
    to: 'Đà Nẵng',
    departureTime: '21:00',
    arrivalTime: '09:00+1',
    price: '320.000đ',
    duration: '12h',
    availableSeats: 15,
    busType: 'Giường nằm',
  },
];

export default function RoutesScreen() {
  const params = useLocalSearchParams();
  const [departure, setDeparture] = useState(params.departure as string || '');
  const [destination, setDestination] = useState(params.destination as string || '');
  const [date, setDate] = useState(params.date as string || '');
  const [filteredRoutes, setFilteredRoutes] = useState(busRoutes);

  useEffect(() => {
    filterRoutes();
  }, [departure, destination]);

  const filterRoutes = () => {
    if (!departure && !destination) {
      setFilteredRoutes(busRoutes);
      return;
    }

    const filtered = busRoutes.filter(route => {
      const fromMatch = !departure || route.from.toLowerCase().includes(departure.toLowerCase());
      const toMatch = !destination || route.to.toLowerCase().includes(destination.toLowerCase());
      return fromMatch && toMatch;
    });
    
    setFilteredRoutes(filtered);
  };

  const handleBookTicket = (route: any) => {
    router.push({
      pathname: '/booking',
      params: {
        routeId: route.id,
        company: route.company,
        from: route.from,
        to: route.to,
        departureTime: route.departureTime,
        arrivalTime: route.arrivalTime,
        price: route.price,
        duration: route.duration,
        busType: route.busType,
        availableSeats: route.availableSeats,
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tuyến xe</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Điểm đi"
              value={departure}
              onChangeText={setDeparture}
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Điểm đến"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={filterRoutes}>
          <Search size={20} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Tìm kiếm</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsTitle}>
          Tìm thấy {filteredRoutes.length} chuyến xe
        </Text>

        {filteredRoutes.map((route) => (
          <View key={route.id} style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.companyName}>{route.company}</Text>
              <Text style={styles.busType}>{route.busType}</Text>
            </View>

            <View style={styles.routeMain}>
              <View style={styles.timeSection}>
                <Text style={styles.time}>{route.departureTime}</Text>
                <Text style={styles.location}>{route.from}</Text>
              </View>

              <View style={styles.routeMiddle}>
                <Text style={styles.duration}>{route.duration}</Text>
                <View style={styles.routeLine}>
                  <View style={styles.dot} />
                  <View style={styles.line} />
                  <View style={styles.dot} />
                </View>
                <ArrowRight size={16} color="#6B7280" />
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.time}>{route.arrivalTime}</Text>
                <Text style={styles.location}>{route.to}</Text>
              </View>
            </View>

            <View style={styles.routeFooter}>
              <View style={styles.routeInfo}>
                <View style={styles.seatInfo}>
                  <Users size={16} color="#10B981" />
                  <Text style={styles.availableSeats}>
                    {route.availableSeats} chỗ trống
                  </Text>
                </View>
                <Text style={styles.price}>{route.price}</Text>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookTicket(route)}
              >
                <Text style={styles.bookButtonText}>Đặt vé</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredRoutes.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>
              Không tìm thấy chuyến xe phù hợp
            </Text>
            <Text style={styles.noResultsSubtext}>
              Vui lòng thử lại với thông tin khác
            </Text>
          </View>
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
  searchSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 12,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  busType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  routeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSection: {
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
  duration: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
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
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  seatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  availableSeats: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});