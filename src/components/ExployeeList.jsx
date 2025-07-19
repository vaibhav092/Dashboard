import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    collection,
    getDocs,
    query,
    orderBy,
    updateDoc,
    doc,
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

                setEmployees(
                    employeesSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })),
                );

                setClients(
                    clientsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })),
                );
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
            await updateDoc(doc(db, 'users', employeeId), {
                assignedClient: clientId,
            });
            setEmployees(
                employees.map((emp) =>
                    emp.id === employeeId
                        ? { ...emp, assignedClient: clientId }
                        : emp,
                ),
            );
            toast.success('Client assigned');
        } catch (error) {
            toast.error('Failed to assign client');
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
                        <Button
                            onClick={() => navigate('/admin/employees/add')}
                        >
                            <Plus className='mr-2 h-4 w-4' />
                            Add Employee
                        </Button>
                        <Button
                            variant='outline'
                            onClick={() => navigate('/admin/clients')}
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
                                                    {employee.assignedClient ||
                                                        'Assign Client'}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {clients.map((client) => (
                                                    <DropdownMenuItem
                                                        key={client.id}
                                                        onClick={() =>
                                                            assignClient(
                                                                employee.id,
                                                                client.id,
                                                            )
                                                        }
                                                    >
                                                        {client.name}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() =>
                                                navigate(
                                                    `/admin/employees/${employee.id}`,
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
