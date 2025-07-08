import api from './api';

export const getSeatsByScreeningId = async (screeningId: string): Promise<any[]> => {
    try {
        const response = await api.get(`/seats/screening/${screeningId}`);
        return Array.isArray(response.data.seats) ? response.data.seats : [];
    } catch (error) {
        console.error(`Error fetching seats for screening ${screeningId}:`, error);
        return [];
    }
};
