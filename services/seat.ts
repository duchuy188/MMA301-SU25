import api from './api';

export const getSeatsByScreeningId = async (screeningId: string): Promise<any[]> => {
    try {
        // Thêm timestamp để tránh cache
        const timestamp = new Date().getTime();
        const response = await api.get(`/seats/screening/${screeningId}?_t=${timestamp}`);
        return response.data.data || [];
    } catch (error) {
        console.error(`Error fetching seats for screening ${screeningId}:`, error);
        return [];
    }
};
