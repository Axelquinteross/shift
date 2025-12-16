export interface User {
  uid: string;
  email: string;
  displayName?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuth: boolean | null;
  checkAuthStatus: () => boolean | null;
}

declare function useAuth(): UseAuthReturn;

export { useAuth };
