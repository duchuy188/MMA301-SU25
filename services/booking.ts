import api from './api';

export interface Room {
    _id: string;
    name: string;
}

export interface Movie {
    _id: string;
    title: string;
    poster: string;
}

export interface Screening {
    _id: string;
    roomId: Room;
    movieId: Movie;
    ticketPrice: number;
    startTime: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
}

export interface Booking {
    _id: string;
    userId: User;
    screeningId: Screening;
    seatNumbers: string[];
    totalPrice: number;
    basePrice: number;
    discount: number;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
    code?: string;
    createdAt: string;
    updatedAt: string;
    qrCodeDataUrl?: string;
    movieTitle?: string;
    moviePoster?: string;
    roomName?: string;
    screeningTime?: string;
    bookingDate?: string;
}

export interface CreateBookingData {
    userId?: string;
    screeningId: string;
    seatNumbers: string[];
    code?: string;
    totalPrice?: number;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
    promotionId?: string;
    discountAmount?: number;
}

export interface UpdateBookingData {
    seatNumbers?: string[];
    code?: string;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
    totalPrice?: number;
    basePrice?: number;
    discount?: number;
    promotionId?: string;
    discountAmount?: number;
}

export interface BookingFilters {
    userId?: string;
    screeningId?: string;
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled';
    startDate?: string;
    endDate?: string;
}

export interface BookingResponse {
    success?: boolean;
    message: string;
    booking?: Booking;
    bookings?: Booking[];
    data?: any;
}

interface ApiError extends Error {
    response?: {
        data?: {
            message?: string;
            error?: string;
        };
        status?: number;
    };
}

// Cache management for bookings
let cachedBookings: Booking[] | null = null;
let lastBookingsFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getBookings = async (filters?: BookingFilters): Promise<any> => {
    try {
        const response = await api.get('/bookings', { params: filters });
        return response.data.data || response.data.bookings || response.data || [];
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error fetching bookings');
        }
        throw error;
    }
};

export const createBooking = async (bookingData: any): Promise<any> => {
    try {
        // Clean up the booking data - remove undefined values
        const cleanBookingData = Object.keys(bookingData).reduce((acc, key) => {
            if (bookingData[key] !== undefined && bookingData[key] !== null) {
                acc[key] = bookingData[key];
            }
            return acc;
        }, {} as any);

        // Validate required fields
        if (!cleanBookingData.screeningId) {
            throw new Error('Screening ID is required');
        }
        if (!Array.isArray(cleanBookingData.seatNumbers) || cleanBookingData.seatNumbers.length === 0) {
            throw new Error('At least one seat must be selected');
        }

        // Attempt to create the booking
        const response = await api.post('/bookings', cleanBookingData);
        
        // Validate response
        if (!response.data) {
            throw new Error('No response data received from server');
        }
        
        // Clear cache after creating new booking
        cachedBookings = null;
        
        return response.data;
    } catch (error) {
        const apiError = error as ApiError;
        
        // Handle specific error cases
        if (apiError.response?.status === 500) {
            throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        }
        
        if (apiError.response?.status === 409) {
            throw new Error('Ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.');
        }
        
        if (apiError.response?.status === 400) {
            const errorMsg = apiError.response.data?.message || 'Thông tin đặt vé không hợp lệ.';
            if (errorMsg.includes('already booked')) {
                throw new Error('Một số ghế đã được đặt bởi người khác. Vui lòng chọn ghế khác.');
            }
            throw new Error(errorMsg);
        }
        
        // Default error message
        throw new Error(
            apiError.response?.data?.message || 
            apiError.message || 
            'Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.'
        );
    }
};

export const cancelBooking = async (bookingId: string): Promise<BookingResponse> => {
    try {
        const response = await api.post(`/bookings/${bookingId}/cancel`);
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Không thể hủy đặt vé');
        }

        // Clear cache after cancelling booking
        cachedBookings = null;

        return {
            success: true,
            message: response.data.message,
            booking: response.data.data
        };
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error cancelling booking');
        }
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        throw new Error(`Error cancelling booking: ${errorMessage}`);
    }
};

export const updateBooking = async (
    bookingId: string,
    updateData: UpdateBookingData
): Promise<any> => {
    try {
        // Clean up the update data - remove undefined values
        const cleanUpdateData = Object.keys(updateData).reduce((acc, key) => {
            if (updateData[key as keyof UpdateBookingData] !== undefined && updateData[key as keyof UpdateBookingData] !== null) {
                acc[key as keyof UpdateBookingData] = updateData[key as keyof UpdateBookingData];
            }
            return acc;
        }, {} as any);

        const response = await api.put(`/bookings/${bookingId}`, cleanUpdateData);
        
        // Clear cache after updating booking
        cachedBookings = null;
        
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error updating booking');
        }
        throw error;
    }
};

