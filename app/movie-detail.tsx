import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Clock, Calendar, Crown, Play } from 'lucide-react-native';

export default function MovieDetailScreen() {
  const { movieId } = useLocalSearchParams();

  const movie = {
    id: movieId,
    title: 'Avengers: Endgame',
    image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600',
    rating: 9.2,
    duration: '181 phút',
    genre: 'Hành động, Phiêu lưu',
    director: 'Anthony Russo, Joe Russo',
    cast: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
    description: 'Sau những sự kiện tàn khốc của Infinity War, vũ trụ đang trong tình trạng hủy diệt. Với sự giúp đỡ của các đồng minh còn lại, các Avengers phải tập hợp một lần nữa để đảo ngược hành động của Thanos và khôi phục lại trật tự cho vũ trụ.',
    isVIP: true,
  };

  const handleBookTicket = () => {
    router.push('/cinema-selection');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết phim</Text>
      </View>

      <View style={styles.moviePoster}>
        <View style={styles.goldFrame}>
          <Image source={{ uri: movie.image }} style={styles.posterImage} />
          {movie.isVIP && (
            <View style={styles.vipBadge}>
              <Crown size={16} color="#000000" />
              <Text style={styles.vipText}>Suất chiếu đặc biệt</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{movie.title}</Text>
        
        <View style={styles.movieMeta}>
          <View style={styles.metaItem}>
            <Star size={16} color="#FFD700" />
            <Text style={styles.rating}>{movie.rating}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color="#666" />
            <Text style={styles.duration}>{movie.duration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#666" />
            <Text style={styles.genre}>{movie.genre}</Text>
          </View>
        </View>

        <View style={styles.movieDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đạo diễn:</Text>
            <Text style={styles.detailValue}>{movie.director}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Diễn viên:</Text>
            <Text style={styles.detailValue}>{movie.cast}</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>Nội dung phim</Text>
          <Text style={styles.descriptionText}>{movie.description}</Text>
        </View>

        <View style={styles.trailerSection}>
          <TouchableOpacity style={styles.trailerButton}>
            <Play size={20} color="#000000" />
            <Text style={styles.trailerButtonText}>Xem trailer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBookTicket}>
          <Text style={styles.bookButtonText}>ĐẶT VÉ</Text>
        </TouchableOpacity>
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
  moviePoster: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  goldFrame: {
    position: 'relative',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  posterImage: {
    width: 250,
    height: 350,
    resizeMode: 'cover',
  },
  vipBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vipText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#000000',
  },
  movieInfo: {
    paddingHorizontal: 20,
  },
  movieTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  movieMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 30,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rating: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  duration: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999',
  },
  genre: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#999',
  },
  movieDetails: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFD700',
    width: 80,
  },
  detailValue: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  description: {
    marginBottom: 30,
  },
  descriptionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    color: '#FFD700',
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  trailerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  trailerButtonText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#000000',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  bookButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  bookButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#000000',
    letterSpacing: 1,
  },
});