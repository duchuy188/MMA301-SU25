import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth';

export interface Movie {
    // Required fields
    _id: string;
    title: string;
    description: string;
    genre: string;
    duration: number;
    releaseDate: string;
    country: string;
    producer: string;
    directors: string[];
    actors: string[];
    showingStatus: 'coming-soon' | 'now-showing' | 'ended';
    status: 'pending' | 'approved' | 'rejected';
    posterUrl: string;
    
    // Optional fields
    trailerUrl?: string;
    vietnameseTitle?: string;
    rating?: number;
    votes?: number;
    createdAt?: string;
    updatedAt?: string;
    rejectionReason?: string;
    createdBy?: string;
    approvedBy?: string | null;
    isActive?: boolean;
    __v?: number;
    endDate?: string | null;
}

export interface MovieReview {
    userId: string;
    movieId: string;
    rating: number;
    comment: string;
    userName: string;
    userEmail: string; // Thêm trường email
    isAnonymous: boolean; // Thêm trường để đánh dấu review ẩn danh
    createdAt: string;
}

let cachedMovies: Movie[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const getPublicMovies = async (): Promise<Movie[]> => {
    const now = Date.now();
    
    // Trả về dữ liệu từ cache nếu còn mới
    if (cachedMovies && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedMovies;
    }
    
    try {
        const response = await api.get('/movies/public');
        const data = Array.isArray(response.data.data) ? response.data.data : [];
        
        // Cập nhật cache
        cachedMovies = data;
        lastFetchTime = now;
        
        return data;
    } catch (error) {
        console.error('Error fetching public movies:', error);
        // Trả về cache cũ nếu có lỗi và có dữ liệu cache
        if (cachedMovies) return cachedMovies;
        return [];
    }
};


export const getMovieById = async (id: string): Promise<Movie> => {
    try {
        const response = await api.get(`/movies/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching movie with id ${id}:`, error);
        throw error;
    }
};


export const getMoviesByStatus = async (status: 'now-showing' | 'coming-soon' | 'ended'): Promise<Movie[]> => {
    try {
        const response = await api.get(`/movies/status/${status}`);
        return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
        console.error(`Error fetching movies with status ${status}:`, error);
        return [];
    }
};

// Function to get storage key for reviews
const getReviewsStorageKey = (movieId: string) => `movieReviews_${movieId}`;

// Function to save a review
export const saveMovieReview = async (review: MovieReview) => {
    try {
        // Get user data from AsyncStorage to ensure we have the latest name
        const userJson = await AsyncStorage.getItem('auth_user');
        const userData = userJson ? JSON.parse(userJson) : null;
        
        // Get existing reviews for this movie
        const storageKey = getReviewsStorageKey(review.movieId);
        const existingReviewsStr = await AsyncStorage.getItem(storageKey);
        let reviews: MovieReview[] = existingReviewsStr ? JSON.parse(existingReviewsStr) : [];
        
        if (review.comment && review.comment.trim() !== '') {
            // If this is a comment, add it as a new review with current rating
            const ratingKey = `movie_rating_${review.movieId}_${review.userId}`;
            const currentRating = await AsyncStorage.getItem(ratingKey);
            
            // Add new review with current rating
            reviews.push({
                ...review,
                rating: currentRating ? parseInt(currentRating) : 0,
                userName: userData?.name || review.userName,
                createdAt: new Date().toISOString()
            });
            
            // Save reviews back to AsyncStorage
            await AsyncStorage.setItem(storageKey, JSON.stringify(reviews));
        } else {
            // This is just a rating update - don't modify reviews
            const ratingKey = `movie_rating_${review.movieId}_${review.userId}`;
            if (review.rating > 0) {
                await AsyncStorage.setItem(ratingKey, review.rating.toString());
            } else {
                await AsyncStorage.removeItem(ratingKey);
            }
        }

        // Update movie rating in cache if exists
        if (cachedMovies) {
            const movieIndex = cachedMovies.findIndex(m => m._id === review.movieId);
            if (movieIndex !== -1) {
                // Get all current ratings
                const allKeys = await AsyncStorage.getAllKeys();
                const ratingKeys = allKeys.filter(key => key.startsWith(`movie_rating_${review.movieId}_`));
                const currentRatings = await Promise.all(
                    ratingKeys.map(async key => {
                        const rating = await AsyncStorage.getItem(key);
                        return rating ? parseInt(rating) : 0;
                    })
                );
                
                // Calculate average from current ratings only
                const validRatings = currentRatings.filter(r => r > 0);
                const avgRating = validRatings.length > 0 
                    ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1))
                    : 0;

                cachedMovies[movieIndex] = {
                    ...cachedMovies[movieIndex],
                    rating: avgRating,
                    votes: validRatings.length
                };
            }
        }

        return true;
    } catch (error) {
        console.error('Error saving movie review:', error);
        return false;
    }
};

