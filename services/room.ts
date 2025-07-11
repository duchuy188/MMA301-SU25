import api from './api';

export interface Room {
    _id: string;
    theaterId: {
        _id: string;
        name: string;
        address: string;
        phone: string;
        description: string;
        status: boolean;
        createdAt: string;
        updatedAt: string;
        __v: number;
    } | string;
    name: string;
    totalSeats: number;
    __v?: number;
}

export const getRooms = async (): Promise<Room[]> => {
    try {
        const response = await api.get(`/rooms`);
        return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return [];
    }
};

export const getRoomById = async (id: string): Promise<Room | null> => {
    try {
        const response = await api.get(`/rooms/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching room with id ${id}:`, error);
        return null;
    }
};