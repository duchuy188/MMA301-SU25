import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Star, Crown, Clock } from 'lucide-react-native';

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

export default function HomeScreen() {
  const handleMoviePress = (movie: any) => {
    router.push({
      pathname: '/movie-detail',
      params: { movieId: movie.id },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Chào mừng đến với</Text>
        <Text style={styles.brandText}>GALAXY CINEMA</Text>
      </View>

      {/* Featured Movies Carousel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phim nổi bật</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
          {featuredMovies.map((movie) => (
            <TouchableOpacity
              key={movie.id}
              style={styles.featuredCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.goldFrame}>
                <Image source={{ uri: movie.image }} style={styles.featuredImage} />
                {movie.isVIP && (
                  <View style={styles.vipBadge}>
                    <Crown size={12} color="#000000" />
                    <Text style={styles.vipText}>VIP</Text>
                  </View>
                )}
              </View>
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <View style={styles.movieMeta}>
                  <Star size={14} color="#FFD700" />
                  <Text style={styles.rating}>{movie.rating}</Text>
                  <Clock size={14} color="#666" />
                  <Text style={styles.duration}>{movie.duration}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Now Showing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đang chiếu</Text>
        <View style={styles.moviesGrid}>
          {nowShowingMovies.map((movie) => (
            <TouchableOpacity
              key={movie.id}
              style={styles.movieCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.movieImageContainer}>
                <Image source={{ uri: movie.image }} style={styles.movieImage} />
                {movie.isVIP && (
                  <View style={styles.vipBadgeSmall}>
                    <Crown size={10} color="#000000" />
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
          ))}
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sắp chiếu</Text>
        <View style={styles.moviesGrid}>
          {featuredMovies.slice(0, 4).map((movie) => (
            <TouchableOpacity
              key={`coming-${movie.id}`}
              style={styles.movieCard}
              onPress={() => handleMoviePress(movie)}
            >
              <View style={styles.movieImageContainer}>
                <Image source={{ uri: movie.image }} style={styles.movieImage} />
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Sắp chiếu</Text>
                </View>
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
          ))}
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  carousel: {
    paddingLeft: 20,
  },
  featuredCard: {
    marginRight: 15,
    width: 200,
  },
  goldFrame: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  featuredImage: {
    width: '100%',
    height: 280,
    resizeMode: 'cover',
  },
  vipBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vipText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#000000',
  },
  movieInfo: {
    marginTop: 10,
  },
  movieTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    color: '#FFD700',
  },
  duration: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#666',
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
});