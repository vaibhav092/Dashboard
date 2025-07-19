import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
    const [role, setRole] = useState(null);

    // Call this on login with the user's email
    const assignRole = (email) => {
        if (email.toLowerCase() === 'admin@cehpoint.in') {
            setRole('admin');
        } else {
            setRole('employee');
        }
    };

    const logout = () => setRole(null);

    return (
        <RoleContext.Provider value={{ role, assignRole, logout }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);
