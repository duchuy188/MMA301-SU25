import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Dimensions, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Star, Crown, Clock, Search, Filter, MapPin, Ticket } from 'lucide-react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Movie, getPublicMovies } from '../../services/movie';
import { getTheaters, Theater } from '../../services/theater';
import { getAllPromotions, Promotion } from '../../services/promotion';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';


const { width: screenWidth } = Dimensions.get('window');


interface BannerItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  type: 'movie' | 'promotion' | 'theater';
  linkId?: string;
}

// Extract unique genres from movies
const extractGenres = (movies: Movie[]) => {
  const genreSet = new Set<string>();
  movies.forEach(movie => {
    const genres = movie.genre.split(', ');
    genres.forEach((genre: string) => genreSet.add(genre));
  });
  return Array.from(genreSet);
};


let cachedMovies: Movie[] = [];

// Thêm hàm shuffle này bên ngoài component
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function HomeScreen() {
  const [movies, setMovies] = useState<Movie[]>(cachedMovies);
  const [loading, setLoading] = useState(cachedMovies.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('nowShowing');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const flatListRef = useRef<FlatList>(null);

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

  // Fetch banners data
  useEffect(() => {
    const fetchBannerData = async () => {
      setLoadingBanners(true);
      try {
        // Tạo mảng banner từ nhiều nguồn dữ liệu
        const bannerItems: BannerItem[] = [];
        
        // 1. Lấy dữ liệu phim đang chiếu (2 slide)
        try {
          const moviesData = await getPublicMovies();
          // Lọc phim đang chiếu
          const nowShowingMovies = moviesData.filter(movie => movie.showingStatus === 'now-showing');
          
          if (nowShowingMovies.length > 0) {
            // Chọn ngẫu nhiên 2 phim đang chiếu
            const shuffledNowShowing = shuffleArray(nowShowingMovies);
            const randomNowShowing1 = shuffledNowShowing[0];
            bannerItems.push({
              id: `now-showing-${randomNowShowing1._id}`,
              imageUrl: randomNowShowing1.posterUrl,
              title: randomNowShowing1.vietnameseTitle || randomNowShowing1.title,
              description: `Đang chiếu • ${randomNowShowing1.duration} phút • ${randomNowShowing1.genre}`,
              type: 'movie',
              linkId: randomNowShowing1._id
            });
            
            // Thêm phim đang chiếu thứ 2 nếu có
            if (shuffledNowShowing.length > 1) {
              const randomNowShowing2 = shuffledNowShowing[1];
              bannerItems.push({
                id: `now-showing-${randomNowShowing2._id}`,
                imageUrl: randomNowShowing2.posterUrl,
                title: randomNowShowing2.vietnameseTitle || randomNowShowing2.title,
                description: `Đang chiếu • ${randomNowShowing2.duration} phút • ${randomNowShowing2.genre}`,
                type: 'movie',
                linkId: randomNowShowing2._id
              });
            }
          }
          
          // 2. Lấy dữ liệu phim sắp chiếu (2 slide)
          const comingSoonMovies = moviesData.filter(movie => movie.showingStatus === 'coming-soon');
          
          if (comingSoonMovies.length > 0) {
            // Chọn ngẫu nhiên 2 phim sắp chiếu
            const shuffledComingSoon = shuffleArray(comingSoonMovies);
            const randomComingSoon1 = shuffledComingSoon[0];
            bannerItems.push({
              id: `coming-soon-${randomComingSoon1._id}`,
              imageUrl: randomComingSoon1.posterUrl,
              title: randomComingSoon1.vietnameseTitle || randomComingSoon1.title,
              description: `Sắp chiếu • ${randomComingSoon1.duration} phút • ${randomComingSoon1.genre}`,
              type: 'movie',
              linkId: randomComingSoon1._id
            });
            
            // Thêm phim sắp chiếu thứ 2 nếu có
            if (shuffledComingSoon.length > 1) {
              const randomComingSoon2 = shuffledComingSoon[1];
              bannerItems.push({
                id: `coming-soon-${randomComingSoon2._id}`,
                imageUrl: randomComingSoon2.posterUrl,
                title: randomComingSoon2.vietnameseTitle || randomComingSoon2.title,
                description: `Sắp chiếu • ${randomComingSoon2.duration} phút • ${randomComingSoon2.genre}`,
                type: 'movie',
                linkId: randomComingSoon2._id
              });
            }
          }
        } catch (error) {
          console.error('Error fetching movies for banner:', error);
        }
        
        // 3. Lấy dữ liệu khuyến mãi (2 slide)
        try {
          const result = await getAllPromotions('approved');
          if (result.success && result.data && result.data.length > 0) {
            // Lọc ra các khuyến mãi còn hiệu lực
            const currentDate = new Date();
            const validPromotions = result.data.filter(promo => 
              new Date(promo.endDate) >= currentDate
            );
            
            if (validPromotions.length > 0) {
              // Chọn ngẫu nhiên 2 khuyến mãi
              const shuffledPromotions = shuffleArray(validPromotions);
              const randomPromotion1 = shuffledPromotions[0];
              bannerItems.push({
                id: `promo-${randomPromotion1._id}`,
                imageUrl: 'https://www.galaxycine.vn/media/2023/2/16/n3-glx-t2-2023-digital-1350x540_1676542684481.jpg',
                title: randomPromotion1.name,
                description: randomPromotion1.description,
                type: 'promotion',
                linkId: randomPromotion1._id
              });
              
              // Thêm khuyến mãi thứ 2 nếu có
              if (shuffledPromotions.length > 1) {
                const randomPromotion2 = shuffledPromotions[1];
                bannerItems.push({
                  id: `promo-${randomPromotion2._id}`,
                  imageUrl: 'https://www.galaxycine.vn/media/2023/7/10/1350x540_1688978822286.jpg',
                  title: randomPromotion2.name,
                  description: randomPromotion2.description,
                  type: 'promotion',
                  linkId: randomPromotion2._id
                });
              }
            }
          }
        } catch (error) {
          console.error('Error fetching promotions for banner:', error);
        }
        
        // 4. Lấy dữ liệu rạp (2 slide)
        try {
          const theaters = await getTheaters();
          if (theaters.length > 0) {
            // Chọn ngẫu nhiên 2 rạp
            const shuffledTheaters = shuffleArray(theaters);
            const randomTheater1 = shuffledTheaters[0];
            bannerItems.push({
              id: `theater-${randomTheater1._id}`,
              imageUrl: require('../../assets/images/theater/Nguyễn Văn Quá.jpg'),
              title: randomTheater1.name,
              description: randomTheater1.address,
              type: 'theater',
              linkId: randomTheater1._id
            });
            
            // Thêm rạp thứ 2 nếu có
            if (shuffledTheaters.length > 1) {
              const randomTheater2 = shuffledTheaters[1];
              bannerItems.push({
                id: `theater-${randomTheater2._id}`,
                imageUrl: require('../../assets/images/theater/Nguyễn Du.jpg'),
                title: randomTheater2.name,
                description: randomTheater2.address,
                type: 'theater',
                linkId: randomTheater2._id
              });
            }
          }
        } catch (error) {
          console.error('Error fetching theaters for banner:', error);
        }
        
        // Thêm dữ liệu mẫu nếu không đủ 8 banner
        const sampleBanners = [
          {
            id: 'now-showing-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/5/9/1350x540_1683618626275.jpg',
            title: 'Phim đang chiếu 1',
            description: 'Khám phá các phim đang chiếu tại rạp',
            type: 'movie'
          },
          {
            id: 'now-showing-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/5/9/1350x540_1683618626275.jpg',
            title: 'Phim đang chiếu 2',
            description: 'Khám phá các phim đang chiếu tại rạp',
            type: 'movie'
          },
          {
            id: 'coming-soon-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/6/5/banner-1350x540_1685949752401.jpg',
            title: 'Phim sắp chiếu 1',
            description: 'Đón chờ những bom tấn sắp ra mắt',
            type: 'movie'
          },
          {
            id: 'coming-soon-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/6/5/banner-1350x540_1685949752401.jpg',
            title: 'Phim sắp chiếu 2',
            description: 'Đón chờ những bom tấn sắp ra mắt',
            type: 'movie'
          },
          {
            id: 'promo-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/7/10/1350x540_1688978822286.jpg',
            title: 'Ngày tri ân 1',
            description: 'Giá vé chỉ 45k',
            type: 'promotion'
          },
          {
            id: 'promo-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/2/16/n3-glx-t2-2023-digital-1350x540_1676542684481.jpg',
            title: 'Ngày tri ân 2',
            description: 'Giá vé chỉ 55k',
            type: 'promotion'
          },
          {
            id: 'theater-sample-1',
            imageUrl: require('../../assets/images/theater/Nguyễn Văn Quá.jpg'),
            title: 'Galaxy Tân Bình',
            description: '246 Nguyễn Hồng Đào, Phường 13, Quận Tân Bình',
            type: 'theater'
          },
          {
            id: 'theater-sample-2',
            imageUrl: require('../../assets/images/theater/Nguyễn Du.jpg'),
            title: 'Galaxy Nguyễn Du',
            description: '116 Nguyễn Du, Quận 1, TP.HCM',
            type: 'theater'
          }
        ];
        
        // Thêm các banner mẫu nếu cần để đủ 8 banner
        while (bannerItems.length < 8) {
          const missingTypes = {
            movie: 4 - bannerItems.filter(item => item.type === 'movie').length,
            promotion: 2 - bannerItems.filter(item => item.type === 'promotion').length,
            theater: 2 - bannerItems.filter(item => item.type === 'theater').length
          };
          
          let typeToAdd: 'movie' | 'promotion' | 'theater';
          
          if (missingTypes.movie > 0) typeToAdd = 'movie';
          else if (missingTypes.promotion > 0) typeToAdd = 'promotion';
          else typeToAdd = 'theater';
          
          const sampleOfType = sampleBanners.filter(item => item.type === typeToAdd);
          if (sampleOfType.length > 0) {
            bannerItems.push(sampleOfType[0] as BannerItem);
            // Xóa item đã thêm khỏi mảng mẫu để không thêm lại
            const index = sampleBanners.indexOf(sampleOfType[0]);
            if (index > -1) {
              sampleBanners.splice(index, 1);
            }
          }
        }
        
        setBanners(bannerItems);
      } catch (error) {
        console.error('Error fetching banner data:', error);
        // Fallback với dữ liệu mẫu nếu có lỗi
        setBanners([
          {
            id: 'now-showing-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/5/9/1350x540_1683618626275.jpg',
            title: 'Phim đang chiếu 1',
            description: 'Khám phá các phim đang chiếu tại rạp',
            type: 'movie'
          },
          {
            id: 'now-showing-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/5/9/1350x540_1683618626275.jpg',
            title: 'Phim đang chiếu 2',
            description: 'Khám phá các phim đang chiếu tại rạp',
            type: 'movie'
          },
          {
            id: 'coming-soon-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/6/5/banner-1350x540_1685949752401.jpg',
            title: 'Phim sắp chiếu 1',
            description: 'Đón chờ những bom tấn sắp ra mắt',
            type: 'movie'
          },
          {
            id: 'coming-soon-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/6/5/banner-1350x540_1685949752401.jpg',
            title: 'Phim sắp chiếu 2',
            description: 'Đón chờ những bom tấn sắp ra mắt',
            type: 'movie'
          },
          {
            id: 'promo-sample-1',
            imageUrl: 'https://www.galaxycine.vn/media/2023/7/10/1350x540_1688978822286.jpg',
            title: 'Ngày tri ân 1',
            description: 'Giá vé chỉ 45k',
            type: 'promotion'
          },
          {
            id: 'promo-sample-2',
            imageUrl: 'https://www.galaxycine.vn/media/2023/2/16/n3-glx-t2-2023-digital-1350x540_1676542684481.jpg',
            title: 'Ngày tri ân 2',
            description: 'Giá vé chỉ 55k',
            type: 'promotion'
          },
          {
            id: 'theater-sample-1',
            imageUrl: require('../../assets/images/theater/Nguyễn Văn Quá.jpg'),
            title: 'Galaxy Tân Bình',
            description: '246 Nguyễn Hồng Đào, Phường 13, Quận Tân Bình',
            type: 'theater'
          },
          {
            id: 'theater-sample-2',
            imageUrl: require('../../assets/images/theater/Nguyễn Du.jpg'),
            title: 'Galaxy Nguyễn Du',
            description: '116 Nguyễn Du, Quận 1, TP.HCM',
            type: 'theater'
          }
        ]);
      } finally {
        setLoadingBanners(false);
      }
    };

    fetchBannerData();
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    if (banners.length > 0 && !loadingBanners) {
      intervalId = setInterval(() => {
        if (flatListRef.current) {
          const nextSlide = (activeSlide + 1) % banners.length;
          flatListRef.current.scrollToOffset({
            offset: nextSlide * screenWidth,
            animated: true
          });
          setActiveSlide(nextSlide);
        }
      }, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeSlide, banners.length, loadingBanners]);

  const handleBannerPress = (banner: BannerItem) => {
    if (banner.type === 'movie' && banner.linkId) {
      router.push({
        pathname: '/movie-detail',
        params: { movieId: banner.linkId },
      });
    } else if (banner.type === 'promotion') {
      router.push('/offers');
    } else if (banner.type === 'theater' && banner.linkId) {
      router.push({
        pathname: '/theater-detail',
        params: { theaterId: banner.linkId },
      });
    }
  };

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
                  <Text style={styles.ratingSmall}>{movie.rating || '7.5'}</Text>
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

  // Render banner carousel
  const renderBanner = () => {
    if (loadingBanners) {
      return (
        <View style={styles.bannerLoadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      );
    }

    return (
      <View style={styles.bannerOuterContainer}>
        <View style={styles.bannerContainer}>
          <FlatList
            ref={flatListRef}
            data={banners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToAlignment="center"
            snapToInterval={screenWidth}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 0 }}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / screenWidth
              );
              setActiveSlide(slideIndex);
            }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity 
                  style={[
                    styles.bannerItem, 
                    { 
                      borderColor: '#FFD700', 
                      borderWidth: 2, 
                      borderRadius: 12,
                      width: screenWidth - 40,
                      marginHorizontal: 0
                    }
                  ]} 
                  onPress={() => handleBannerPress(item)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl} 
                    style={[styles.bannerImage, { borderRadius: 10 }]}
                    resizeMode="cover"
                  />
                  
                  {item.type === 'movie' && item.id.includes('now-showing') && (
                    <View style={[styles.movieStatusBadge, { backgroundColor: '#4CAF50' }]}>
                      <Text style={styles.movieStatusText}>ĐANG CHIẾU</Text>
                    </View>
                  )}
                  {item.type === 'movie' && item.id.includes('coming-soon') && (
                    <View style={[styles.movieStatusBadge, { backgroundColor: '#FF6B6B' }]}>
                      <Text style={styles.movieStatusText}>SẮP CHIẾU</Text>
                    </View>
                  )}
                  
                  <View style={styles.bannerOverlay}>
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTitle}>{item.title}</Text>
                      <Text style={styles.bannerDescription}>{item.description}</Text>
                    </View>
                    <View style={styles.bannerTypeContainer}>
                      {item.type === 'movie' && (
                        <View style={styles.bannerType}>
                          <Ticket size={14} color="#FFFFFF" />
                          <Text style={styles.bannerTypeText}>Phim</Text>
                        </View>
                      )}
                      {item.type === 'promotion' && (
                        <View style={styles.bannerType}>
                          <Crown size={14} color="#FFFFFF" />
                          <Text style={styles.bannerTypeText}>Khuyến mãi</Text>
                        </View>
                      )}
                      {item.type === 'theater' && (
                        <View style={styles.bannerType}>
                          <MapPin size={14} color="#FFFFFF" />
                          <Text style={styles.bannerTypeText}>Rạp</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.paginationContainer}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeSlide === index && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Chào mừng đến với</Text>
        <Text style={styles.brandText}>GALAXY CINEMA</Text>
      </View>

      {/* Banner Carousel */}
      {renderBanner()}

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
  bannerContainer: {
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 0,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  bannerLoadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerItem: {
    width: '100%',
    height: 180,
    position: 'relative',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bannerContent: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    color: '#CCCCCC',
  },
  bannerTypeContainer: {
    alignItems: 'flex-end',
  },
  bannerType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  bannerTypeText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 3,
  },
  paginationDotActive: {
    backgroundColor: '#FFD700',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bannerOuterContainer: {
    marginHorizontal: 0,
    marginBottom: 20,
    borderRadius: 14,
    padding: 0,
    backgroundColor: '#000',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  movieStatusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    opacity: 0.9,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  movieStatusText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
});