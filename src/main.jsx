import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { IsLoginProvider } from './context/isLogin.jsx';
import { RoleProvider } from './context/Role.jsx';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <IsLoginProvider>
            <RoleProvider>
                <App />
            </RoleProvider>
        </IsLoginProvider>
    </StrictMode>,
);
