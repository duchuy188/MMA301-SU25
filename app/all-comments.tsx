import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { MovieReview, getMovieReviews, saveMovieReview } from '../services/movie';
import { getCurrentUser } from '../services/auth';
import { useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function AllComments() {
  const { movieId } = useLocalSearchParams();
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

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
        movieId: movieId as string,
        rating: 0,
        comment: comment.trim(),
        userName: isAnonymous ? 'Ẩn danh' : userData.name,
        userEmail: userData.email,
        isAnonymous: isAnonymous,
        createdAt: new Date().toISOString()
      };

      const success = await saveMovieReview(review);
      if (success) {
        await loadReviews();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tất cả bình luận</Text>
      </View>

      <ScrollView style={styles.reviewsList}>
        {reviews
          .filter(review => review.comment && review.comment.trim() !== '')
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
  },
  commentInputContainer: {
    margin: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  commentInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    textAlignVertical: 'top',
    minHeight: 80,
    fontSize: 16,
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#FFD700',
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  anonymousText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  anonymousTextActive: {
    color: '#FFD700',
  },
  submitCommentButton: {
    backgroundColor: '#2a2a2a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  submitCommentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  submitCommentButtonTextDisabled: {
    color: '#666',
  },
}); 