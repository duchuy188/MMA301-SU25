import api from './api';

export interface Theater {
    _id: string;
    name: string;
    address: string;
    phone: string;
    description: string;
    status: boolean;
    latitude?: string;
    longitude?: string;
    screens?: number;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export const getTheaters = async (): Promise<Theater[]> => {
    try {
        const response = await api.get(`/theaters`);
        return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching theaters:', error);
        throw error;
    }
};

export const getTheaterById = async (id: string): Promise<Theater> => {
    try {
        const response = await api.get(`/theaters/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching theater with id ${id}:`, error);
        throw error;
    }
};