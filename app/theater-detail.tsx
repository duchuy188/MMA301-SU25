import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Phone, Info, Clock, Calendar, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Theater, getTheaterById } from '../services/theater';
import MapView, { Marker } from 'react-native-maps';
import { getCoordinatesByAddress } from '../data/theater-coordinates';
const nguyen_van_qua = require('../assets/images/theater/Nguyễn Văn Quá.jpg');
const truong_chinh = require('../assets/images/theater/Trường Chinh.jpg');
const huynh_tan_phat = require('../assets/images/theater/Huỳnh Tấn Phát.jpg');
const trung_chanh = require('../assets/images/theater/Trung Chánh.jpg');
const nguyen_du = require('../assets/images/theater/Nguyễn Du.jpg');
const thiso_mall = require('../assets/images/theater/Thiso Mall.webp');

export default function TheaterDetailScreen() {
  const { theaterId } = useLocalSearchParams();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchTheaterDetails = async () => {
      if (!theaterId) return;
      
      try {
        setLoading(true);
        const data = await getTheaterById(theaterId as string);
        setTheater(data);
      } catch (err) {
        setError('Không thể tải thông tin rạp. Vui lòng thử lại sau.');
        console.error('Error fetching theater details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheaterDetails();
  }, [theaterId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải thông tin rạp...</Text>
      </View>
    );
  }

  if (error || !theater) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin rạp'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coordinates = getCoordinatesByAddress(theater.address);
  const latitude = coordinates.latitude;
  const longitude = coordinates.longitude;

  const getTheaterImage = (name: string) => {
    if (name.includes('Nguyễn Văn Quá')) return nguyen_van_qua;
    if (name.includes('Trường Chinh')) return truong_chinh;
    if (name.includes('Huỳnh Tấn Phát')) return huynh_tan_phat;
    if (name.includes('Trung Chánh')) return trung_chanh;
    if (name.includes('Nguyễn Du')) return nguyen_du;
    if (name.includes('Thiso Mall')) return thiso_mall;
    return nguyen_van_qua; 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết rạp</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Banner hình ảnh rạp */}
        <View style={styles.bannerContainer}>
          {imageLoading && (
            <View style={[styles.bannerImage, styles.imagePlaceholder]}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          )}
          <Image 
            source={getTheaterImage(theater.name)}
            style={styles.bannerImage}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.theaterName}>{theater.name}</Text>
          </View>
        </View>

        {/* Thông tin chính */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#FFD700" />
            <Text style={styles.infoText}>{theater.address}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Phone size={20} color="#FFD700" />
            <Text style={styles.infoText}>{theater.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Calendar size={20} color="#FFD700" />
            <Text style={styles.infoText}>Mở cửa: 8:00 - 23:00</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Star size={20} color="#FFD700" />
            <Text style={styles.infoText}>{theater.screens || 'N/A'} phòng chiếu</Text>
          </View>
        </View>

        {/* Mô tả */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.descriptionText}>{theater.description}</Text>
        </View>

        {/* Bản đồ */}
        <View style={styles.mapCard}>
          <Text style={styles.sectionTitle}>Vị trí</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                title={theater.name}
                description={theater.address}
              />
            </MapView>
          </View>
        </View>

        {/* Các nút hành động */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={() => router.push({
              pathname: '/datetime-selection',
              params: { theaterId: theater._id }
            })}
          >
            <Text style={styles.bookButtonText}>ĐẶT VÉ NGAY</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => Linking.openURL(`tel:${theater.phone}`)}
            >
              <Phone size={18} color="#FFD700" />
              <Text style={styles.secondaryButtonText}>Gọi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                const url = `https://maps.google.com/?q=${latitude},${longitude}`;
                Linking.openURL(url);
              }}
            >
              <MapPin size={18} color="#FFD700" />
              <Text style={styles.secondaryButtonText}>Chỉ đường</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  bannerContainer: {
    position: 'relative',
    height: 200,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
  },
  theaterName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  descriptionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  mapCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  bookButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 15,
  },
  bookButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#000000',
    letterSpacing: 1,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'column',
    gap: 5,
  },
  secondaryButtonText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  topBannerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});