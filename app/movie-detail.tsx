import { View, StyleSheet, ScrollView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Movie, getMovieById } from '../services/movie';
import MovieView from './components/MovieView';
import MovieReviewComponent from './components/MovieReview';

export default function MovieDetailScreen() {
  const { movieId } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMovie = async () => {
      if (!movieId) return;
      
      try {
        setLoading(true);
        const movieData = await getMovieById(movieId as string);
        setMovie(movieData);
        setError(null);
      } catch (err) {
        setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
        console.error('Error loading movie:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [movieId]);

  const handleRatingUpdate = (newRating: number, newVotes: number) => {
    if (movie) {
      setMovie({
        ...movie,
        rating: newRating,
        votes: newVotes
      });
    }
  };
  
  // Hàm định dạng ngày tháng từ ISO sang DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    // Cắt bỏ phần thời gian (giữ lại chỉ phần ngày)
    const date = new Date(dateString);
    
    // Định dạng theo DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
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

  return (
    <ScrollView style={styles.container}>
      <MovieView 
        movie={movie} 
        onBack={() => router.back()} 
      />
      <MovieReviewComponent 
        movieId={movieId as string}
        onRatingUpdate={handleRatingUpdate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
});