import React, { useState } from 'react';
import { Button } from './ui/button';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/Firebase.js';
import { useIsLogin } from '@/context/isLogin.jsx';
import { useRole } from '@/context/Role.jsx'; // <-- Add this import
import { useNavigate } from 'react-router';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { setIsLogin } = useIsLogin();
    const { assignRole } = useRole();
    const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase sign-in successful!"); // Add this
        await setIsLogin(true);
        console.log("setIsLogin(true) called!"); // Add this
        assignRole(email);
        console.log("assignRole called!"); // Add this
        navigate('/');
        console.log("navigate('/') called!"); // Add this
    } catch (err) {
        setError(err.message);
        console.error('Login error:', err);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className='text-primary flex justify-center items-center h-screen'>
            <div className='w-125 h-100 bg-gray-800 rounded-4xl flex flex-col'>
                <h1 className='font-medium text-3xl text-center mt-3 p-5'>
                    Admin Login
                </h1>
                {error && <p className='text-red-500 text-center'>{error}</p>}
                <form onSubmit={handleLogin}>
                    <label
                        className='font-medium text-secondary px-4 py-2 text-xl'
                        htmlFor='email'
                    >
                        Email
                    </label>
                    <input
                        id='email'
                        type='email'
                        className='text-black bg-slate-200 px-3 mx-3 rounded-2xl h-8 mb-2 w-11/12'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='Enter your Email'
                        required
                    />
                    <label
                        className='font-medium text-secondary px-4 py-2 text-xl'
                        htmlFor='password'
                    >
                        Password
                    </label>
                    <input
                        id='password'
                        type='password'
                        className='text-black bg-slate-200 px-3 mx-3 rounded-2xl h-8 w-11/12'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Enter your Password'
                        required
                    />
                    <Button
                        className='mx-27 mt-12 hover:cursor-pointer w-1/2'
                        type='submit'
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Submit'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default Login;
