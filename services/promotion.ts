import api from './api';
import { loadAuthTokens } from './auth';

export interface Promotion {
    _id: string;
    code: string;
    name: string;
    description: string;
    type: 'percent' | 'fixed';
    value: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
    createdBy: string;
    approvedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    posterUrl?: string;
    maxUsage: number;     
    currentUsage: number;  
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    count?: number;
}

export interface PromotionValidationResponse {
    isValid: boolean;
    discountedPrice?: number;
    message: string;
}

// Get all promotions
export const getAllPromotions = async (status?: string): Promise<ApiResponse<Promotion[]>> => {
    try {
        await loadAuthTokens();
        
        const query = status ? `?status=${status}` : '';
        const response = await api.get(`/promotions${query}`);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        }
        throw new Error(error.response?.data?.message || 'Không thể lấy danh sách khuyến mãi');
    }
};

// Get promotion by ID
export const getPromotionById = async (id: string): Promise<ApiResponse<Promotion>> => {
    try {
        await loadAuthTokens();
        
        // Kiểm tra xem id có phải là mã khuyến mãi (code) không
        // Nếu id không phải là ObjectId hợp lệ (24 ký tự hex), thì coi như nó là code
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        
        let response;
        if (isObjectId) {
            // Nếu là ObjectId, gọi API theo ID
            response = await api.get(`/promotions/${id}`);
        } else {
            // Nếu không phải ObjectId, tìm theo code
            response = await api.get(`/promotions/code/${id}`);
        }
        
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        }
        throw new Error(error.response?.data?.message || 'Không thể lấy thông tin khuyến mãi');
    } 
};

// Validate promotion code
export const validatePromotionCode = async (
    code: string,
    ticketPrice: number,
    numberOfSeats: number
): Promise<PromotionValidationResponse> => {
    try {
        await loadAuthTokens();

        const response = await api.post('/promotions/validate', { code });

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        }
        // Log the exact error message from backend
        const backendMessage = error.response?.data?.message;
        throw new Error(backendMessage || 'Mã khuyến mãi không hợp lệ');
    }
};

// Get active promotions for public use
export const getActivePromotions = async (): Promise<ApiResponse<Promotion[]>> => {
    try {
        // Thay đổi endpoint từ /promotions/active thành
        const response = await api.get('/promotions?isActive=true');
        // hoặc
        // const response = await api.get('/promotions/public'); // nếu có endpoint này
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Không thể lấy danh sách khuyến mãi');
    }
};