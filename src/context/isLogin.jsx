// src/context/isLogin.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import {  onAuthStateChanged } from 'firebase/auth';
import { auth} from '@/lib/Firebase';


export const IsLoginContext = createContext();

export const IsLoginProvider = ({ children }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsLogin(!!user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <IsLoginContext.Provider value={{ isLogin, setIsLogin, loading }}>
            {children}
        </IsLoginContext.Provider>
    );
};

export const useIsLogin = () => {
    const context = useContext(IsLoginContext);
    if (!context) {
        throw new Error('useIsLogin must be used within an IsLoginProvider');
    }
    return context;
};
