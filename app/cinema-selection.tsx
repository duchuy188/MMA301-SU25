import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Star, Crown, Monitor } from 'lucide-react-native';

const cinemas = [
  {
    id: '1',
    name: 'Galaxy Cinema Nguyễn Du',
    address: '116 Nguyễn Du, Quận 1, TP.HCM',
    distance: '1.2 km',
    rating: 4.8,
    features: ['VIP', 'Ghế ngả', 'Bar'],
    available: true,
    isVIP: true,
  },
  {
    id: '2',
    name: 'Galaxy Cinema Landmark',
    address: '5B Tôn Đức Thắng, Quận 1, TP.HCM',
    distance: '2.1 km',
    rating: 4.6,
    features: ['Ghế ngả', 'Màn hình lớn'],
    available: true,
    isVIP: false,
  },
  {
    id: '3',
    name: 'Galaxy Cinema Vincom',
    address: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
    distance: '1.8 km',
    rating: 4.9,
    features: ['VIP', 'Ghế ngả', 'Bar', 'Màn hình lớn'],
    available: false,
    isVIP: true,
  },
  {
    id: '4',
    name: 'Galaxy Cinema Crescent',
    address: '101 Tôn Dật Tiên, Quận 7, TP.HCM',
    distance: '5.3 km',
    rating: 4.7,
    features: ['Ghế ngả', 'Bar'],
    available: true,
    isVIP: false,
  },
];

export default function CinemaSelectionScreen() {
  const handleCinemaSelect = (cinema: any) => {
    if (cinema.available) {
      router.push({
        pathname: '/datetime-selection',
        params: { cinemaId: cinema.id },
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn rạp</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cinemasList}>
          {cinemas.map((cinema) => (
            <TouchableOpacity
              key={cinema.id}
              style={[
                styles.cinemaCard,
                !cinema.available && styles.cinemaCardDisabled,
              ]}
              onPress={() => handleCinemaSelect(cinema)}
              disabled={!cinema.available}
            >
              <View style={styles.cinemaHeader}>
                <View style={styles.cinemaInfo}>
                  <Text style={styles.cinemaName}>{cinema.name}</Text>
                  {cinema.isVIP && (
                    <View style={styles.vipBadge}>
                      <Crown size={12} color="#000000" />
                      <Text style={styles.vipText}>VIP</Text>
                    </View>
                  )}
                </View>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusIndicator,
                    cinema.available ? styles.statusAvailable : styles.statusUnavailable
                  ]} />
                  <Text style={[
                    styles.statusText,
                    cinema.available ? styles.statusAvailableText : styles.statusUnavailableText
                  ]}>
                    {cinema.available ? 'Còn chỗ' : 'Đã hết'}
                  </Text>
                </View>
              </View>

              <View style={styles.cinemaDetails}>
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#666" />
                  <Text style={styles.addressText}>{cinema.address}</Text>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{cinema.rating}</Text>
                  </View>
                  <Text style={styles.distanceText}>{cinema.distance}</Text>
                </View>
              </View>

              <View style={styles.featuresContainer}>
                {cinema.features.map((feature, index) => (
                  <View key={index} style={styles.featureTag}>
                    {feature === 'VIP' && <Crown size={12} color="#FFD700" />}
                    {feature === 'Ghế ngả' && <Monitor size={12} color="#FFD700" />}
                    {feature === 'Bar' && <Star size={12} color="#FFD700" />}
                    {feature === 'Màn hình lớn' && <Monitor size={12} color="#FFD700" />}
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
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
  cinemasList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 15,
  },
  cinemaCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  cinemaCardDisabled: {
    opacity: 0.5,
  },
  cinemaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cinemaInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cinemaName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  vipText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#000000',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusAvailable: {
    backgroundColor: '#FFD700',
  },
  statusUnavailable: {
    backgroundColor: '#666',
  },
  statusText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
  },
  statusAvailableText: {
    color: '#FFD700',
  },
  statusUnavailableText: {
    color: '#666',
  },
  cinemaDetails: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFD700',
  },
  distanceText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#666',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  featureText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 11,
    color: '#FFD700',
  },
});