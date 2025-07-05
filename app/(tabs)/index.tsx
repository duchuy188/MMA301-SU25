import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Star, Crown, Clock, Search, Filter } from 'lucide-react-native';
import { useState } from 'react';

const featuredMovies = [
  {
    id: '1',
    title: 'Avengers: Endgame',
    image: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
    rating: 9.2,
    duration: '181 phút',
    genre: 'Hành động, Phiêu lưu',
    isVIP: true,
  },
  {
    id: '2',
    title: 'The Batman',
    image: 'https://images.pexels.com/photos/7991472/pexels-photo-7991472.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
    rating: 8.8,
    duration: '176 phút',
    genre: 'Hành động, Tâm lý',
    isVIP: false,
  },
  {
    id: '3',
    title: 'Dune: Part Two',
    image: 'https://images.pexels.com/photos/7991464/pexels-photo-7991464.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
    rating: 9.0,
    duration: '166 phút',
    genre: 'Khoa học viễn tưởng',
    isVIP: true,
  },
];

const nowShowingMovies = [
  ...featuredMovies,
  {
    id: '4',
    title: 'Spider-Man: No Way Home',
    image: 'https://images.pexels.com/photos/7991583/pexels-photo-7991583.jpeg?auto=compress&cs=tinysrgb&w=300&h=400',
    rating: 8.9,
    duration: '148 phút',
    genre: 'Hành động, Phiêu lưu',
    isVIP: false,
  },
];

// Extract unique genres from movies
const extractGenres = (movies: any[]) => {
  const genreSet = new Set<string>();
  movies.forEach(movie => {
    const genres = movie.genre.split(', ');
    genres.forEach((genre: string) => genreSet.add(genre));
  });
  return Array.from(genreSet);
};

const allGenres = extractGenres([...nowShowingMovies, ...featuredMovies]);

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState('nowShowing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleMoviePress = (movie: any) => {
    router.push({
      pathname: '/movie-detail',
      params: { movieId: movie.id },
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

  const renderMovieGrid = (movies: any[], isComingSoon = false) => {
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
    
    return (
      <View style={styles.moviesGrid}>
        {filteredMovies.length > 0 ? (
          filteredMovies.map((movie) => (
            <TouchableOpacity
              key={isComingSoon ? `coming-${movie.id}` : movie.id}
              style={styles.movieCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.movieImageContainer}>
                <Image source={{ uri: movie.image }} style={styles.movieImage} />
                {movie.isVIP && !isComingSoon && (
                  <View style={styles.vipBadgeSmall}>
                    <Crown size={10} color="#000000" />
                  </View>
                )}
                {isComingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Sắp chiếu</Text>
                  </View>
                )}
              </View>
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitleSmall} numberOfLines={2}>
                  {movie.title}
                </Text>
                <Text style={styles.movieGenre} numberOfLines={1}>
                  {movie.genre}
                </Text>
                <View style={styles.movieMetaSmall}>
                  <Star size={12} color="#FFD700" />
                  <Text style={styles.ratingSmall}>{movie.rating}</Text>
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
          renderMovieGrid(featuredMovies.slice(0, 4), true)
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
  vipBadgeSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFD700',
    padding: 4,
    borderRadius: 8,
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
});