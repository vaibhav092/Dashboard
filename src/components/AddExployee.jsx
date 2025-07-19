import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/Firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';


export default function AddEmployee() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting:", {
  email: formData.email,
  password: formData.password,
  passwordLength: formData.password.length
});
        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Creating employee account...');

        try {
            // 1. Create auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password,
            );

            // 2. Save to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: formData.name,
                email: formData.email,
                createdAt: serverTimestamp(),
                isActive: true,
                lastLogin: null,
            });

            toast.success(`Employee ${formData.name} added successfully`, {
                id: toastId,
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
        } catch (error) {
            let errorMessage = error.message;
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email is already registered';
            }
            toast.error(`Failed: ${errorMessage}`, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className='flex min-h-screen items-center justify-center p-4'>
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle className='text-2xl font-bold'>
                        Add New Employee
                    </CardTitle>
                    <CardDescription>
                        Create new staff accounts with secure login
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Full Name</Label>
                            <Input
                                id='name'
                                name='name'
                                value={formData.name}
                                onChange={handleChange}
                                placeholder='John Doe'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='email'>Work Email</Label>
                            <Input
                                id='email'
                                name='email'
                                type='email'
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='employee@company.com'
                                required
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='password'>Password</Label>
                                <Input
                                    id='password'
                                    name='password'
                                    type='password'
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder='••••••'
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor='confirmPassword'>Confirm</Label>
                                <Input
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    type='password'
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder='••••••'
                                    required
                                />
                            </div>
                        </div>


                        <Button
                            type='submit'
                            className='w-full'
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Add Employee'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
