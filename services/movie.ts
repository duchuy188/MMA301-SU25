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
        
        // Add new review with the latest user name
        reviews.push({
            ...review,
            userName: userData?.name || review.userName // Use latest name from AsyncStorage if available
        });
        
        // Save back to AsyncStorage
        await AsyncStorage.setItem(storageKey, JSON.stringify(reviews));

        // Update movie rating in cache if exists
        if (cachedMovies) {
            const movieIndex = cachedMovies.findIndex(m => m._id === review.movieId);
            if (movieIndex !== -1) {
                const avgRating = calculateAverageRating(reviews);
                cachedMovies[movieIndex] = {
                    ...cachedMovies[movieIndex],
                    rating: avgRating,
                    votes: reviews.length
                };
            }
        }

        return true;
    } catch (error) {
        console.error('Error saving movie review:', error);
        return false;
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
    if (validReviews.length === 0) return 7.5;
    const sum = validReviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / validReviews.length).toFixed(1));
};