export const getBookingById = async (bookingId: string): Promise<any> => {
    try {
        // Validate booking ID format
        if (!bookingId || typeof bookingId !== 'string') {
            throw new Error('Invalid booking ID: must be a string');
        }
        
        if (bookingId.length !== 24) {
            throw new Error(`Invalid booking ID length: expected 24 characters, got ${bookingId.length}`);
        }
        
        if (!/^[0-9a-fA-F]{24}$/.test(bookingId)) {
            throw new Error('Invalid booking ID format: must be a 24-character hexadecimal string');
        }
        
        const response = await api.get(`/bookings/${bookingId}`);
        
        const bookingData = response.data.data || response.data;
        
        return bookingData;
    } catch (error: any) {
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 404) {
                throw new Error(`Booking not found: No booking exists with ID ${bookingId}`);
            } else if (status === 400) {
                throw new Error(`Bad request: ${errorData?.message || 'Invalid booking ID format'}`);
            } else if (status === 401) {
                throw new Error('Unauthorized: Please log in again');
            } else if (status === 403) {
                throw new Error('Forbidden: You do not have permission to access this booking');
            } else {
                const errorMsg = errorData?.message || errorData?.error || `Server error (${status})`;
                throw new Error(errorMsg);
            }
        }
        throw error;
    }
};

export const getUserBookings = async (): Promise<BookingResponse> => {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (cachedBookings && (now - lastBookingsFetchTime < CACHE_DURATION)) {
        return {
            message: 'Lấy danh sách vé đã đặt thành công',
            bookings: cachedBookings
        };
    }
    
    try {
        const response = await api.get('/bookings/user');
        
        // Handle the new response structure where bookings are nested in data
        const bookingsData = response.data?.data?.bookings || response.data?.bookings || response.data?.data;
        
        if (!bookingsData || !Array.isArray(bookingsData)) {
            return { message: "Invalid data from server", bookings: [] };
        }

        // Process bookings and add additional fields
        const processedBookings = bookingsData.map((booking: any) => {
            if (!booking?._id || !booking.screeningId) {
                return null;
            }

            return {
                ...booking,
                movieTitle: booking.screeningId.movieId?.title || "N/A",
                moviePoster: booking.screeningId.movieId?.poster,
                roomName: booking.screeningId.roomId?.name || "N/A",
                screeningTime: booking.screeningId.startTime,
                seatNumbers: booking.seatNumbers || [],
                totalPrice: booking.totalPrice,
                bookingDate: booking.createdAt
            };
        }).filter(Boolean) as Booking[];

        // Update cache
        cachedBookings = processedBookings;
        lastBookingsFetchTime = now;

        return {
            message: response.data.message || 'Lấy danh sách vé đã đặt thành công',
            bookings: processedBookings
        };
    } catch (error: any) {
        // Return cached data if available and there's an error
        if (cachedBookings) {
            return {
                message: 'Lấy danh sách vé đã đặt thành công (từ cache)',
                bookings: cachedBookings
            };
        }
        
        if (error.response) {
            throw new Error(error.response.data?.message || 'Error fetching user bookings');
        }
        throw new Error('Could not fetch bookings. Please try again later.');
    }
};

export const updateBookingStatus = async (
    bookingId: string,
    statusData: {
        totalPrice: number;
        basePrice: number;
        discount: number;
        paymentStatus: 'paid' | 'failed' | 'cancelled';
    }
): Promise<BookingResponse> => {
    try {
        // Call API to update status and price information
        const response = await api.post(`/bookings/${bookingId}/status`, statusData);

        // Clear cache after updating booking status
        cachedBookings = null;
        
        return {
            success: true,
            message: 'Cập nhật trạng thái thành công',
            booking: response.data.data || response.data.booking
        };
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error updating booking status');
        }
        throw error;
    }
};

export const updateBookingPaymentStatus = async (
    bookingId: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled'
): Promise<any> => {
    try {
        const response = await api.put(`/bookings/${bookingId}`, {
            paymentStatus: paymentStatus
        });
        
        const responseData = response.data.data || response.data;
        
        // Clear cache after updating booking
        cachedBookings = null;
        
        return responseData;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.message || 'Error updating booking payment status');
        }
        throw error;
    }
};

// New function using the same endpoint as frontend (POST /status)
export const updateBookingPaymentStatusViaStatus = async (
    bookingId: string,
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled',
    totalPrice?: number,
    basePrice?: number,
    discount?: number
): Promise<any> => {
    try {
        const requestData = {
            paymentStatus: paymentStatus,
            ...(totalPrice && { totalPrice }),
            ...(basePrice && { basePrice }),
            ...(discount !== undefined && { discount })
        };
        
        const response = await api.post(`/bookings/${bookingId}/status`, requestData);
        
        const responseData = response.data.booking || response.data.data || response.data;
        
        // Clear cache after updating booking
        cachedBookings = null;
        
        return responseData;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data?.message || 'Error updating booking via status endpoint');
        }
        throw error;
    }
};

// Additional utility function to clear booking cache
export const clearBookingCache = (): void => {
    cachedBookings = null;
    lastBookingsFetchTime = 0;
};