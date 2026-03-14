import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface UserContextType {
    userName: string;
    setUserName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userName, setUserName] = useState<string>(() => {
        // Persist across page refreshes via localStorage
        return localStorage.getItem('ecg_username') || '';
    });

    const handleSetUserName = (name: string) => {
        localStorage.setItem('ecg_username', name);
        setUserName(name);
    };

    return (
        <UserContext.Provider value={{ userName, setUserName: handleSetUserName }}>
            {children}
        </UserContext.Provider>
    );
};

/** Hook to access the user context */
export const useUser = (): UserContextType => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used inside UserProvider');
    return ctx;
};
