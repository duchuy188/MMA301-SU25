import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { MovieReview, getMovieReviews, saveMovieReview } from '../services/movie';
import { getCurrentUser } from '../services/auth';
import { useLocalSearchParams } from 'expo-router';
import { Star, MessageSquare, Image as ImageIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

export default function AllComments() {
  const { movieId } = useLocalSearchParams();
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewImages, setReviewImages] = useState<{[key: string]: string}>({});
  const [filterType, setFilterType] = useState<'all' | 'images' | 'comments'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, []);

  // Load images from AsyncStorage
  useEffect(() => {
    const loadImages = async () => {
      const loadedImages: {[key: string]: string} = {};
      for (const review of reviews) {
        if (review.imageUrl?.startsWith('review_image_')) {
          const uri = await AsyncStorage.getItem(review.imageUrl);
          if (uri) {
            loadedImages[review.imageUrl] = uri;
          }
        }
      }
      setReviewImages(loadedImages);
    };
    loadImages();
  }, [reviews]);

  const loadReviews = async () => {
    try {
      const movieReviews = await getMovieReviews(movieId as string);
      setReviews(movieReviews.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
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

    if (!comment.trim() && !selectedImage) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập bình luận hoặc chọn ảnh',
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

      // Save image to AsyncStorage if selected
      let imageUrl: string | undefined;
      if (selectedImage) {
        const imageKey = `review_image_${movieId}_${currentUser._id}_${Date.now()}`;
        await AsyncStorage.setItem(imageKey, selectedImage);
        imageUrl = imageKey;
      }

      const review: MovieReview = {
        userId: currentUser._id,
        movieId: movieId as string,
        rating: 0,
        comment: comment.trim() || '📸', // If no comment, show camera emoji
        userName: isAnonymous ? 'Ẩn danh' : userData.name,
        userEmail: userData.email,
        isAnonymous: isAnonymous,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        await loadReviews();
        setComment('');
        setIsAnonymous(false);
        setSelectedImage(null);
        
        // Update reviewImages if there's a new image
        if (imageUrl && selectedImage) {
          setReviewImages(prev => ({
            ...prev,
            [imageUrl]: selectedImage
          }));
        }
        
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

  const filteredReviews = reviews
    .filter(review => {
      // First apply content type filter
      switch (filterType) {
        case 'images':
          return review.imageUrl != null;
        case 'comments':
          return review.comment && review.comment.trim() !== '' && review.comment !== '📸';
        default:
          return true;
      }
    })
    .filter(review => selectedRating === null || review.rating === selectedRating);

  const renderFilters = () => {
    return (
      <View style={styles.filterContainer}>
        {/* Content type filters */}
        <View style={styles.filterGroup}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'images' && styles.filterButtonActive]}
            onPress={() => setFilterType('images')}
          >
            <View style={styles.filterButtonContent}>
              <ImageIcon size={16} color={filterType === 'images' ? '#000' : '#fff'} />
              <Text style={[styles.filterText, filterType === 'images' && styles.filterTextActive]}>
                Có hình ảnh
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'comments' && styles.filterButtonActive]}
            onPress={() => setFilterType('comments')}
          >
            <View style={styles.filterButtonContent}>
              <MessageSquare size={16} color={filterType === 'comments' ? '#000' : '#fff'} />
              <Text style={[styles.filterText, filterType === 'comments' && styles.filterTextActive]}>
                Có bình luận
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Rating filters */}
        <View style={styles.ratingContainer}>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.filterButton, selectedRating === rating && styles.filterButtonActive]}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={[styles.filterText, selectedRating === rating && styles.filterTextActive]}>
                  {rating}⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingRow}>
            {[6, 7, 8, 9, 10].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.filterButton, selectedRating === rating && styles.filterButtonActive]}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={[styles.filterText, selectedRating === rating && styles.filterTextActive]}>
                  {rating}⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const openFullImage = (imageUri: string) => {
    setSelectedFullImage(imageUri);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={{ uri: selectedFullImage || '' }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Tất cả bình luận</Text>
      </View>

      {renderFilters()}

      <ScrollView style={styles.reviewsList}>
        {filteredReviews.map((review, index) => (
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
            {review.comment && review.comment !== '📸' && (
              <Text style={styles.reviewComment}>
                {review.comment}
              </Text>
            )}
            {review.imageUrl && reviewImages[review.imageUrl!] && (
              <TouchableOpacity onPress={() => openFullImage(reviewImages[review.imageUrl!])}>
                <Image
                  source={{ uri: reviewImages[review.imageUrl!] }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingScroll: {
    flexGrow: 0,
  },
  ratingScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  reviewsList: {
    flex: 1,
    padding: 16,
  },
  reviewItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userIcon: {
    fontSize: 16,
  },
  reviewerName: {
    color: '#FFD700',
    fontWeight: '500',
    fontSize: 14,
  },
  reviewerEmail: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  ratingContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewComment: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
}); 