import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Gift, Percent, Crown, Star } from 'lucide-react-native';

const offers = [
  {
    id: '1',
    title: 'Giảm 50% vé cuối tuần',
    description: 'Áp dụng cho tất cả suất chiếu cuối tuần',
    discount: '50%',
    validUntil: '31/12/2024',
    code: 'WEEKEND50',
    image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
    type: 'discount',
  },
  {
    id: '2',
    title: 'Combo bắp nước miễn phí',
    description: 'Mua vé VIP tặng combo bắp nước size L',
    discount: 'Miễn phí',
    validUntil: '25/12/2024',
    code: 'VIPCOMBO',
    image: 'https://images.pexels.com/photos/7991472/pexels-photo-7991472.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
    type: 'gift',
  },
  {
    id: '3',
    title: 'Thành viên Vàng - Ưu đãi đặc biệt',
    description: 'Giảm 30% cho thành viên Vàng và Bạch Kim',
    discount: '30%',
    validUntil: '01/01/2025',
    code: 'GOLDMEMBER',
    image: 'https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
    type: 'vip',
  },
  {
    id: '4',
    title: 'Mua 2 tặng 1',
    description: 'Mua 2 vé thường tặng 1 vé thường',
    discount: '1 vé',
    validUntil: '20/12/2024',
    code: 'BUY2GET1',
    image: 'https://images.pexels.com/photos/7991583/pexels-photo-7991583.jpeg?auto=compress&cs=tinysrgb&w=400&h=200',
    type: 'gift',
  },
];

export default function OffersScreen() {
  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent size={20} color="#FFD700" />;
      case 'gift':
        return <Gift size={20} color="#FFD700" />;
      case 'vip':
        return <Crown size={20} color="#FFD700" />;
      default:
        return <Star size={20} color="#FFD700" />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ưu đãi</Text>
        <Text style={styles.subtitle}>Khuyến mãi và quà tặng hấp dẫn</Text>
      </View>

      <View style={styles.offersList}>
        {offers.map((offer) => (
          <TouchableOpacity key={offer.id} style={styles.offerCard}>
            <View style={styles.offerImageContainer}>
              <Image source={{ uri: offer.image }} style={styles.offerImage} />
              <View style={styles.discountBadge}>
                {getOfferIcon(offer.type)}
                <Text style={styles.discountText}>{offer.discount}</Text>
              </View>
            </View>
            
            <View style={styles.offerContent}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDescription}>{offer.description}</Text>
              
              <View style={styles.offerDetails}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeLabel}>Mã:</Text>
                  <Text style={styles.codeText}>{offer.code}</Text>
                </View>
                <Text style={styles.validUntil}>
                  Có hiệu lực đến: {offer.validUntil}
                </Text>
              </View>

              <TouchableOpacity style={styles.useButton}>
                <Text style={styles.useButtonText}>Sử dụng ngay</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.membershipCard}>
          <View style={styles.membershipIcon}>
            <Crown size={32} color="#FFD700" />
          </View>
          <View style={styles.membershipContent}>
            <Text style={styles.membershipTitle}>Nâng cấp thành viên VIP</Text>
            <Text style={styles.membershipDescription}>
              Trở thành thành viên VIP để nhận nhiều ưu đãi độc quyền hơn
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Nâng cấp ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  offersList: {
    paddingHorizontal: 20,
    gap: 20,
  },
  offerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  offerImageContainer: {
    position: 'relative',
    height: 120,
  },
  offerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  discountText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  offerDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 12,
  },
  offerDetails: {
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
    marginRight: 6,
  },
  codeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  validUntil: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#666',
  },
  useButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  useButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  membershipCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  membershipIcon: {
    marginRight: 16,
  },
  membershipContent: {
    flex: 1,
  },
  membershipTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 6,
  },
  membershipDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#000000',
  },
});