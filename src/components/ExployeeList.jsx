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
} from 'firebase/firestore';
import { db } from '@/lib/Firebase';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
        const checkInitialLoad = () => {
            if (employees.length >= 0 && clients.length >= 0) {
                setLoading(false);
            }
        };

        // Use a timeout to ensure loading state is properly managed
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 3000); // Fallback timeout

        checkInitialLoad();

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

    const toggleStatus = async (employeeId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'users', employeeId), {
                isActive: !currentStatus,
            });
            toast.success('Status updated');
            // State will be updated automatically via the real-time listener
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const assignClient = async (employeeId, clientId) => {
        try {
            // First, verify the client exists
            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);
            
            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            const userRef = doc(db, 'users', employeeId);

            // Get current assigned employees for the client
            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = [
                ...new Set([...currentEmployees, employeeId])
            ];

            // Update both employee and client documents
            await Promise.all([
                updateDoc(userRef, {
                    assignedClient: clientId,
                    companyName: clientSnap.data().name, // Update company name as well
                }),
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                })
            ]);

            toast.success('Client assigned successfully');
            // State will be updated automatically via the real-time listeners
        } catch (error) {
            console.error('Error assigning client:', error);
            toast.error('Failed to assign client');
        }
    };

    const unassignClient = async (employeeId, clientId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const userRef = doc(db, 'users', employeeId);

            // Get current client data
            const clientSnap = await getDoc(clientRef);
            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = currentEmployees.filter(id => id !== employeeId);

            // Update both documents
            await Promise.all([
                updateDoc(userRef, {
                    assignedClient: null, // Remove client assignment
                    companyName: null, // Remove company name as well
                }),
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                })
            ]);

            toast.success('Client unassigned successfully');
            // State will be updated automatically via the real-time listeners
        } catch (error) {
            console.error('Error unassigning client:', error);
            toast.error('Failed to unassign client');
        }
    };

    // Helper function to get client display name
    const getClientDisplayName = (assignedClientId) => {
        if (!assignedClientId) return 'Assign Client';
        
        const assignedClient = clients.find((c) => c.id === assignedClientId);
        
        if (assignedClient) {
            // Priority: name > companyName > fallback (based on your DB structure)
            return assignedClient.name || assignedClient.companyName || 'Unnamed Client';
        } else {
            // Client not found in the fetched clients
            return `Client Not Found (${assignedClientId.substring(0, 8)}...)`;
        }
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
                        <Button onClick={() => navigate('/admin/employee/add')}>
                            <Plus className='mr-2 h-4 w-4' />
                            Add Employee
                        </Button>
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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell className='font-medium'>
                                        {employee.name}
                                    </TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                    <TableCell>
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}