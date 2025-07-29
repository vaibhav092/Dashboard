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
        const fetchData = async () => {
            try {
                // Fetch employees
                const employeesQuery = query(
                    collection(db, 'users'),
                    orderBy('createdAt', 'desc'),
                );
                const employeesSnapshot = await getDocs(employeesQuery);

                // Fetch clients (from another collection)
                const clientsQuery = query(collection(db, 'clients'));
                const clientsSnapshot = await getDocs(clientsQuery);

                const fetchedEmployees = employeesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                const fetchedClients = clientsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Debug logging
                console.log('Fetched clients:', fetchedClients);
                console.log('Fetched employees:', fetchedEmployees);
                console.log('Employee assigned client IDs:', fetchedEmployees.map(emp => ({
                    name: emp.name,
                    assignedClient: emp.assignedClient
                })));
                
                // Check specific client
                const specificClient = fetchedClients.find(c => c.id === 'KYUgFp5jUoomyzqegmwd');
                console.log('Specific client KYUgFp5jUoomyzqegmwd:', specificClient);

                setEmployees(fetchedEmployees);
                setClients(fetchedClients);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const toggleStatus = async (employeeId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'users', employeeId), {
                isActive: !currentStatus,
            });
            setEmployees(
                employees.map((emp) =>
                    emp.id === employeeId
                        ? { ...emp, isActive: !currentStatus }
                        : emp,
                ),
            );
            toast.success('Status updated');
        } catch (error) {
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

            await updateDoc(doc(db, 'users', employeeId), {
                assignedClient: clientId,
            });

            const currentEmployees = clientSnap.data().assignedEmployees || [];

            await updateDoc(clientRef, {
                assignedEmployees: [
                    ...new Set([...currentEmployees, employeeId]),
                ],
            });

            // Update local state with the actual client data
            setEmployees(
                employees.map((emp) =>
                    emp.id === employeeId
                        ? { ...emp, assignedClient: clientId }
                        : emp,
                )
            );

            // Also update the clients state if needed
            const updatedClient = { id: clientSnap.id, ...clientSnap.data() };
            setClients(clients.map(c => c.id === clientId ? updatedClient : c));

            toast.success('Client assigned successfully');
        } catch (error) {
            toast.error('Failed to assign client');
            console.error('Error assigning client:', error);
        }
    };

    // Helper function to get client display name
    const getClientDisplayName = (assignedClientId) => {
        if (!assignedClientId) return 'Assign Client';
        
        const assignedClient = clients.find((c) => c.id === assignedClientId);
        
        console.log(`Looking for client ID: ${assignedClientId}`);
        console.log('Found client:', assignedClient);
        
        if (assignedClient) {
            // Priority: companyName > name > fallback
            return assignedClient.companyName || assignedClient.name || 'Unnamed Client';
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
                                                {clients.length > 0 ? (
                                                    clients.map((client) => (
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