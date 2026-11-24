
import {
    createContext,
    useContext,
    useState,
    useEffect,
} from 'react';

import API from '../services/api';

const AuthContext = createContext(null);

// Custom hook to access authentication data
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside an AuthProvider'
        );
    }

    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            return null;
        }
    });

    const [token, setToken] = useState(
        () => localStorage.getItem('token') || null
    );

    const [loading, setLoading] = useState(true);

    // Verify the saved login session
    useEffect(() => {
        const verifyUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await API.get('/auth/me', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setUser(response.data.user);

                localStorage.setItem(
                    'user',
                    JSON.stringify(response.data.user)
                );
            } catch (error) {
                console.error('Session verification failed:', error);

                localStorage.removeItem('token');
                localStorage.removeItem('user');

                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyUser();
    }, [token]);

    // Update authentication after login or registration
    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setToken(authToken);
    };

    // Clear authentication after logout
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setUser(null);
        setToken(null);
    };

    // Update logged-in user's profile information
    const updateUser = (updatedUser) => {
        setUser(updatedUser);

        localStorage.setItem(
            'user',
            JSON.stringify(updatedUser)
        );
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
