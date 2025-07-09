import api from './api';

export interface Booking {
  _id: string;
  userId: string;
  screeningId: string;
  seatNumbers: string[];
  totalPrice: number;
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getBookings = async (filters?: {
  userId?: string;
  screeningId?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Booking[]> => {
  try {
    const response = await api.get('/bookings', { params: filters });
    return response.data.data.bookings || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const createBooking = async (data: {
  screeningId: string;
  seatNumbers: string[];
  code?: string;
}): Promise<Booking | null> => {
  try {
    console.log('Creating booking with data:', data);
    const response = await api.post('/bookings', data);
    console.log('Booking API response:', response.data);
    return response.data.data || null;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error message:', error.message);
    
    // Throw error để component có thể catch và hiển thị lỗi cụ thể
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Không thể tạo booking. Vui lòng thử lại.');
    }
  }
};

export const cancelBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return null;
  }
};

export const updateBooking = async (bookingId: string, data: {
  seatNumbers?: string[];
  code?: string;
}): Promise<Booking | null> => {
  try {
    const response = await api.put(`/bookings/${bookingId}`, data);
    return response.data.data || null;
  } catch (error) {
    console.error('Error updating booking:', error);
    return null;
  }
};

export const getUserBookings = async (): Promise<Booking[]> => {
  try {
    const response = await api.get('/bookings/user');
    return response.data.data.bookings || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    console.log(`Fetching booking by ID: ${bookingId}`);
    const response = await api.get(`/bookings/${bookingId}`);
    console.log('getBookingById success:', response.data);
    return response.data.data || response.data || null;
  } catch (error: any) {
    console.error(`Error fetching booking by id (${bookingId}):`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // If 404, the booking doesn't exist
    if (error.response?.status === 404) {
      console.error(`❌ Booking ${bookingId} not found (404)`);
    }
    
    return null;
  }
};

export const updateBookingPaymentStatus = async (
  bookingId: string, 
  paymentStatus: 'pending' | 'paid' | 'cancelled'
): Promise<Booking | null> => {
  console.log(`Attempting to update booking ${bookingId} to status: ${paymentStatus}`);
  
  // Thử các endpoint update mà không cần fetch booking trước
  const updateEndpoints = [
    {
      method: 'PUT',
      url: `/bookings/${bookingId}/payment-status`,
      data: { paymentStatus }
    },
    {
      method: 'PUT', 
      url: `/bookings/${bookingId}`,
      data: { paymentStatus }
    },
    {
      method: 'PATCH',
      url: `/bookings/${bookingId}`,
      data: { paymentStatus }
    }
  ];
  
  for (let i = 0; i < updateEndpoints.length; i++) {
    const endpoint = updateEndpoints[i];
    
    try {
      console.log(`Trying endpoint ${i + 1}: ${endpoint.method} ${endpoint.url}`);
      
      let response;
      if (endpoint.method === 'PUT') {
        response = await api.put(endpoint.url, endpoint.data);
      } else if (endpoint.method === 'PATCH') {
        response = await api.patch(endpoint.url, endpoint.data);
      }
      
      console.log(`Endpoint ${i + 1} success:`, response?.data);
      return response?.data?.data || response?.data || null;
      
    } catch (error: any) {
      console.log(`Endpoint ${i + 1} failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Tiếp tục thử endpoint tiếp theo
      if (i === updateEndpoints.length - 1) {
        // Đây là endpoint cuối cùng, log error final
        console.error(`All update endpoints failed for booking ${bookingId}`);
      }
    }
  }
  
  return null;
};
