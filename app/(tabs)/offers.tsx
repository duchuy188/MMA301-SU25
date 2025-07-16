import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Gift, Percent, Star, Copy } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { getAllPromotions, Promotion } from '../../services/promotion';
import { Alert, Clipboard } from 'react-native';
import { loadAuthTokens, getCurrentUser } from '../../services/auth';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function OffersScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      checkAuthAndFetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuthAndFetchData();
    setRefreshing(false);
  };

  const checkAuthAndFetchData = async () => {
    try {
      const authLoaded = await loadAuthTokens();
      setIsAuthenticated(authLoaded);

      if (authLoaded) {
        fetchPromotions();
      } else {
        setLoading(false);
        // Hiển thị thông báo đăng nhập
        Alert.alert(
          'Thông báo',
          'Vui lòng đăng nhập để xem khuyến mãi',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng nhập', onPress: () => router.push('/auth') }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const result = await getAllPromotions('approved');

      if (result.success && result.data) {
        // Lọc ra các mã giảm giá chưa hết hạn
        const currentDate = new Date();
        const validPromotions = result.data.filter(promotion =>
          new Date(promotion.endDate) >= currentDate && 
          promotion.isActive === true &&
          (promotion.currentUsage < promotion.maxUsage || promotion.maxUsage === 0)
        );
        setPromotions(validPromotions);
      } else {
        Alert.alert('Thông báo', 'Không thể lấy danh sách khuyến mãi');
      }
    } catch (error: any) {
      // Xử lý khi token hết hạn
      if (error.message.includes('Phiên đăng nhập đã hết hạn')) {
        Alert.alert(
          'Thông báo',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          [
            { text: 'OK', onPress: () => router.push('/auth') }
          ]
        );
      } else {
        Alert.alert('Lỗi', error.message || 'Không thể lấy danh sách khuyến mãi');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyPromotionCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Thành công', 'Đã sao chép mã giảm giá!');
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'percent':
        return <Percent size={20} color="#FFD700" />;
      case 'fixed':
        return <Gift size={20} color="#FFD700" />;
      default:
        return <Star size={20} color="#FFD700" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDiscount = (type: string, value: number) => {
    return type === 'percent' ? `${value}%` : `${value.toLocaleString('vi-VN')}đ`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFD700"
          colors={["#FFD700"]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Ưu đãi</Text>
        <Text style={styles.subtitle}>Khuyến mãi và quà tặng hấp dẫn</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <View style={styles.offersList}>
          {promotions.length > 0 ? (
            promotions.map((promotion) => (
              <TouchableOpacity key={promotion._id} style={styles.offerCard}>
                <View style={styles.offerImageContainer}>
                  <Image
                    source={{
                      uri: promotion.posterUrl || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=200'
                    }}
                    style={styles.offerImage}
                  />
                  <View style={styles.discountBadge}>
                    {getOfferIcon(promotion.type)}
                    <Text style={styles.discountText}>
                      {formatDiscount(promotion.type, promotion.value)}
                    </Text>
                  </View>
                </View>

                <View style={styles.offerContent}>
                  <Text style={styles.offerTitle}>{promotion.name}</Text>
                  <Text style={styles.offerDescription}>{promotion.description}</Text>

                  <View style={styles.codeContainer}>
                    <View style={styles.codeWrapper}>
                      <Text style={styles.codeLabel}>Mã:</Text>
                      <Text style={styles.codeText}>{promotion.code}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyPromotionCode(promotion.code)}
                    >
                      <Copy size={18} color="#FFD700" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Hiệu lực từ:</Text>
                      <Text style={styles.dateValue}>{formatDate(promotion.startDate)}</Text>
                    </View>
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Hết hạn:</Text>
                      <Text style={styles.dateValue}>{formatDate(promotion.endDate)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noOffersContainer}>
              <Text style={styles.noOffersText}>Hiện tại chưa có mã giảm giá nào</Text>
            </View>
          )}
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  offersList: {
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 20,
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
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
    marginRight: 6,
  },
  codeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  copyButton: {
    padding: 6,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  dateValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  noOffersContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noOffersText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#999',
  },
  usageContainer: {
    marginTop: 4,
  },
  usageText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  }
});