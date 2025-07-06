import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Star, Crown, Clock, Search, Filter } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Movie, getPublicMovies, getMoviesByStatus } from '../../services/movie';

// Extract unique genres from movies
const extractGenres = (movies: Movie[]) => {
  const genreSet = new Set<string>();
  movies.forEach(movie => {
    const genres = movie.genre.split(', ');
    genres.forEach((genre: string) => genreSet.add(genre));
  });
  return Array.from(genreSet);
};

// Ở ngoài component, tạo biến lưu trữ dữ liệu
let cachedMovies: Movie[] = [];

export default function HomeScreen() {
  const [movies, setMovies] = useState<Movie[]>(cachedMovies);
  const [loading, setLoading] = useState(cachedMovies.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('nowShowing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Fetch movies when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchMovies = async () => {
        // Chỉ tải dữ liệu khi cache rỗng
        if (cachedMovies.length === 0) {
          setLoading(true);
          try {
            const data = await getPublicMovies();
            setMovies(data);
            cachedMovies = data; // Lưu vào cache
            setError(null);
          } catch (err) {
            setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
            console.error('Error fetching movies:', err);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchMovies();
    }, [])
  );

  const handleMoviePress = (movie: Movie) => {
    router.push({
      pathname: '/movie-detail',
      params: { movieId: movie._id },
    });
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const clearFilters = () => {
    setSelectedGenres([]);
  };

  // Separate movies into "now showing" and "coming soon" based on showingStatus
  const nowShowingMovies = movies.filter(movie => movie.showingStatus === 'now-showing');
  const comingSoonMovies = movies.filter(movie => movie.showingStatus === 'coming-soon');
  
  // Extract all genres from both movie lists
  const allGenres = extractGenres([...nowShowingMovies, ...comingSoonMovies]);

  const renderMovieGrid = (movies: Movie[], isComingSoon = false) => {
    let filteredMovies = movies;
    
    // Apply text search filter
    if (searchQuery.trim()) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply genre filters
    if (selectedGenres.length > 0) {
      filteredMovies = filteredMovies.filter(movie => {
        const movieGenres = movie.genre.split(', ');
        return selectedGenres.some(genre => movieGenres.includes(genre));
      });
    }
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              getPublicMovies()
                .then(data => {
                  setMovies(data);
                  setError(null);
                })
                .catch(err => {
                  setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
                })
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.moviesGrid}>
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <TouchableOpacity
              key={isComingSoon ? `coming-${movie._id}` : movie._id}
              style={styles.movieCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.movieImageContainer}>
                <Image source={{ uri: movie.posterUrl }} style={styles.movieImage} />
              </View>
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitleSmall} numberOfLines={2}>
                  {movie.vietnameseTitle || movie.title}
                </Text>
                <Text style={styles.movieGenre} numberOfLines={1}>
                  {movie.genre}
                </Text>
                <View style={styles.movieMetaSmall}>
                  <Star size={12} color="#FFD700" />
                  <Text style={styles.ratingSmall}>{movie.rating || 'N/A'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>Không tìm thấy phim phù hợp</Text>
          </View>
        )}
      </View>
    );
  };

  // Thêm hàm refresh để tải lại dữ liệu khi cần
  const refreshMovies = async () => {
    setLoading(true);
    try {
      const data = await getPublicMovies();
      setMovies(data);
      cachedMovies = data;
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách phim. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Chào mừng đến với</Text>
        <Text style={styles.brandText}>GALAXY CINEMA</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm phim..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Filter size={20} color={showFilters || selectedGenres.length > 0 ? "#FFD700" : "#666"} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Lọc theo thể loại</Text>
            {selectedGenres.length > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearFilters}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.genreContainer}>
            {allGenres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreTag,
                  selectedGenres.includes(genre) && styles.selectedGenreTag
                ]}
                onPress={() => toggleGenre(genre)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selectedGenres.includes(genre) && styles.selectedGenreText
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nowShowing' && styles.activeTabButton]}
          onPress={() => setActiveTab('nowShowing')}
        >
          <Text style={[styles.tabText, activeTab === 'nowShowing' && styles.activeTabText]}>
            Đang chiếu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'comingSoon' && styles.activeTabButton]}
          onPress={() => setActiveTab('comingSoon')}
        >
          <Text style={[styles.tabText, activeTab === 'comingSoon' && styles.activeTabText]}>
            Sắp chiếu
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on active tab */}
      <View style={styles.section}>
        {activeTab === 'nowShowing' ? (
          renderMovieGrid(nowShowingMovies)
        ) : (
          renderMovieGrid(comingSoonMovies, true)
        )}
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
    paddingTop: 40,
    paddingBottom: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    color: '#F7E7CE',
    opacity: 0.9,
  },
  brandText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#FFD700',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },
  filtersContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  clearFilters: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedGenreTag: {
    backgroundColor: '#FFD700',
  },
  genreText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  selectedGenreText: {
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  activeTabButton: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFD700',
  },
  activeTabText: {
    color: '#000000',
  },
  section: {
    marginBottom: 30,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  movieCard: {
    width: '48%',
    marginBottom: 20,
  },
  movieImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  movieImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  comingSoonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#FFD700',
  },
  movieDetails: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  movieTitleSmall: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  movieGenre: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  movieMetaSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingSmall: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    color: '#FFD700',
  },
  noResultsContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 10,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
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