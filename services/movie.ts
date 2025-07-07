import api from './api';

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