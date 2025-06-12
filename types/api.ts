// User interfaces
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
  }
  
  export interface RegisterData {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }
  
  export interface LoginData {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: User;
  }
  

  export interface Trip {
    id: string;
    departure: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    availableSeats: number;

  }