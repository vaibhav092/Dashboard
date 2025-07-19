import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { auth } from '@/lib/Firebase';
import { useIsLogin } from '@/context/isLogin';
import { useRole } from '@/context/Role';
import {
    Building,
    User,
    Users,
    Clock,
    Target,
    FileText,
    LogOut,
} from 'lucide-react';

function Navbar() {
    const navigate = useNavigate();
    const { setIsLogin } = useIsLogin();
    const { role } = useRole();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsLogin(false);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav
            className='shadow-lg border-b border-blue-800/30'
            style={{
                background: `
                linear-gradient(rgba(29, 78, 216, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(29, 78, 216, 0.15) 1px, transparent 1px),
                linear-gradient(135deg, #000000 0%, #172554 40%, #000000 100%)
            `,
                backgroundSize: '50px 50px, 50px 50px, 100% 100%',
            }}
        >
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center h-16'>
                    {/* Logo/Brand */}
                    <div className='flex items-center'>
                        <h1 className='text-xl font-semibold text-[#f8fafc]'>
                            {role === 'admin'
                                ? 'Admin Portal'
                                : 'Employee Portal'}
                        </h1>
                    </div>

                    {/* Navigation Buttons */}
                    <div className='flex items-center space-x-3'>
                        {role === 'admin' ? (
                            // Admin navigation buttons
                            <>
                                <Button
                                    variant='ghost'
                                    onClick={() =>
                                        navigate('/admin/client/add')
                                    }
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Building className='w-4 h-4' />
                                    <span>Add Client</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    onClick={() =>
                                        navigate('/admin/employee/add')
                                    }
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Users className='w-4 h-4' />
                                    <span>Add Employee</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    onClick={() => navigate('/admin/client')}
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Building className='w-4 h-4' />
                                    <span>Show Clients</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    onClick={() => navigate('/admin/employee')}
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Users className='w-4 h-4' />
                                    <span>Show Employees</span>
                                </Button>
                            </>
                        ) : (
                            // Employee navigation buttons
                            <>
                                <Button
                                    variant='ghost'
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <User className='w-4 h-4' />
                                    <span>Profile</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Clock className='w-4 h-4' />
                                    <span>Office Login</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <Target className='w-4 h-4' />
                                    <span>Get Tasks</span>
                                </Button>
                                <Button
                                    variant='ghost'
                                    className='flex items-center space-x-2 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-blue-800/20 transition-colors'
                                >
                                    <FileText className='w-4 h-4' />
                                    <span>Reports</span>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Right side - Role badge and logout */}
                    <div className='flex items-center space-x-3'>
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-md border ${
                                role === 'admin'
                                    ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30'
                                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}
                        >
                            {role?.toUpperCase()}
                        </span>
                        <Button
                            onClick={handleLogout}
                            className='flex items-center space-x-2 bg-red-600/80 hover:bg-red-700 text-white border-red-600/50 hover:border-red-700'
                        >
                            <LogOut className='w-4 h-4' />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
