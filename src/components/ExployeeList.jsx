import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    collection,
    getDocs,
    query,
    orderBy,
    updateDoc,
    doc,
    getDoc,
    onSnapshot,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/Firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function EmployeesList() {
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Set up real-time listeners for both collections
        const unsubscribeEmployees = onSnapshot(
            query(collection(db, 'users'), orderBy('createdAt', 'desc')),
            (snapshot) => {
                const fetchedEmployees = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setEmployees(fetchedEmployees);
                console.log('Employees updated:', fetchedEmployees);
            },
            (error) => {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employees');
            }
        );

        const unsubscribeClients = onSnapshot(
            collection(db, 'clients'),
            (snapshot) => {
                const fetchedClients = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setClients(fetchedClients);
                console.log('Clients updated:', fetchedClients);
            },
            (error) => {
                console.error('Error fetching clients:', error);
                toast.error('Failed to load clients');
            }
        );

        // Set loading to false once we have initial data
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 3000); // Fallback timeout

        // Cleanup listeners on unmount
        return () => {
            unsubscribeEmployees();
            unsubscribeClients();
            clearTimeout(timeoutId);
        };
    }, []);

    // Set loading to false when we have data
    useEffect(() => {
        if (!loading && (employees.length > 0 || clients.length > 0)) {
            setLoading(false);
        }
    }, [employees, clients]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setAuthError("Passwords don't match");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setAuthError('Please enter a valid email');
            return;
        }

        setFormLoading(true);
        const toastId = toast.loading('Creating employee account...');

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email.trim(),
                formData.password,
            );

            // 2. Save to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                createdAt: serverTimestamp(),
                isActive: true,
            });

        console.log('About to show success toast for:', formData.name);
        toast.success(`Employee ${formData.name} added successfully`, {
            id: toastId,
        });

            // Reset form and close modal
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
            });
            setIsModalOpen(false);
            setAuthError(null);
        } catch (error) {
            console.error('Full error:', error);

            let errorMessage = error.message;
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    setAuthError(errorMessage);
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    setAuthError(errorMessage);
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password must be ≥6 characters';
                    setAuthError(errorMessage);
                    break;
            }

            toast.error(`Failed: ${errorMessage}`, { id: toastId });
        } finally {
            setFormLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleStatus = async (employeeId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'users', employeeId), {
                isActive: !currentStatus,
            });
            toast.success('Status updated');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const assignClient = async (employeeId, clientId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);
            
            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            const userRef = doc(db, 'users', employeeId);
            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = [
                ...new Set([...currentEmployees, employeeId])
            ];

            await Promise.all([
                updateDoc(userRef, {
                    assignedClient: clientId,
                    companyName: clientSnap.data().name,
                }),
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                })
            ]);

            toast.success('Client assigned successfully');
        } catch (error) {
            console.error('Error assigning client:', error);
            toast.error('Failed to assign client');
        }
    };

    const unassignClient = async (employeeId, clientId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const userRef = doc(db, 'users', employeeId);

            const clientSnap = await getDoc(clientRef);
            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = currentEmployees.filter(id => id !== employeeId);

            await Promise.all([
                updateDoc(userRef, {
                    assignedClient: null,
                    companyName: null,
                }),
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                })
            ]);

            toast.success('Client unassigned successfully');
        } catch (error) {
            console.error('Error unassigning client:', error);
            toast.error('Failed to unassign client');
        }
    };

    const getClientDisplayName = (assignedClientId) => {
        if (!assignedClientId) return 'Assign Client';
        
        const assignedClient = clients.find((c) => c.id === assignedClientId);
        
        if (assignedClient) {
            return assignedClient.name || assignedClient.companyName || 'Unnamed Client';
        } else {
            return `Client Not Found (${assignedClientId.substring(0, 8)}...)`;
        }
    };

    // Reset form when modal is closed
    const handleModalClose = () => {
        setIsModalOpen(false);
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        });
        setAuthError(null);
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center h-64'>
                <Loader2 className='h-8 w-8 animate-spin' />
            </div>
        );
    }

    return (
        <div className='container mx-auto py-8'>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle>Employee Management</CardTitle>
                    <div className='flex gap-2'>
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className='mr-2 h-4 w-4' />
                                    Add Employee
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md text-black">
                                <DialogHeader>
                                    <DialogTitle className='text-2xl font-bold'>
                                        Add New Employee
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create new staff accounts with secure login
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="mt-4">
                                    {authError && (
                                        <Alert variant='destructive' className='mb-4'>
                                            <ExclamationTriangleIcon className='h-4 w-4' />
                                            <AlertDescription>{authError}</AlertDescription>
                                        </Alert>
                                    )}
                                    
                                    <div className='space-y-4'>
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

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={handleModalClose}
                                                disabled={formLoading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type='button'
                                                className='flex-1'
                                                disabled={formLoading}
                                                onClick={handleSubmit}
                                            >
                                                {formLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Add Employee'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        <Button
                            variant='outline'
                            onClick={() => navigate('/admin/client')}
                        >
                            <UserPlus className='mr-2 h-4 w-4' />
                            Manage Clients
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-4 font-medium">Name</th>
                                    <th className="text-left p-4 font-medium">Email</th>
                                    <th className="text-left p-4 font-medium">Status</th>
                                    <th className="text-left p-4 font-medium">Client</th>
                                    <th className="text-left p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                                        <td className='p-4 font-medium'>
                                            {employee.name}
                                        </td>
                                        <td className="p-4">{employee.email}</td>
                                        <td className="p-4">
                                            <Button
                                                variant='ghost'
                                                onClick={() =>
                                                    toggleStatus(
                                                        employee.id,
                                                        employee.isActive,
                                                    )
                                                }
                                            >
                                                {employee.isActive ? (
                                                    <ToggleRight className='h-6 w-6 text-green-500' />
                                                ) : (
                                                    <ToggleLeft className='h-6 w-6 text-gray-400' />
                                                )}
                                                <span className='ml-2'>
                                                    {employee.isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </Button>
                                        </td>
                                        <td className="p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                    >
                                                        {getClientDisplayName(employee.assignedClient)}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {employee.assignedClient && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    unassignClient(
                                                                        employee.id,
                                                                        employee.assignedClient
                                                                    )
                                                                }
                                                                className="text-red-600"
                                                            >
                                                                Unassign Current Client
                                                            </DropdownMenuItem>
                                                            <hr className="my-1" />
                                                        </>
                                                    )}
                                                    {clients.length > 0 ? (
                                                        clients
                                                            .filter(client => client.id !== employee.assignedClient)
                                                            .map((client) => (
                                                                <DropdownMenuItem
                                                                    key={client.id}
                                                                    onClick={() =>
                                                                        assignClient(
                                                                            employee.id,
                                                                            client.id,
                                                                        )
                                                                    }
                                                                >
                                                                    {client.companyName ||
                                                                        client.name ||
                                                                        `Client ${client.id.substring(0, 8)}...`}
                                                                </DropdownMenuItem>
                                                            ))
                                                    ) : (
                                                        <DropdownMenuItem disabled>
                                                            No clients available
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                        <td className="p-4">
                                            <Button
                                                variant='ghost'
                                                size='sm'
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/employee/${employee.id}`,
                                                    )
                                                }
                                            >
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}