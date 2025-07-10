import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Monitor, Tag, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getSeatsByScreeningId } from '../services/seat';
import { createBooking, getBookings, updateBooking } from '../services/booking';
import { useLocalSearchParams } from 'expo-router';
import { getScreeningById } from '../services/screening';
import { getMovieById } from '../services/movie';
import { getTheaterById } from '../services/theater';
import { validatePromotionCode, getAllPromotions, Promotion } from '../services/promotion';
import { getCurrentUser } from '../services/auth';

const seatMap = Array.from({ length: 8 }, (_, rowIdx) =>
  Array.from({ length: 8 }, (_, colIdx) =>
    String.fromCharCode(65 + rowIdx) + (colIdx + 1)
  )
);

// Helper function to extract ID from object or string
const extractId = (idOrObject: string | { _id: string } | any): string => {
  if (typeof idOrObject === 'string') {
    return idOrObject;
  }
  if (typeof idOrObject === 'object' && idOrObject?._id) {
    return idOrObject._id;
  }
  return '';
};

export default function SeatSelectionScreen() {
  const params = useLocalSearchParams();
  const { screeningId } = params;
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [vipSeats, setVipSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [pendingSeats, setPendingSeats] = useState<string[]>([]);
  const [ticketPrice, setTicketPrice] = useState<number>(0);
  const [screening, setScreening] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  
  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [discount, setDiscount] = useState(0);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [isLoadingPromo, setIsLoadingPromo] = useState(false);

  useEffect(() => {
    if (!screeningId) return;
    
    // Lấy thông tin screening
    const fetchScreening = async () => {
      const screeningData = await getScreeningById(screeningId as string);
      if (!screeningData) return;
      setScreening(screeningData);
      setTicketPrice(screeningData.ticketPrice || screeningData.price);
      
      // Lấy thông tin phim và rạp
      // Extract the actual IDs using helper function
      const movieId = extractId(screeningData.movieId);
      const theaterId = extractId(screeningData.theaterId);
      
      if (movieId) {
        try {
          const movieData = await getMovieById(movieId);
          setMovie(movieData);
        } catch (error) {
          // Set a default movie object to prevent crashes
          setMovie({ title: 'Không xác định', _id: movieId });
        }
      }
      
      if (theaterId) {
        try {
          const theaterData = await getTheaterById(theaterId);
          setTheater(theaterData);
        } catch (error) {
          // Set a default theater object to prevent crashes
          setTheater({ name: 'Không xác định', _id: theaterId });
        }
      }
    };
    fetchScreening();
    const fetchSeats = async () => {
      try {
        // Thử lấy từ seat API trước
        let seats = await getSeatsByScreeningId(screeningId as string);
        
        // Nếu seat API không có dữ liệu, fallback sang booking API
        if (!seats || seats.length === 0) {
          const bookings = await getBookings({ screeningId: screeningId as string });
          
          // Convert bookings to seat format
          seats = [];
          bookings.forEach((booking: any) => {
            if (booking.seatNumbers && booking.seatNumbers.length > 0) {
              booking.seatNumbers.forEach((seatNumber: string) => {
                seats.push({
                  seatNumber: seatNumber,
                  status: booking.paymentStatus === 'cancelled' ? 'available' : 
                          booking.paymentStatus === 'pending' ? 'pending' : 'occupied',
                  type: 'regular' // Default type
                });
              });
            }
          });
        }
        
        const occupied = seats.filter(s => s.status === 'occupied' || s.status === 'booked').map(s => s.seatNumber);
        const vip = seats.filter(s => s.type === 'vip').map(s => s.seatNumber);
        const pending = seats.filter(s => s.status === 'reserved' || s.status === 'pending').map(s => s.seatNumber);
        
        setOccupiedSeats(occupied);
        setVipSeats(vip);
        setPendingSeats(pending);
      } catch (error) {
        // Continue with empty seat data if there's an error
      }
    };
    fetchSeats();
  }, [screeningId]);

  // Load available promotions
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const response = await getAllPromotions();
        if (response.success && response.data) {
          const activePromotions = response.data.filter((promotion: Promotion) => 
            promotion.isActive && 
            promotion.status === 'approved' &&
            new Date(promotion.endDate) > new Date()
          );
          setAvailablePromotions(activePromotions);
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
      }
    };

    loadPromotions();
  }, []);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setIsLoadingPromo(true);
    try {
      const response = await validatePromotionCode(promoCode.trim());
      
      // Check if response has promotion data directly or in nested format
      let promotion: Promotion | null = null;
      if (response.success && response.data) {
        // Format: {success: true, data: promotion}
        promotion = response.data;
      } else if ((response as any)._id && (response as any).code) {
        // Format: promotion object directly
        promotion = response as any as Promotion;
      }
      
      if (promotion) {
        // Check if promotion is valid
        if (promotion.status === 'approved' && promotion.isActive && new Date(promotion.endDate) > new Date()) {
          const currentTotal = selectedSeats.length * ticketPrice;
          let discountAmount = 0;
          
          if (promotion.type === 'percent') {
            discountAmount = Math.round((currentTotal * promotion.value) / 100);
          } else if (promotion.type === 'fixed') {
            discountAmount = promotion.value;
          }
          
          discountAmount = Math.min(discountAmount, currentTotal);
          
          setAppliedPromo(promotion);
          setDiscount(discountAmount);
          
          Alert.alert(
            'Áp dụng thành công!', 
            `Mã "${promotion.code}" đã được áp dụng. ${promotion.type === 'percent' ? `Giảm ${promotion.value}%` : `Giảm ${promotion.value.toLocaleString('vi-VN')} VNĐ`}`
          );
          setPromoCode('');
        } else {
          Alert.alert('Lỗi', 'Mã khuyến mãi không hợp lệ, đã hết hạn hoặc chưa được phê duyệt');
        }
      } else {
        Alert.alert('Lỗi', 'Mã khuyến mãi không tồn tại');
      }
    } catch (error: any) {
      // Xử lý các loại lỗi khác nhau
      let errorMessage = 'Mã khuyến mãi không hợp lệ';
      if (error.response?.status === 404) {
        errorMessage = 'Mã khuyến mãi không tồn tại';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Mã khuyến mãi không hợp lệ';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsLoadingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setDiscount(0);
  };

  const handleSeatSelect = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatStyle = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) {
      return [styles.seat, styles.seatOccupied];
    }
    if (pendingSeats.includes(seatId)) {
      return [styles.seat, styles.seatPending];
    }
    if (selectedSeats.includes(seatId)) {
      return [styles.seat, styles.seatSelected];
    }
    if (vipSeats.includes(seatId)) {
      return [styles.seat, styles.seatVIP];
    }
    return [styles.seat, styles.seatAvailable];
  };

  const handleContinue = async () => {
    if (selectedSeats.length > 0 && screening && movie && theater) {
      setIsCreatingBooking(true);
      try {
        // Get current user
        const currentUser = getCurrentUser();
        
        // Check for both _id and id fields
        const userId = currentUser?._id || currentUser?.id;
        if (!currentUser || !userId) {
          Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt vé');
          router.push('/auth');
          return;
        }

        // Validate mã khuyến mãi một lần nữa trước khi tạo booking
        if (appliedPromo?.code) {
          try {
            const validationResponse = await validatePromotionCode(appliedPromo.code);
            
            let validPromotion: Promotion | null = null;
            if (validationResponse.success && validationResponse.data) {
              validPromotion = validationResponse.data;
            } else if ((validationResponse as any)._id && (validationResponse as any).code) {
              validPromotion = validationResponse as any as Promotion;
            }
            
            if (!validPromotion || validPromotion.status !== 'approved' || !validPromotion.isActive) {
              Alert.alert('Lỗi', 'Mã khuyến mãi không còn hợp lệ. Vui lòng kiểm tra lại.');
              setAppliedPromo(null);
              setDiscount(0);
              return;
            }
          } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể xác minh mã khuyến mãi. Vui lòng thử lại.');
            return;
          }
        }
        
        // Tạo booking với status pending ngay khi chọn ghế  
        const baseTotal = selectedSeats.length * ticketPrice;
        const finalTotal = calculateTotal();
        
        const bookingData: any = {
          userId: userId,
          screeningId: screening._id,
          seatNumbers: selectedSeats,
          paymentStatus: 'pending',
          totalPrice: finalTotal,
        };
        
        // Thêm promotion code nếu có - QUAN TRỌNG: chỉ thêm khi có mã khuyến mãi
        if (appliedPromo?.code) {
          bookingData.code = appliedPromo.code; // Sử dụng mã khuyến mãi làm code
          bookingData.promotionId = appliedPromo._id;
          bookingData.discountAmount = discount;
        } else {
          // QUAN TRỌNG: Khi không có mã khuyến mãi, code sẽ là null
          bookingData.code = null;
        }
        
        const pendingBooking = await createBooking(bookingData);
        
        // Check for booking ID in different possible locations
        let bookingId = null;
        if (pendingBooking?._id) {
          bookingId = pendingBooking._id;
        } else if (pendingBooking?.data?._id) {
          bookingId = pendingBooking.data._id;
        } else if (pendingBooking?.booking?._id) {
          bookingId = pendingBooking.booking._id;
        } else if (pendingBooking?.id) {
          bookingId = pendingBooking.id;
        }
        
        if (!bookingId) {
          Alert.alert('Lỗi', 'Không thể tạo booking. Server không trả về ID đặt vé.');
          return;
        }
        
        // Convert startTime to local time for display
        const getLocalTime = (dateTimeString: string) => {
          if (!dateTimeString) return '';
          try {
            const date = new Date(dateTimeString);
            return date.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
          } catch (error) {
            // Fallback to slice method if conversion fails
            return dateTimeString.slice(11, 16);
          }
        };

        const getLocalDate = (dateTimeString: string) => {
          if (!dateTimeString) return '';
          try {
            const date = new Date(dateTimeString);
            return date.toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).split('/').reverse().join('-'); // Convert to YYYY-MM-DD format
          } catch (error) {
            // Fallback to slice method if conversion fails
            return dateTimeString.slice(0, 10);
          }
        };

        router.push({
          pathname: '/payment',
          params: {
            movie: movie.title,
            cinema: theater.name,
            date: getLocalDate(screening.startTime),
            time: getLocalTime(screening.startTime),
            seats: selectedSeats.join(','),
            ticketPrice: ticketPrice.toString(),
            baseTotal: baseTotal.toString(),
            discount: discount.toString(),
            finalTotal: finalTotal.toString(),
            appliedPromoCode: appliedPromo?.code || '',
            screeningId: screening._id,
            bookingId: bookingId,
          },
        });
      } catch (error: any) {
        let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
        
        // Check for specific error messages
        if (error.message?.includes('already booked')) {
          errorMessage = 'Một số ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.';
          // Reset selected seats if they're already booked
          setSelectedSeats([]);
          setAppliedPromo(null);
          setDiscount(0);
        } else if (error.response?.status === 409) {
          errorMessage = 'Ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.';
          setSelectedSeats([]);
          setAppliedPromo(null);
          setDiscount(0);
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Lỗi', errorMessage);
      } finally {
        setIsCreatingBooking(false);
      }
    }
  };

  const calculateTotal = () => {
    const baseTotal = selectedSeats.length * ticketPrice;
    return Math.max(0, baseTotal - discount);
  };

  const calculateBaseTotal = () => {
    return selectedSeats.length * ticketPrice;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn ghế</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.screenContainer}>
          <View style={styles.screen}>
            <Monitor size={24} color="#FFD700" />
            <Text style={styles.screenText}>MÀN ẢNH</Text>
          </View>
          <View style={styles.curtain} />
        </View>

        <View style={styles.seatMapContainer}>
          {seatMap.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.seatRow}>
              {row.map((seat, seatIndex) => (
                <View key={seatIndex} style={styles.seatSlot}>
                  {seat ? (
                    <TouchableOpacity
                      style={getSeatStyle(seat)}
                      onPress={() => handleSeatSelect(seat)}
                    >
                      <Text style={[
                        styles.seatText,
                        occupiedSeats.includes(seat) && styles.seatTextOccupied,
                        selectedSeats.includes(seat) && styles.seatTextSelected,
                      ]}>
                        {seat}
                      </Text>
                      {vipSeats.includes(seat) && !occupiedSeats.includes(seat) && (
                        <Crown size={8} color="#FFD700" style={styles.vipIcon} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.seatGap} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatAvailable]} />
            <Text style={styles.legendText}>Ghế trống</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatSelected]} />
            <Text style={styles.legendText}>Đã chọn</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatPending]} />
            <Text style={styles.legendText}>Ghế đang đặt</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSeat, styles.seatOccupied]} />
            <Text style={styles.legendText}>Đã bán</Text>
          </View>
        </View>

        {/* Phần mã khuyến mãi */}
        <View style={styles.promoSection}>
          <Text style={styles.promoSectionTitle}>Mã khuyến mãi (tùy chọn)</Text>
          <Text style={styles.promoDescription}>Bỏ trống nếu không có mã khuyến mãi</Text>
          
          {appliedPromo ? (
            <View style={styles.appliedPromo}>
              <View style={styles.promoInfo}>
                <Tag size={20} color="#FFD700" />
                <View style={styles.appliedPromoTextContainer}>
                  <Text style={styles.appliedPromoText}>
                    {appliedPromo.code} - {appliedPromo.name}
                  </Text>
                  <Text style={styles.appliedPromoDiscount}>
                    Giảm {appliedPromo.type === 'percent' ? `${appliedPromo.value}%` : `${appliedPromo.value.toLocaleString('vi-VN')} VNĐ`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={removePromoCode} style={styles.removePromoButton}>
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInput}>
              <TextInput
                style={styles.promoTextInput}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor="#666"
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={[styles.applyPromoButton, (!promoCode.trim() || isLoadingPromo) && styles.applyPromoButtonDisabled]} 
                onPress={applyPromoCode}
                disabled={!promoCode.trim() || isLoadingPromo}
              >
                {isLoadingPromo ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.applyPromoText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {/* Gợi ý mã khuyến mãi */}
          {availablePromotions.length > 0 && !appliedPromo && (
            <View style={styles.promoSuggestions}>
              <Text style={styles.promoSuggestionsTitle}>Mã khuyến mãi có sẵn:</Text>
              {availablePromotions.slice(0, 3).map((promotion) => (
                <TouchableOpacity 
                  key={promotion._id} 
                  style={styles.promoSuggestion}
                  onPress={() => setPromoCode(promotion.code)}
                >
                  <Text style={styles.promoSuggestionCode}>{promotion.code}</Text>
                  <Text style={styles.promoSuggestionDesc}>{promotion.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedSeats.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryTitle}>Ghế đã chọn:</Text>
            <Text style={styles.summarySeats}>{selectedSeats.join(', ')}</Text>
              <View style={styles.summaryPricing}>
                <View style={styles.summaryPriceRow}>
                  <Text style={styles.summaryPriceLabel}>
                    Giá vé ({selectedSeats.length} ghế):
                  </Text>
                  <Text style={styles.summaryPriceValue}>
                    {calculateBaseTotal().toLocaleString('vi-VN')} VNĐ
                  </Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryPriceRow}>
                    <Text style={styles.summaryDiscountLabel}>
                      Giảm giá ({appliedPromo?.code}):
                    </Text>
                    <Text style={styles.summaryDiscountValue}>
                      -{discount.toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                )}
                <View style={styles.summaryTotalContainer}>
                  <View style={styles.summaryTotalRow}>
                    <Text style={styles.summaryTotalLabel}>Tổng tiền:</Text>
                    <Text style={styles.summaryTotal}>
                      {calculateTotal().toLocaleString('vi-VN')} VNĐ
                    </Text>
                  </View>
                </View>
              </View>
          </View>
        )}
      </ScrollView>

      {selectedSeats.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueButton, isCreatingBooking && styles.continueButtonDisabled]} 
            onPress={handleContinue}
            disabled={isCreatingBooking}
          >
            {isCreatingBooking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000000" />
                <Text style={styles.continueButtonText}>Đang tạo booking...</Text>
              </View>
            ) : (
              <View style={styles.continueButtonContent}>
                <Text style={styles.continueButtonText}>
                  Tiếp tục ({selectedSeats.length} ghế)
                </Text>
                <Text style={styles.continueButtonPrice}>
                  {calculateTotal().toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  screenContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  screen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  screenText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
  },
  curtain: {
    width: '80%',
    height: 2,
    backgroundColor: '#FFD700',
    marginTop: 10,
    borderRadius: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  seatMapContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatSlot: {
    width: 28,
    height: 28,
    marginHorizontal: 2,
  },
  seat: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seatAvailable: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  seatVIP: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  seatSelected: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  seatOccupied: {
    backgroundColor: '#666',
    borderWidth: 1,
    borderColor: '#666',
  },
  seatGap: {
    width: 28,
    height: 28,
  },
  seatText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 8,
    color: '#FFFFFF',
  },
  seatTextSelected: {
    color: '#000000',
  },
  seatTextOccupied: {
    color: '#999',
  },
  vipIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  vipSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  vipBorder: {
    width: '60%',
    height: 1,
    backgroundColor: '#FFD700',
    marginBottom: 5,
  },
  vipSectionLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    color: '#FFD700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendItem: {
    alignItems: 'center',
    gap: 4,
  },
  legendSeat: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
  },
  legendText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#999',
  },
  selectionSummary: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  summarySeats: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryTotal: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#000000',
  },
  continueButtonContent: {
    alignItems: 'center',
  },
  continueButtonPrice: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#000000',
    marginTop: 2,
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seatPending: {
    backgroundColor: '#FF9800', // orange for pending
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  summaryPricing: {
    marginTop: 8,
  },
  summaryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryPriceLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
  },
  summaryPriceValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  summaryTotalLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFD700',
  },
  summaryDiscountLabel: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#4CAF50',
  },
  summaryDiscountValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#4CAF50',
  },
  summaryTotalContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Promo code styles
  promoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  promoSectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFD700',
    marginBottom: 4,
  },
  promoDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  promoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appliedPromoTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  appliedPromoText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#4CAF50',
  },
  appliedPromoDiscount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  removePromoButton: {
    backgroundColor: '#FF5722',
    padding: 8,
    borderRadius: 6,
  },
  promoInput: {
    flexDirection: 'row',
    gap: 12,
  },
  promoTextInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  applyPromoButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyPromoButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
  applyPromoText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  promoSuggestions: {
    marginTop: 12,
  },
  promoSuggestionsTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 8,
  },
  promoSuggestion: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  promoSuggestionCode: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 2,
  },
  promoSuggestionDesc: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#999',
  },
});