import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Image, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Phone, Info, Clock, Calendar, Star, Film, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Theater, getTheaterById } from '../services/theater';
import { Room, getRooms } from '../services/room';
import { Movie, getPublicMovies } from '../services/movie';
import { Screening, getPublicScreenings } from '../services/screening';
import MapView, { Marker } from 'react-native-maps';
import { getCoordinatesByAddress } from '../data/theater-coordinates';

const nguyen_van_qua = require('../assets/images/theater/Nguyễn Văn Quá.jpg');
const truong_chinh = require('../assets/images/theater/Trường Chinh.jpg');
const huynh_tan_phat = require('../assets/images/theater/Huỳnh Tấn Phát.jpg');
const trung_chanh = require('../assets/images/theater/Trung Chánh.jpg');
const nguyen_du = require('../assets/images/theater/Nguyễn Du.jpg');
const thiso_mall = require('../assets/images/theater/Thiso Mall.webp');

interface MovieWithScreenings {
  movie: Movie;
  screenings: Screening[];
  times: string[];
}

export default function TheaterDetailScreen() {
  const { theaterId } = useLocalSearchParams();
  const [theater, setTheater] = useState<Theater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateOptions, setDateOptions] = useState<{ id: string, date: string, day: string, isToday: boolean }[]>([]);
  const [moviesOnSelectedDate, setMoviesOnSelectedDate] = useState<MovieWithScreenings[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    const fetchTheaterDetails = async () => {
      if (!theaterId) return;
      
      try {
        setLoading(true);
        const data = await getTheaterById(theaterId as string);
        setTheater(data);
        
        // Fetch rooms
        const roomsData = await getRooms();
        const theaterRooms = roomsData.filter(room => {
          const roomTheaterId = typeof room.theaterId === 'object' ? room.theaterId._id : room.theaterId;
          return roomTheaterId === theaterId;
        });
        setRooms(theaterRooms);

        // Fetch movies and screenings immediately when component loads
        fetchMoviesAndScreenings();
      } catch (err) {
        setError('Không thể tải thông tin rạp. Vui lòng thử lại sau.');
        console.error('Error fetching theater details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheaterDetails();
  }, [theaterId]);

  const fetchMoviesAndScreenings = async () => {
    if (!theaterId) return;
    
    try {
      setLoadingMovies(true);
      
      // Get movies and screenings
      const movies = await getPublicMovies();
      const screenings = await getPublicScreenings({ theaterId: theaterId as string });
      
      if (screenings.length === 0) {
        setDateOptions([]);
        setMoviesOnSelectedDate([]);
        setLoadingMovies(false);
        return;
      }
      
      // Tạo 5 ngày tương lai bắt đầu từ ngày hiện tại
      const today = new Date();
      const dates = Array.from({ length: 5 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Định dạng ngày theo YYYY-MM-DD để so sánh với API
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        const dayOfWeek = ['CN', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7'][date.getDay()];
        
        return {
          id: dateString,
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          day: dayOfWeek,
          isToday: i === 0
        };
      });
      
      setDateOptions(dates);
      
      // Chọn ngày đầu tiên
      const firstDate = dates[0].id;
      setSelectedDate(firstDate);
      
      // Lọc suất chiếu cho ngày được chọn, có điều chỉnh múi giờ
      const firstDateScreenings = screenings.filter(s => {
        const screeningDate = new Date(s.startTime);
        const vietnamDate = new Date(screeningDate.getTime() + (7 * 60 * 60 * 1000));
        return vietnamDate.toISOString().split('T')[0] === firstDate;
      });
      
      // Nhóm suất chiếu theo phim
      const movieMap = new Map<string, { movie: Movie, screenings: Screening[], times: string[] }>();
      
      firstDateScreenings.forEach(screening => {
        const movieId = typeof screening.movieId === 'object' ? screening.movieId._id : screening.movieId;
        
        // Tìm phim
        const movie = movies.find(m => m._id === movieId);
        if (!movie) return;
        
        // Định dạng thời gian, điều chỉnh múi giờ đúng cách
        const screeningTime = formatScreeningTime(screening.startTime);
        
        // Thêm hoặc cập nhật map
        if (movieMap.has(movieId)) {
          const entry = movieMap.get(movieId)!;
          entry.screenings.push(screening);
          entry.times.push(screeningTime);
        } else {
          movieMap.set(movieId, {
            movie,
            screenings: [screening],
            times: [screeningTime]
          });
        }
      });
      
      // Chuyển đổi map thành mảng để render
      const result = Array.from(movieMap.values());
      setMoviesOnSelectedDate(result);
      
    } catch (err) {
      console.error('Error fetching movies and screenings:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  // Cập nhật phim khi thay đổi ngày được chọn
  const handleDateSelect = async (dateId: string) => {
    setSelectedDate(dateId);
    
    try {
      setLoadingMovies(true);
      
      const movies = await getPublicMovies();
      const screenings = await getPublicScreenings({ theaterId: theaterId as string });
      
      // Lọc suất chiếu cho ngày được chọn, có điều chỉnh múi giờ
      const dateScreenings = screenings.filter(s => {
        const screeningDate = new Date(s.startTime);
        const vietnamDate = new Date(screeningDate.getTime() + (7 * 60 * 60 * 1000));
        return vietnamDate.toISOString().split('T')[0] === dateId;
      });
      
      // Nhóm suất chiếu theo phim
      const movieMap = new Map<string, { movie: Movie, screenings: Screening[], times: string[] }>();
      
      dateScreenings.forEach(screening => {
        const movieId = typeof screening.movieId === 'object' ? screening.movieId._id : screening.movieId;
        
        // Tìm phim
        const movie = movies.find(m => m._id === movieId);
        if (!movie) return;
        
        // Định dạng thời gian với hàm mới
        const screeningTime = formatScreeningTime(screening.startTime);
        
        // Thêm hoặc cập nhật map
        if (movieMap.has(movieId)) {
          const entry = movieMap.get(movieId)!;
          entry.screenings.push(screening);
          entry.times.push(screeningTime);
        } else {
          movieMap.set(movieId, {
            movie,
            screenings: [screening],
            times: [screeningTime]
          });
        }
      });
      
      // Chuyển đổi map thành mảng để render
      const result = Array.from(movieMap.values());
      setMoviesOnSelectedDate(result);
      
    } catch (err) {
      console.error('Error updating movies for date:', err);
    } finally {
      setLoadingMovies(false);
    }
  };

  // Định dạng thời gian, điều chỉnh múi giờ đúng cách
  const formatScreeningTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    // Chỉ điều chỉnh múi giờ một lần
    const vietnamDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    // Format giờ:phút
    return vietnamDate.getUTCHours().toString().padStart(2, '0') + ':' + 
           vietnamDate.getUTCMinutes().toString().padStart(2, '0');
  };

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
            <Text style={styles.infoText}>{rooms.length || theater.screens || '7'} phòng chiếu</Text>
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

        {/* Lịch chiếu phim */}
        <View style={styles.showtimesSection}>
          <Text style={styles.sectionTitle}>Lịch chiếu phim</Text>
          
          {/* Date selection */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.dateScroll}
            contentContainerStyle={styles.dateScrollContent}
          >
            {dateOptions.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[
                  styles.dateCard,
                  selectedDate === date.id && styles.dateCardSelected,
                ]}
                onPress={() => handleDateSelect(date.id)}
              >
                <Text style={[
                  styles.dateDay,
                  selectedDate === date.id && styles.dateTextSelected,
                ]}>
                  {date.day}
                </Text>
                <Text style={[
                  styles.dateNumber,
                  selectedDate === date.id && styles.dateTextSelected,
                ]}>
                  {date.date}
                </Text>
                {date.isToday && (
                  <Text style={styles.todayText}>Hôm nay</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Movies list */}
          <View style={styles.moviesListContainer}>
            {loadingMovies ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Đang tải lịch chiếu...</Text>
              </View>
            ) : moviesOnSelectedDate.length === 0 ? (
              <Text style={styles.noMoviesText}>Không có phim chiếu vào ngày này.</Text>
            ) : (
              moviesOnSelectedDate.map((item) => (
                <View key={item.movie._id} style={styles.movieItem}>
                  <View style={styles.movieCard}>
                    <Image 
                      source={{ uri: item.movie.posterUrl }} 
                      style={styles.moviePoster}
                      resizeMode="cover"
                    />
                    <View style={styles.movieInfo}>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {item.movie.title}
                      </Text>
                      <View style={styles.movieMeta}>
                        <Text style={styles.movieDuration}>
                          {item.movie.duration} phút
                        </Text>
                        <View style={styles.ratingContainer}>
                          <Star size={12} color="#FFD700" />
                          <Text style={styles.ratingText}>{item.movie.rating || '7.5'}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.timesContainer}>
                        {item.times.map((time, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.timeChip}
                            onPress={() => {
                              const screening = item.screenings[index];
                              router.push({
                                pathname: '/seat-selection',
                                params: { screeningId: screening._id }
                              });
                            }}
                          >
                            <Text style={styles.timeChipText}>{time}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Secondary buttons */}
        <View style={styles.secondaryButtonsContainer}>
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
  imagePlaceholder: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
  },
  dateScroll: {
    marginBottom: 15,
  },
  dateScrollContent: {
    paddingVertical: 10,
  },
  dateCard: {
    backgroundColor: '#222222',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 60,
    // Thêm border để phân biệt rõ hơn
    borderWidth: 1,
    borderColor: '#333',
  },
  dateCardSelected: {
    backgroundColor: '#FFD700', // Màu vàng cho ngày được chọn
  },
  dateDay: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dateNumber: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dateTextSelected: {
    color: '#000000', // Chữ màu đen khi được chọn
  },
  todayText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    color: '#FFD700',
    marginTop: 4,
  },
  modalMoviesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMoviesText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    paddingVertical: 40,
  },
  movieItem: {
    marginBottom: 15,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  moviePoster: {
    width: 100,
    height: 150,
  },
  movieInfo: {
    flex: 1,
    padding: 12,
  },
  movieTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieDuration: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    color: '#AAAAAA',
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    color: '#FFD700',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  timeChipText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  showtimesSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  moviesListContainer: {
    marginTop: 10,
  },
  secondaryButtonsContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             