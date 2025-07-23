import React from 'react';
import { useRole } from '@/context/Role';

function Home() {
    const { role } = useRole();

    return (
        <div className='flex items-center justify-center min-h-[80vh]'>
            <h1 className='text-4xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
                {role === 'admin' ? 'Welcome Admin!' : 'Welcome Employee!'}
            </h1>
        </div>
    );
}

export default Home;
