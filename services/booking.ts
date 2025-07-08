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
    const response = await api.post('/bookings', data);
    return response.data.data || null;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
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
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching booking by id:', error);
    return null;
  }
};
