import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking, Modal, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star, Clock, Calendar, Play } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Movie, getMovieById, MovieReview, saveMovieReview, getMovieReviews, getUserReview, calculateAverageRating } from '../services/movie';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../services/auth';
import Toast from 'react-native-toast-message';
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
  
  // Review states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [tempRating, setTempRating] = useState(0); // Thêm state mới để lưu rating tạm thời
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [userReview, setUserReview] = useState<MovieReview | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isEditingRating, setIsEditingRating] = useState(false);

  // Load saved rating from AsyncStorage when component mounts
  useEffect(() => {
    const loadSavedRating = async () => {
      try {
        const savedRating = await AsyncStorage.getItem(`movie_rating_${movieId}`);
        if (savedRating) {
          const parsedRating = parseInt(savedRating);
          setRating(parsedRating);
          setTempRating(parsedRating);
        }
      } catch (error) {
        console.error('Error loading saved rating:', error);
      }
    };
    loadSavedRating();
  }, [movieId]);

  // Save rating to AsyncStorage
  const saveRating = async (newRating: number) => {
    try {
      if (newRating === 0) {
        await AsyncStorage.removeItem(`movie_rating_${movieId}`);
      } else {
        await AsyncStorage.setItem(`movie_rating_${movieId}`, newRating.toString());
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  // Load movie details and reviews
  useEffect(() => {
    const loadMovieAndReviews = async () => {
      if (!movieId) return;
      
      try {
        setLoading(true);
        
        // Load movie details
        const movieData = await getMovieById(movieId as string);
        
        // Load all reviews for this movie
        const movieReviews = await getMovieReviews(movieId as string);
        setReviews(movieReviews);
        
        // Calculate average rating
        if (movieReviews.length > 0) {
          const avgRating = calculateAverageRating(movieReviews);
          movieData.rating = avgRating;
          movieData.votes = movieReviews.length;
        }
        
        setMovie(movieData);
        
        // Load current user's review if exists
        const currentUser = getCurrentUser();
        if (currentUser) {
          const userReviewData = await getUserReview(currentUser._id, movieId as string);
          if (userReviewData) {
            setUserReview(userReviewData);
          }
        }
      } catch (err) {
        setError('Không thể tải thông tin phim. Vui lòng thử lại sau.');
        console.error('Error loading movie and reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMovieAndReviews();
  }, [movieId]);

  const handleBookTicket = () => {
    router.push({
      pathname: '/cinema-selection',
      params: { movieId: movieId }
    });
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

  const handleSubmitRating = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !movieId) {
      Toast.show({
        type: 'error',
        text1: 'Bạn cần đăng nhập để đánh giá',
        visibilityTime: 3000,
      });
      return;
    }

    if (tempRating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn số sao',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const userJson = await AsyncStorage.getItem('auth_user');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      if (!userData) {
        Toast.show({
          type: 'error',
          text1: 'Không thể lấy thông tin người dùng',
          text2: 'Vui lòng đăng nhập lại',
          visibilityTime: 3000,
        });
        return;
      }

      // Get the user's existing review if any
      const existingReview = reviews.find(review => review.userId === currentUser._id);

      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId as string,
        rating: tempRating,
        comment: existingReview ? existingReview.comment : '',
        userName: userData.name,
        userEmail: userData.email,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        const updatedReviews = await getMovieReviews(movieId as string);
        setReviews(updatedReviews);
        setUserReview(review);
        
        if (movie) {
          const avgRating = calculateAverageRating(updatedReviews);
          setMovie({
            ...movie,
            rating: avgRating,
            votes: updatedReviews.length
          });
        }
        
        setShowRatingModal(false);
        setRating(tempRating);
        setIsEditingRating(false);
        
        Toast.show({
          type: 'success',
          text1: isEditingRating ? 'Cập nhật đánh giá thành công' : 'Đánh giá thành công',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể lưu đánh giá',
        text2: 'Vui lòng thử lại sau',
        visibilityTime: 3000,
      });
    }
  };

  const handleSubmitComment = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !movieId) {
      Toast.show({
        type: 'error',
        text1: 'Bạn cần đăng nhập để bình luận',
        visibilityTime: 3000,
      });
      return;
    }

    if (!comment.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập bình luận',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const userJson = await AsyncStorage.getItem('auth_user');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      if (!userData) {
        Toast.show({
          type: 'error',
          text1: 'Không thể lấy thông tin người dùng',
          text2: 'Vui lòng đăng nhập lại',
          visibilityTime: 3000,
        });
        return;
      }

      // Get the user's existing rating from AsyncStorage
      const savedRating = await AsyncStorage.getItem(`movie_rating_${movieId}`);
      const currentRating = savedRating ? parseInt(savedRating) : 0;

      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId as string,
        rating: currentRating,
        comment: comment.trim(),
        userName: userData.name,
        userEmail: userData.email,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        // After successful comment submission, remove the rating from AsyncStorage
        await AsyncStorage.removeItem(`movie_rating_${movieId}`);
        setRating(0);
        setTempRating(0);
        
        const updatedReviews = await getMovieReviews(movieId as string);
        setReviews(updatedReviews);
        setUserReview(review);
        
        setShowCommentModal(false);
        setComment('');
        
        Toast.show({
          type: 'success',
          text1: 'Bình luận thành công',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể lưu bình luận',
        text2: 'Vui lòng thử lại sau',
        visibilityTime: 3000,
      });
    }
  };

  const handleRatingButtonClick = () => {
    const currentUser = getCurrentUser();
    const userRating = reviews.find(review => review.userId === currentUser?._id && review.rating > 0);
    
    if (userRating) {
      setTempRating(userRating.rating);
      setIsEditingRating(true);
    } else {
      setTempRating(0);
      setIsEditingRating(false);
    }
    
    setShowRatingModal(true);
  };

  const handleUpdateRating = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !movieId) return;

    if (tempRating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn số sao',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const userJson = await AsyncStorage.getItem('auth_user');
      const userData = userJson ? JSON.parse(userJson) : null;
      
      if (!userData) {
        Toast.show({
          type: 'error',
          text1: 'Không thể lấy thông tin người dùng',
          text2: 'Vui lòng đăng nhập lại',
          visibilityTime: 3000,
        });
        return;
      }

      // Create a new rating review without affecting existing comments
      const ratingReview: MovieReview = {
        userId: currentUser._id,
        movieId: movieId as string,
        rating: tempRating,
        comment: '', // No comment for pure rating updates
        userName: userData.name,
        userEmail: userData.email,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(ratingReview);
      if (success) {
        // Get all reviews to update the average rating
        const allReviews = await getMovieReviews(movieId as string);
        
        // Calculate new average rating including all ratings (with and without comments)
        if (movie) {
          const avgRating = calculateAverageRating(allReviews);
          setMovie({
            ...movie,
            rating: avgRating,
            votes: allReviews.filter(r => r.rating > 0).length
          });
        }
        
        // Save current rating to AsyncStorage for future comments
        await AsyncStorage.setItem(`movie_rating_${movieId}`, tempRating.toString());
        setRating(tempRating);
        setShowRatingModal(false);
        
        Toast.show({
          type: 'success',
          text1: 'Cập nhật đánh giá thành công',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể cập nhật đánh giá',
        text2: 'Vui lòng thử lại sau',
        visibilityTime: 3000,
      });
    }
  };

  const handleRemoveRating = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !movieId) return;

    try {
      // Create a review with 0 rating to remove the rating
      const ratingReview: MovieReview = {
        userId: currentUser._id,
        movieId: movieId as string,
        rating: 0,
        comment: '', // No comment for rating removal
        userName: '',
        userEmail: '',
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(ratingReview);
      if (success) {
        // Get all reviews to update the average rating
        const allReviews = await getMovieReviews(movieId as string);
        
        // Update movie rating without the removed rating
        if (movie) {
          const avgRating = calculateAverageRating(allReviews.filter(r => r.rating > 0));
          setMovie({
            ...movie,
            rating: avgRating,
            votes: allReviews.filter(r => r.rating > 0).length
          });
        }
        
        // Remove rating from AsyncStorage
        await AsyncStorage.removeItem(`movie_rating_${movieId}`);
        setRating(0);
        setTempRating(0);
        setShowRatingModal(false);
        
        Toast.show({
          type: 'success',
          text1: 'Đã xóa đánh giá',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể xóa đánh giá',
        text2: 'Vui lòng thử lại sau',
        visibilityTime: 3000,
      });
    }
  };

  const handleCommentButtonClick = () => {
    setComment('');
    setIsAnonymous(false);
    setShowCommentModal(true);
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
            <Text style={styles.rating}>{movie.rating ? movie.rating.toFixed(1) : '0.0'}</Text>
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

      {/* Review Section */}
      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Đánh giá và Bình luận</Text>
        
        {getCurrentUser() ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.ratingButton]}
              onPress={handleRatingButtonClick}
            >
              <Star size={20} color="#000" />
              <Text style={styles.actionButtonText}>Đánh giá</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.commentButton]}
              onPress={handleCommentButtonClick}
            >
              <Text style={styles.actionButtonText}>Viết bình luận</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.reviewButtonText}>Đăng nhập để đánh giá và bình luận</Text>
          </TouchableOpacity>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviews
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .filter(review => review.comment && review.comment.trim() !== '') // Only show reviews with comments
            .map((review, index) => {
              const currentUser = getCurrentUser();
              const isCurrentUserReview = currentUser && review.userId === currentUser._id;

              return (
                <View key={index} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <View style={styles.userNameContainer}>
                        <Text style={styles.userIcon}>👤</Text>
                        <Text style={styles.reviewerName} numberOfLines={1}>
                          {review.userName}
                        </Text>
                      </View>
                      <Text style={styles.reviewerEmail} numberOfLines={1}>
                        {review.userEmail}
                      </Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    {review.rating > 0 && (
                      <View style={styles.ratingContainer}>
                        <Star size={16} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{review.rating}/10</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.reviewComment}>
                    💬 {review.comment}
                  </Text>
                </View>
              );
            })}
        </View>
      </View>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, styles.ratingModalContent]}>
            <Text style={[styles.modalTitle, styles.ratingModalTitle]}>
              Chỉnh sửa đánh giá
            </Text>
            
            {/* Rating Stars */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setTempRating(star)}
                >
                  <Star
                    size={24}
                    color="#FFD700"
                    fill={star <= tempRating ? "#FFD700" : "none"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>{tempRating}/10</Text>

            {/* Buttons */}
            <View style={styles.ratingModalButtons}>
              <TouchableOpacity
                style={styles.ratingRemoveButton}
                onPress={handleRemoveRating}
              >
                <Text style={styles.ratingButtonText}>Xóa đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ratingSendButton}
                onPress={handleUpdateRating}
              >
                <Text style={styles.ratingButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Viết bình luận</Text>

            {/* Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Viết bình luận của bạn..."
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />

            {/* Anonymous Option */}
            <TouchableOpacity
              style={styles.anonymousOption}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.anonymousText}>Bình luận ẩn danh</Text>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setIsAnonymous(false);
                }}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitComment}
              >
                <Text style={styles.buttonText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  reviewSection: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    marginTop: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  reviewButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    flex: 1, // Cho phép text co giãn
  },
  reviewerInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewComment: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Montserrat-Regular',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  submitButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '80%', // Giới hạn chiều rộng để tránh tràn
  },
  userIcon: {
    fontSize: 16,
  },
  reviewerEmail: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 2,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  anonymousText: {
    color: '#fff',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  ratingButton: {
    backgroundColor: '#FFD700',
  },
  commentButton: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    marginTop: 20,
  },
  ratingsSection: {
    marginBottom: 24,
  },
  commentsSection: {
    marginBottom: 24,
  },
  ratingModalContent: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  ratingModalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingAnonymousText: {
    color: '#FFFFFF',
  },
  ratingModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  ratingCancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingSendButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingRemoveButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});