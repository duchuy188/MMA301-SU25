import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Monitor } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { getSeatsByScreeningId } from '../services/seat';
import { createBooking, getBookings } from '../services/booking';
import { useLocalSearchParams } from 'expo-router';
import { getScreeningById } from '../services/screening';
import { getMovieById } from '../services/movie';
import { getTheaterById } from '../services/theater';

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
  console.warn('Invalid ID format:', idOrObject);
  return '';
};

export default function SeatSelectionScreen() {
  const params = useLocalSearchParams();
  console.log('params:', params);
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

  useEffect(() => {
    if (!screeningId) return;
    
    // Lấy thông tin screening
    const fetchScreening = async () => {
      const screeningData = await getScreeningById(screeningId as string);
      if (!screeningData) return;
      console.log('screeningData:', screeningData);
      setScreening(screeningData);
      setTicketPrice(screeningData.ticketPrice || screeningData.price);
      
      // Lấy thông tin phim và rạp
      // Extract the actual IDs using helper function
      const movieId = extractId(screeningData.movieId);
      const theaterId = extractId(screeningData.theaterId);
      
      console.log('Extracted movieId:', movieId);
      console.log('Extracted theaterId:', theaterId);
      
      if (movieId) {
        try {
          const movieData = await getMovieById(movieId);
          setMovie(movieData);
        } catch (error) {
          console.error('Error fetching movie:', error);
          // Set a default movie object to prevent crashes
          setMovie({ title: 'Không xác định', _id: movieId });
        }
      }
      
      if (theaterId) {
        try {
          const theaterData = await getTheaterById(theaterId);
          setTheater(theaterData);
        } catch (error) {
          console.error('Error fetching theater:', error);
          // Set a default theater object to prevent crashes
          setTheater({ name: 'Không xác định', _id: theaterId });
        }
      }
    };
    fetchScreening();
    const fetchSeats = async () => {
      try {
        console.log('Fetching seats for screening:', screeningId);
        
        // Thử lấy từ seat API trước
        let seats = await getSeatsByScreeningId(screeningId as string);
        console.log('Raw seats data from seat API:', seats);
        
        // Nếu seat API không có dữ liệu, fallback sang booking API
        if (!seats || seats.length === 0) {
          console.log('Seat API empty, trying booking API...');
          const bookings = await getBookings({ screeningId: screeningId as string });
          console.log('Bookings for this screening:', bookings);
          
          // Convert bookings to seat format
          seats = [];
          bookings.forEach(booking => {
            if (booking.seatNumbers && booking.seatNumbers.length > 0) {
              booking.seatNumbers.forEach(seatNumber => {
                seats.push({
                  seatNumber: seatNumber,
                  status: booking.paymentStatus === 'cancelled' ? 'available' : 
                          booking.paymentStatus === 'pending' ? 'pending' : 'occupied',
                  type: 'regular' // Default type
                });
              });
            }
          });
          console.log('Converted seats from bookings:', seats);
        }
        
        const occupied = seats.filter(s => s.status === 'occupied' || s.status === 'booked').map(s => s.seatNumber);
        const vip = seats.filter(s => s.type === 'vip').map(s => s.seatNumber);
        const pending = seats.filter(s => s.status === 'reserved' || s.status === 'pending').map(s => s.seatNumber);
        
        console.log('Final occupied seats:', occupied);
        console.log('Final VIP seats:', vip);
        console.log('Final pending seats:', pending);
        
        setOccupiedSeats(occupied);
        setVipSeats(vip);
        setPendingSeats(pending);
      } catch (error) {
        console.error('Error fetching seats:', error);
        // Continue with empty seat data if there's an error
      }
    };
    fetchSeats();
  }, [screeningId]);

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
        // Tạo booking với status pending ngay khi chọn ghế
        const bookingData = {
          screeningId: screening._id,
          seatNumbers: selectedSeats,
        };
        
        console.log('Creating pending booking:', bookingData);
        const pendingBooking = await createBooking(bookingData);
        
        if (!pendingBooking) {
          alert('Không thể tạo booking. Vui lòng thử lại.');
          return;
        }
        
        console.log('Pending booking created:', pendingBooking);
        
        const total = selectedSeats.length * ticketPrice;
        router.push({
          pathname: '/payment',
          params: {
            movie: movie.title,
            cinema: theater.name,
            date: screening.startTime ? screening.startTime.slice(0, 10) : '',
            time: screening.startTime ? screening.startTime.slice(11, 16) : '',
            seats: selectedSeats.join(','),
            ticketPrice: ticketPrice.toString(),
            serviceFee: '20000', // Nếu có phí dịch vụ, thay bằng biến động
            total: total.toString(),
            screeningId: screening._id,
            bookingId: pendingBooking._id,
          },
        });
      } catch (error) {
        console.error('Error in seat selection:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
      } finally {
        setIsCreatingBooking(false);
      }
    }
  };

  const calculateTotal = () => {
    // Nếu có ghế VIP, bạn có thể cộng thêm phụ phí nếu muốn
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

        {selectedSeats.length > 0 && (
          <View style={styles.selectionSummary}>
            <Text style={styles.summaryTitle}>Ghế đã chọn:</Text>
            <Text style={styles.summarySeats}>{selectedSeats.join(', ')}</Text>
            <Text style={styles.summaryTotal}>
              Tổng tiền: {calculateTotal().toLocaleString('vi-VN')} VNĐ
            </Text>
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
              <Text style={styles.continueButtonText}>
                Tiếp tục ({selectedSeats.length} ghế)
              </Text>
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
});