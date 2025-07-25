import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// --- Import your Firebase instances ---
import { auth, db } from '../lib/Firebase';

// --- Import your shadcn/ui components ---
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

// --- Departments Data ---
const departments = ['Marketing', 'Sales', 'Tech', 'Finance'];

export default function EmployeeProfilePage() {
    const [userData, setUserData] = useState({ name: '', email: '' });
    const [profileData, setProfileData] = useState({
        phoneNumber: '',
        department: '',
        companyName: '',
        location: '',
        bio: '',
        skills: [],
        jobTitle: '', // Added jobTitle
        employeeId: '', // Added employeeId if needed
    });
    const [skillInput, setSkillInput] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setLoading(false);
                setError('Please log in to view your profile.');
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const fetchUserData = async () => {
            setLoading(true);
            const userDocRef = doc(db, 'users', currentUser.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();

                    setUserData({
                        name: data.name || 'N/A',
                        email: data.email || 'N/A',
                    });

                    setProfileData({
                        phoneNumber: data.phoneNumber || '',
                        department: data.department || '',
                        companyName: data.companyName || '', // This will fetch from Firebase
                        location: data.location || '',
                        bio: data.bio || '',
                        skills: data.skills || [],
                        jobTitle: data.jobTitle || '', // Added jobTitle
                        employeeId: data.employeeId || '', // Added employeeId if needed
                    });
                } else {
                    console.log('No document found for user:', currentUser.uid);
                    setError('Welcome! Please complete your profile.');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for shadcn's Select component
    const handleSelectChange = (value) => {
        setProfileData((prev) => ({ ...prev, department: value }));
    };

    const handleSkillKeyDown = (e) => {
        if (e.key === 'Enter' && skillInput.trim() !== '') {
            e.preventDefault();
            const newSkill = skillInput.trim();
            if (!profileData.skills.includes(newSkill)) {
                setProfileData((prev) => ({
                    ...prev,
                    skills: [...prev.skills, newSkill],
                }));
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfileData((prev) => ({
            ...prev,
            skills: prev.skills.filter((skill) => skill !== skillToRemove),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            setError('You must be logged in to save.');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');
        const userDocRef = doc(db, 'users', currentUser.uid);

        try {
            await setDoc(
                userDocRef,
                {
                    ...profileData,
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className='flex justify-center p-4 font-sans'>
            <Card className='w-full max-w-3xl bg-black/20 backdrop-blur-lg border border-white/20 text-white mt-16'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-3xl'>Employee Profile</CardTitle>
                    <CardDescription className='text-gray-300'>
                        Keep your professional information up-to-date.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className='text-center'>Loading Profile...</div>
                    ) : !currentUser ? (
                        <Alert
                            variant='destructive'
                            className='bg-red-900/50 text-red-300 border-red-500/50'
                        >
                            <ExclamationTriangleIcon className='h-4 w-4' />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <form onSubmit={handleSubmit} className='space-y-6'>
                            {error && (
                                <Alert
                                    variant='destructive'
                                    className='bg-red-900/50 text-red-300 border-red-500/50'
                                >
                                    <ExclamationTriangleIcon className='h-4 w-4' />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert className='bg-green-900/50 text-green-300 border-green-500/50'>
                                    <AlertDescription>
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='name'
                                        className='text-gray-300'
                                    >
                                        Full Name
                                    </Label>
                                    <Input
                                        id='name'
                                        value={userData.name}
                                        disabled
                                        className='bg-gray-700/50 border-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='email'
                                        className='text-gray-300'
                                    >
                                        Work Email
                                    </Label>
                                    <Input
                                        id='email'
                                        type='email'
                                        value={userData.email}
                                        disabled
                                        className='bg-gray-700/50 border-gray-600 cursor-not-allowed'
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='companyName'
                                        className='text-gray-300'
                                    >
                                        Client/Company Name
                                    </Label>
                                    <Input
                                        id='companyName'
                                        name='companyName'
                                        value={
                                            profileData.companyName ||
                                            'Not Assigned'
                                        }
                                        disabled
                                        className='bg-gray-700/50 border-gray-600 cursor-not-allowed'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='jobTitle'
                                        className='text-gray-300'
                                    >
                                        Job Title
                                    </Label>
                                    <Input
                                        id='jobTitle'
                                        name='jobTitle'
                                        value={profileData.jobTitle}
                                        onChange={handleChange}
                                        placeholder='e.g., Software Engineer'
                                        className='bg-white/10 border-gray-600 placeholder:text-gray-400'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='department'
                                        className='text-gray-300'
                                    >
                                        Department
                                    </Label>
                                    <Select
                                        onValueChange={handleSelectChange}
                                        value={profileData.department}
                                    >
                                        <SelectTrigger className='bg-white/10 border-gray-600'>
                                            <SelectValue placeholder='Select a department' />
                                        </SelectTrigger>
                                        <SelectContent className='bg-gray-900 text-white border-gray-600'>
                                            {departments.map((dept) => (
                                                <SelectItem
                                                    key={dept}
                                                    value={dept}
                                                >
                                                    {dept}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='phoneNumber'
                                        className='text-gray-300'
                                    >
                                        Phone Number
                                    </Label>
                                    <Input
                                        id='phoneNumber'
                                        name='phoneNumber'
                                        type='tel'
                                        value={profileData.phoneNumber}
                                        onChange={handleChange}
                                        placeholder='(123) 456-7890'
                                        className='bg-white/10 border-gray-600 placeholder:text-gray-400'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label
                                        htmlFor='location'
                                        className='text-gray-300'
                                    >
                                        Location
                                    </Label>
                                    <Input
                                        id='location'
                                        name='location'
                                        value={profileData.location}
                                        onChange={handleChange}
                                        placeholder='e.g., San Francisco, CA'
                                        className='bg-white/10 border-gray-600 placeholder:text-gray-400'
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label htmlFor='bio' className='text-gray-300'>
                                    Bio / Expertise
                                </Label>
                                <Textarea
                                    id='bio'
                                    name='bio'
                                    value={profileData.bio}
                                    onChange={handleChange}
                                    placeholder='Tell us about your role, skills, and professional interests...'
                                    className='bg-white/10 border-gray-600 placeholder:text-gray-400'
                                />
                            </div>

                            <div className='space-y-2'>
                                <Label
                                    htmlFor='skills'
                                    className='text-gray-300'
                                >
                                    Skills (press Enter to add)
                                </Label>
                                <Input
                                    id='skills'
                                    value={skillInput}
                                    onChange={(e) =>
                                        setSkillInput(e.target.value)
                                    }
                                    onKeyDown={handleSkillKeyDown}
                                    placeholder='e.g., React, Node.js, Figma'
                                    className='bg-white/10 border-gray-600 placeholder:text-gray-400'
                                />
                                <div className='flex flex-wrap gap-2 mt-3'>
                                    {profileData.skills.map((skill) => (
                                        <div
                                            key={skill}
                                            className='flex items-center bg-indigo-500/50 text-indigo-100 text-xs font-medium px-3 py-1 rounded-full'
                                        >
                                            {skill}
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    removeSkill(skill)
                                                }
                                                className='ml-2 text-indigo-200 hover:text-white'
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className='pt-4'>
                                <Button
                                    type='submit'
                                    disabled={saving}
                                    className='w-full bg-indigo-600 hover:bg-indigo-700 text-white'
                                >
                                    {saving ? 'Saving...' : 'Update Profile'}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
