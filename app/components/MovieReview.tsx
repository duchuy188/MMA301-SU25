import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { MovieReview, saveMovieReview, getMovieReviews, getUserReview, calculateAverageRating, getCurrentRatings } from '../../services/movie';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../../services/auth';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

interface MovieReviewProps {
  movieId: string;
  onRatingUpdate: (newRating: number, newVotes: number) => void;
}

export default function MovieReviewComponent({ movieId, onRatingUpdate }: MovieReviewProps) {
  // Review states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [tempRating, setTempRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [userReview, setUserReview] = useState<MovieReview | null>(null);
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [showAllCommentsModal, setShowAllCommentsModal] = useState(false);

  // Load saved rating from AsyncStorage when component mounts
  useEffect(() => {
    const loadSavedRating = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const ratingKey = `movie_rating_${movieId}_${currentUser._id}`;
          const savedRating = await AsyncStorage.getItem(ratingKey);
          if (savedRating) {
            const parsedRating = parseInt(savedRating);
            setRating(parsedRating);
            setTempRating(parsedRating);
          }
        }
      } catch (error) {
        console.error('Error loading saved rating:', error);
      }
    };
    loadSavedRating();
  }, [movieId]);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const movieReviews = await getMovieReviews(movieId);
        setReviews(movieReviews);

        const avgRating = await getCurrentRatings(movieId);
        onRatingUpdate(avgRating, movieReviews.length);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };
    loadReviews();
  }, [movieId]);

  const handleSubmitRating = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
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

      const existingReview = reviews.find(review => review.userId === currentUser._id);

      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId,
        rating: tempRating,
        comment: existingReview ? existingReview.comment : '',
        userName: userData.name,
        userEmail: userData.email,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        const updatedReviews = await getMovieReviews(movieId);
        setReviews(updatedReviews);
        setUserReview(review);
        
        const avgRating = calculateAverageRating(updatedReviews);
        onRatingUpdate(avgRating, updatedReviews.filter(r => r.rating > 0).length);
        
        setShowRatingModal(false);
        setRating(tempRating);
        setIsEditingRating(false);
        
        Toast.show({
          type: 'success',
          text1: isEditingRating ? 'Cập nhật đánh giá thành công' : 'Đánh giá thành công',
          visibilityTime: 3000,
        });

        // Save rating to AsyncStorage for persistence
        const ratingKey = `movie_rating_${movieId}_${currentUser._id}`;
        await AsyncStorage.setItem(ratingKey, tempRating.toString());
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
    if (!currentUser) {
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

      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId,
        rating: 0, // Rating will be added from current rating in saveMovieReview
        comment: comment.trim(),
        userName: isAnonymous ? 'Ẩn danh' : userData.name,
        userEmail: userData.email,
        isAnonymous: isAnonymous,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        const updatedReviews = await getMovieReviews(movieId);
        setReviews(updatedReviews);
        
        setComment('');
        setIsAnonymous(false);
        
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
    if (!currentUser) return;

    // Only get the current rating from storage, ignore comment ratings
    const ratingKey = `movie_rating_${movieId}_${currentUser._id}`;
    AsyncStorage.getItem(ratingKey).then(savedRating => {
      const currentRating = savedRating ? parseInt(savedRating) : 0;
      setTempRating(currentRating);
      setRating(currentRating);
      setIsEditingRating(true);
      setShowRatingModal(true);
    });
  };

  const handleStarSelect = (selectedRating: number) => {
    setTempRating(selectedRating);
  };

  const handleUpdateRating = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (tempRating === 0) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn số sao',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId,
        rating: tempRating,
        comment: '', // Empty comment since we're only updating rating
        userName: '',
        userEmail: '',
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        setRating(tempRating);
        setShowRatingModal(false);
        
        const avgRating = await getCurrentRatings(movieId);
        onRatingUpdate(avgRating, reviews.length);

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
    if (!currentUser) return;

    try {
      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId,
        rating: 0,
        comment: '', // Empty comment since we're only updating rating
        userName: '',
        userEmail: '',
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        setRating(0);
        setTempRating(0);
        setShowRatingModal(false);
        
        const avgRating = await getCurrentRatings(movieId);
        onRatingUpdate(avgRating, reviews.length);

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

  const getCurrentRating = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        const ratingKey = `movie_rating_${movieId}_${user._id}`;
        const savedRating = await AsyncStorage.getItem(ratingKey);
        if (savedRating) {
          return parseInt(savedRating);
        }
        const userRating = reviews.find(review => 
          review.userId === user._id && 
          review.rating > 0
        );
        return userRating ? userRating.rating : 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting current rating:', error);
      return 0;
    }
  };

  const handleCommentButtonClick = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Toast.show({
        type: 'error',
        text1: 'Bạn cần đăng nhập để bình luận',
        visibilityTime: 3000,
      });
      return;
    }
    setShowCommentModal(true);
  };

  const handleViewAllComments = () => {
    router.push({
      pathname: '/all-comments',
      params: { movieId }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Bình luận gần đây</Text>
        
        {getCurrentUser() ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.ratingButton]}
              onPress={handleRatingButtonClick}
            >
              <Star size={20} color="#000" />
              <Text style={styles.actionButtonText}>Đánh giá</Text>
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

        {getCurrentUser() && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Viết bình luận của bạn..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />
            
            <TouchableOpacity
              style={styles.anonymousOption}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.anonymousText}>Bình luận ẩn danh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitCommentButton, !comment.trim() && styles.submitCommentButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!comment.trim()}
            >
              <Text style={styles.submitCommentButtonText}>Gửi bình luận</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.reviewsList}>
          {reviews
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .filter(review => review.comment && review.comment.trim() !== '')
            .slice(0, 3)
            .map((review, index) => (
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
                      {review.isAnonymous ? '' : review.userEmail}
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
            ))}

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewAllComments}
          >
            <Text style={styles.viewAllButtonText}>
              Xem tất cả bình luận ({reviews.filter(review => review.comment && review.comment.trim() !== '').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rating Modal */}
        <Modal
          visible={showRatingModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRatingModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContainer} 
            activeOpacity={1} 
            onPress={() => setShowRatingModal(false)}
          >
            <TouchableOpacity 
              style={[styles.modalContent, styles.ratingModalContent]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, styles.ratingModalTitle]}>
                  Chỉnh sửa đánh giá
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowRatingModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarSelect(star)}
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

              <View style={styles.ratingModalButtons}>
                {rating > 0 && (
                  <TouchableOpacity
                    style={styles.ratingRemoveButton}
                    onPress={handleRemoveRating}
                  >
                    <Text style={styles.ratingButtonText}>Xóa đánh giá</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.ratingSendButton,
                    !rating && { flex: 1 }
                  ]}
                  onPress={handleUpdateRating}
                >
                  <Text style={styles.ratingButtonText}>Cập nhật</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
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
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
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
  reviewerInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '80%',
  },
  userIcon: {
    fontSize: 16,
  },
  reviewerName: {
    color: '#FFD700',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    flex: 1,
  },
  reviewerEmail: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 2,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
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
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
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
  ratingModalContent: {
    backgroundColor: '#000000',
    padding: 20,
  },
  ratingModalTitle: {
    marginBottom: 0,
  },
  ratingModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
  },
  ratingRemoveButton: {
    flex: 1,
    backgroundColor: '#FF4444',
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
  ratingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  commentInputContainer: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
  },
  commentInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12,
  },
  submitCommentButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#444',
  },
  submitCommentButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 