import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MapPin, Calendar, ArrowRight, Star, Clock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const popularRoutes = [
  {
    id: 1,
    from: 'Hà Nội',
    to: 'Hồ Chí Minh',
    price: '450.000đ',
    duration: '18h',
    rating: 4.8,
    image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 2,
    from: 'Hà Nội',
    to: 'Đà Nẵng',
    price: '320.000đ',
    duration: '12h',
    rating: 4.7,
    image: 'https://images.pexels.com/photos/1068638/pexels-photo-1068638.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: 3,
    from: 'Hồ Chí Minh',
    to: 'Đà Lạt',
    price: '180.000đ',
    duration: '7h',
    rating: 4.9,
    image: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function HomeScreen() {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    if (departure && destination) {
      router.push({
        pathname: '/routes',
        params: { departure, destination, date }
      });
    }
  };

  const handleRouteSelect = (route: any) => {
    router.push({
      pathname: '/booking',
      params: { 
        routeId: route.id,
        from: route.from,
        to: route.to,
        price: route.price,
        duration: route.duration
      }
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BusGo</Text>
        <Text style={styles.headerSubtitle}>Đặt vé xe khách trực tuyến</Text>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Đặt vé nhanh</Text>
          <Text style={styles.bannerSubtitle}>Giá tốt - Tiện lợi</Text>
        </View>
      </View>

      {/* Search Form */}
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Tìm chuyến xe</Text>
        
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

        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Calendar size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Ngày đi (dd/mm/yyyy)"
              value={date}
              onChangeText={setDate}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Tìm chuyến xe</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Popular Routes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tuyến xe phổ biến</Text>
        
        {popularRoutes.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={styles.routeCard}
            onPress={() => handleRouteSelect(route)}
          >
            <Image source={{ uri: route.image }} style={styles.routeImage} />
            <View style={styles.routeInfo}>
              <View style={styles.routeHeader}>
                <Text style={styles.routeText}>
                  {route.from} → {route.to}
                </Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.rating}>{route.rating}</Text>
                </View>
              </View>
              
              <View style={styles.routeDetails}>
                <View style={styles.routeDetail}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.routeDetailText}>{route.duration}</Text>
                </View>
                <Text style={styles.routePrice}>{route.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BFDBFE',
  },
  banner: {
    position: 'relative',
    height: 150,
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
  },
  searchCard: {
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
  searchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
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
    marginTop: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  routeImage: {
    width: '100%',
    height: 120,
  },
  routeInfo: {
    padding: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    alignItems: 'center',
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
  routePrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
  },
});