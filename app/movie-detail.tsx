import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Clock, Calendar, Play } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Movie, getMovieById } from '../services/movie';
import * as WebBrowser from 'expo-web-browser';
import YoutubePlayer from 'react-native-youtube-iframe';

export default function MovieDetailScreen() {
  const { movieId } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;
      
      try {
        setLoading(true);
        const data = await getMovieById(movieId as string);
        setMovie(data);
      } catch (err) {
        setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  const handleBookTicket = () => {
    router.push('/cinema-selection');
  };

  // Tạo hàm để chuyển đổi URL YouTube thành embed URL
  const getYoutubeEmbedUrl = (url: string) => {
    // Trích xuất ID video từ URL YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    
    if (videoId) {
      // Trả về URL embed
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url; // Trả về URL gốc nếu không phải YouTube
  };

  // Hàm trích xuất ID video YouTube
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Đang tải thông tin phim...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin phim'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            if (movieId) {
              setLoading(true);
              getMovieById(movieId as string)
                .then(data => {
                  setMovie(data);
                  setError(null);
                })
                .catch(err => {
                  setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
                })
                .finally(() => setLoading(false));
            }
          }}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tính thời lượng phim theo định dạng "X phút"
  const formattedDuration = `${movie.duration} phút`;

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
          <Image source={{ uri: movie.posterUrl }} style={styles.posterImage} />
        </View>
      </View>

      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle}>{movie.vietnameseTitle || movie.title}</Text>
        
        <View style={styles.movieMeta}>
          <View style={styles.metaItem}>
            <Star size={16} color="#FFD700" />
            <Text style={styles.rating}>{movie.rating || 'N/A'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={16} color="#666" />
            <Text style={styles.duration}>{formattedDuration}</Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#666" />
            <Text style={styles.genre}>{movie.genre}</Text>
          </View>
        </View>

        <View style={styles.movieDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Đạo diễn:</Text>
            <Text style={styles.detailValue}>{movie.directors?.join(', ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Diễn viên:</Text>
            <Text style={styles.detailValue}>{movie.actors?.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>Nội dung phim</Text>
          <Text style={styles.descriptionText}>{movie.description}</Text>
        </View>

        {movie.trailerUrl && (
          <View style={styles.trailerSection}>
            <TouchableOpacity 
              style={styles.trailerButton}
              onPress={() => setTrailerModalVisible(true)}
            >
              <Play size={20} color="#000000" />
              <Text style={styles.trailerButtonText}>Xem trailer</Text>
            </TouchableOpacity>
            
            <Modal
              animationType="slide"
              transparent={true}
              visible={trailerModalVisible}
              onRequestClose={() => {
                setTrailerModalVisible(false);
                setPlaying(false);
              }}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Trailer</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setTrailerModalVisible(false);
                        setPlaying(false);
                      }}
                    >
                      <Text style={{color: '#FFD700', fontSize: 16}}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {movie.trailerUrl && (
                    <YoutubePlayer
                      height={220}
                      play={playing}
                      videoId={getYoutubeVideoId(movie.trailerUrl) || ''}
                      onChangeState={(event: string) => {
                        if (event === 'ended') {
                          setPlaying(false);
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            </Modal>
          </View>
        )}
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
  videoContainer: {
    width: '100%',
    height: 220,
    marginBottom: 10,
  },
  webView: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 0,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
});