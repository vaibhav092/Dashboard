import React from 'react';
import Navbar from './components/Navbar';
import { Outlet } from 'react-router';

function Layout() {
    return (
        <div>
            <div className='w-screen'>
                <Navbar />
            </div>
            <Outlet />
        </div>
    );
}

export default Layout;
