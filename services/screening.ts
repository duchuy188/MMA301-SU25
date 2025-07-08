import api from './api';

export interface Screening {
  _id: string;
  movieId: string;
  theaterId: string;
  startTime: string;
  endTime: string;
  room: string;
  price: number;
  ticketPrice?: number; // Thêm trường này để đúng với dữ liệu thực tế
  // Thêm các trường khác nếu cần
}

let cachedScreenings: Screening[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

export const getPublicScreenings = async (params?: { theaterId?: string, movieId?: string, startTime?: string }): Promise<Screening[]> => {
  const now = Date.now();

  // Trả về dữ liệu từ cache nếu còn mới và không có params lọc
  if (!params && cachedScreenings && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedScreenings;
  }

  try {
    const response = await api.get('/screenings/public', { params });
    const data = Array.isArray(response.data.data) ? response.data.data : [];

    // Cập nhật cache nếu không có params lọc
    if (!params) {
      cachedScreenings = data;
      lastFetchTime = now;
    }

    return data;
  } catch (error) {
    console.error('Error fetching public screenings:', error);
    // Trả về cache cũ nếu có lỗi và không có params lọc
    if (!params && cachedScreenings) return cachedScreenings;
    return [];
  }
};

export const getScreeningById = async (id: string): Promise<Screening | null> => {
  try {
    const response = await api.get(`/screenings/${id}`);
    return response.data.data || null;
  } catch (error) {
    console.error('Error fetching screening by id:', error);
    return null;
  }
};