// Function to get all current ratings (not from reviews)
export const getCurrentRatings = async (movieId: string): Promise<number> => {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const ratingKeys = allKeys.filter(key => key.startsWith(`movie_rating_${movieId}_`));
        const ratings = await Promise.all(
            ratingKeys.map(async key => {
                const rating = await AsyncStorage.getItem(key);
                return rating ? parseInt(rating) : 0;
            })
        );
        
        const validRatings = ratings.filter(r => r > 0);
        return validRatings.length > 0 
            ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1))
            : 0;
    } catch (error) {
        console.error('Error getting current ratings:', error);
        return 0;
    }
};

// Function to get all ratings including current ratings and review ratings
export const getAllUserRatings = async (movieId: string): Promise<MovieReview[]> => {
    try {
        // Get all reviews
        const storageKey = getReviewsStorageKey(movieId);
        const reviewsStr = await AsyncStorage.getItem(storageKey);
        const reviews: MovieReview[] = reviewsStr ? JSON.parse(reviewsStr) : [];
        
        // Get all current ratings
        const allKeys = await AsyncStorage.getAllKeys();
        const ratingKeys = allKeys.filter(key => key.startsWith(`movie_rating_${movieId}_`));
        
        // Get all current ratings that don't have a recent review
        const currentRatings = await Promise.all(
            ratingKeys.map(async key => {
                const rating = await AsyncStorage.getItem(key);
                if (rating) {
                    const userId = key.split('_').pop() || '';
                    
                    // Check if user has a review in the last hour
                    const recentReview = reviews.find(r => 
                        r.userId === userId && 
                        (new Date().getTime() - new Date(r.createdAt).getTime()) < 3600000
                    );
                    
                    // Only include current rating if no recent review
                    if (!recentReview) {
                        return {
                            userId,
                            movieId,
                            rating: parseInt(rating),
                            comment: '',
                            userName: '',
                            userEmail: '',
                            isAnonymous: false,
                            createdAt: new Date().toISOString()
                        };
                    }
                }
                return null;
            })
        );

        // Combine reviews and current ratings, filtering out null values
        return [...reviews, ...currentRatings.filter((r): r is MovieReview => r !== null)];
    } catch (error) {
        console.error('Error getting all ratings:', error);
        return [];
    }
};

// Function to get reviews for a movie
export const getMovieReviews = async (movieId: string): Promise<MovieReview[]> => {
    try {
        const storageKey = getReviewsStorageKey(movieId);
        const reviewsStr = await AsyncStorage.getItem(storageKey);
        if (!reviewsStr) return [];
        
        return JSON.parse(reviewsStr);
    } catch (error) {
        console.error('Error getting movie reviews:', error);
        return [];
    }
};

// Function to get user's latest review for a movie
export const getUserReview = async (userId: string, movieId: string): Promise<MovieReview | null> => {
    try {
        const storageKey = getReviewsStorageKey(movieId);
        const reviewsStr = await AsyncStorage.getItem(storageKey);
        if (!reviewsStr) return null;
        
        const reviews: MovieReview[] = JSON.parse(reviewsStr);
        // Get all reviews from this user for this movie, sorted by date
        const userReviews = reviews
            .filter(review => review.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Return the most recent review
        return userReviews[0] || null;
    } catch (error) {
        console.error('Error getting user review:', error);
        return null;
    }
};

// Function to calculate average rating
export const calculateAverageRating = (reviews: MovieReview[]): number => {
    const validReviews = reviews.filter(review => review.rating > 0);
    if (validReviews.length === 0) return 0;
    const sum = validReviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / validReviews.length).toFixed(1));
};