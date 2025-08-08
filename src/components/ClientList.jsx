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
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/Firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Loader2, Plus, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function ClientsList() {
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [addClientLoading, setAddClientLoading] = useState(false);
    const navigate = useNavigate();

    // Add Client Form State
    const [formData, setFormData] = useState({
        name: '',
        country: '',
        state: '',
        timezone: '',
        plan: '',
        businessType: '',
        techStack: [],
        otherTechStack: '',
        assignedEmployees: [],
    });

    // Updated timezone options with country/continent/city context
    const timezoneOptions = [
        {
            value: 'America/New_York',
            label: 'North America (USA) - New York (UTC-05:00)',
        },
        {
            value: 'America/Los_Angeles',
            label: 'North America (USA) - Los Angeles (UTC-08:00)',
        },
        {
            value: 'America/Chicago',
            label: 'North America (USA) - Chicago (UTC-06:00)',
        },
        {
            value: 'America/Toronto',
            label: 'North America (Canada) - Toronto (UTC-05:00)',
        },
        { value: 'Europe/London', label: 'Europe (UK) - London (UTC+00:00)' },
        { value: 'Europe/Paris', label: 'Europe (France) - Paris (UTC+01:00)' },
        {
            value: 'Europe/Berlin',
            label: 'Europe (Germany) - Berlin (UTC+01:00)',
        },
        { value: 'Asia/Kolkata', label: 'Asia (India) - Kolkata (UTC+05:30)' },
        { value: 'Asia/Tokyo', label: 'Asia (Japan) - Tokyo (UTC+09:00)' },
        {
            value: 'Asia/Shanghai',
            label: 'Asia (China) - Shanghai (UTC+08:00)',
        },
        {
            value: 'Australia/Sydney',
            label: 'Australia (Australia) - Sydney (UTC+10:00)',
        },
        { value: 'Africa/Cairo', label: 'Africa (Egypt) - Cairo (UTC+02:00)' },
        {
            value: 'Africa/Johannesburg',
            label: 'Africa (South Africa) - Johannesburg (UTC+02:00)',
        },
        {
            value: 'South_America/Sao_Paulo',
            label: 'South America (Brazil) - Sao Paulo (UTC-03:00)',
        },
        {
            value: 'Pacific/Auckland',
            label: 'Pacific (New Zealand) - Auckland (UTC+12:00)',
        },
        { value: 'UTC', label: 'Coordinated Universal Time (UTC±00:00)' },
    ];

    const businessTypes = [
        'SaaS',
        'E-commerce',
        'FinTech',
        'HealthTech',
        'EdTech',
        'Manufacturing',
        'Retail',
        'Other',
    ];

    const techStackOptions = ['React + Firebase', 'MERN', 'Java', 'Other'];

    const planOptions = [
        {
            value: 'Tech Launch Bundle',
            label: 'Tech Launch Bundle (₹1,245,000/Year)',
        },
        {
            value: 'Secure Tech Bundle',
            label: 'Secure Tech Bundle (₹1,411,000/Year)',
        },
        {
            value: 'Sales & Growth Bundle',
            label: 'Sales & Growth Bundle (₹1,091,244/Year)',
        },
        {
            value: 'Security & Growth Bundle',
            label: 'Security & Growth Bundle (₹1,343,070/Year)',
        },
        {
            value: 'Operations & Management Bundle',
            label: 'Operations & Management Bundle (₹1,175,186/Year)',
        },
        {
            value: 'Comprehensive Security Bundle',
            label: 'Comprehensive Security Bundle (₹1,594,896/Year)',
        },
        {
            value: 'Security & Tech Bundle',
            label: 'Security & Tech Bundle (₹1,510,954/Year)',
        },
        {
            value: 'Creative & Content Bundle',
            label: 'Creative & Content Bundle (₹1,007,302/Year)',
        },
        {
            value: 'Executive Leadership Bundle',
            label: 'Executive Leadership Bundle (₹1,846,722/Year)',
        },
        {
            value: 'Startup Essentials Bundle',
            label: 'Startup Essentials Bundle (₹1,385,041/Year)',
        },
    ];

    useEffect(() => {
        // Set up real-time listeners for both collections
        const unsubscribeClients = onSnapshot(
            query(collection(db, 'clients'), orderBy('createdAt', 'desc')),
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
            },
        );

        const unsubscribeEmployees = onSnapshot(
            query(collection(db, 'users')),
            (snapshot) => {
                const fetchedEmployees = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    name: doc.data().name,
                    email: doc.data().email,
                    assignedClient: doc.data().assignedClient,
                }));
                setEmployees(fetchedEmployees);
                console.log('Employees updated:', fetchedEmployees);
            },
            (error) => {
                console.error('Error fetching employees:', error);
                toast.error('Failed to load employees');
            },
        );

        // Use a timeout to ensure loading state is properly managed
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 3000); // Fallback timeout

        setLoading(false); // Set loading to false immediately since we're using real-time updates

        // Cleanup listeners on unmount
        return () => {
            unsubscribeClients();
            unsubscribeEmployees();
            clearTimeout(timeoutId);
        };
    }, []);

    const handleClientClick = (client) => {
        setSelectedClient(client);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            country: '',
            state: '',
            timezone: '',
            plan: '',
            businessType: '',
            techStack: [],
            otherTechStack: '',
            assignedEmployees: [],
        });
    };

    const handleAddClientSubmit = async (e) => {
        e.preventDefault();
        setAddClientLoading(true);
        const toastId = toast.loading('Creating client...');

        // Prepare techStack for submission
        let finalTechStack = [...formData.techStack];
        if (formData.techStack.includes('Other') && formData.otherTechStack) {
            finalTechStack = finalTechStack.filter((tech) => tech !== 'Other');
            finalTechStack.push(formData.otherTechStack);
        }

        // Calculate planEndDate: 365 days from now
        const now = new Date();
        const planEndDate = new Date(now.setDate(now.getDate() + 365));
        const firestorePlanEndDate = Timestamp.fromDate(planEndDate);

        try {
            const clientRef = doc(collection(db, 'clients'));
            await setDoc(clientRef, {
                ...formData,
                techStack: finalTechStack,
                otherTechStack: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                planEndDate: firestorePlanEndDate,
            });

            toast.success(`Client ${formData.name} created successfully`, {
                id: toastId,
            });

            // Reset form and close modal
            resetForm();
            setShowAddClientModal(false);
        } catch (error) {
            toast.error(`Failed: ${error.message}`, { id: toastId });
        } finally {
            setAddClientLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTechStackChange = (tech) => {
        setFormData((prev) => {
            const newTechStack = prev.techStack.includes(tech)
                ? prev.techStack.filter((t) => t !== tech)
                : [...prev.techStack, tech];

            if (!newTechStack.includes('Other')) {
                return { ...prev, techStack: newTechStack, otherTechStack: '' };
            }
            return { ...prev, techStack: newTechStack };
        });
    };

    const getPlanStatus = (planEndDate) => {
        if (!planEndDate)
            return {
                status: 'Unknown',
                className: 'bg-gray-200 text-gray-800',
            };

        const now = new Date();
        const endDate = planEndDate.toDate
            ? planEndDate.toDate()
            : new Date(planEndDate);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return { status: 'Expired', className: 'bg-red-100 text-red-800' };
        } else if (diffDays <= 30) {
            return {
                status: 'Expiring Soon',
                className: 'bg-yellow-100 text-yellow-800',
            };
        } else {
            return {
                status: 'Active',
                className: 'bg-green-100 text-green-800',
            };
        }
    };

    const assignEmployee = async (clientId, employeeId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const userRef = doc(db, 'users', employeeId);

            // Get current data
            const [clientSnap, userSnap] = await Promise.all([
                getDoc(clientRef),
                getDoc(userRef),
            ]);

            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            if (!userSnap.exists()) {
                toast.error('Employee not found');
                return;
            }

            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = [
                ...new Set([...currentEmployees, employeeId]),
            ];

            // Update both documents
            await Promise.all([
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                }),
                updateDoc(userRef, {
                    assignedClient: clientId,
                    companyName: clientSnap.data().name,
                }),
            ]);

            toast.success('Employee assigned successfully!');
        } catch (error) {
            console.error('Error assigning employee:', error);
            toast.error(`Failed to assign employee: ${error.message}`);
        }
    };

    const removeEmployee = async (clientId, employeeId) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            const userRef = doc(db, 'users', employeeId);

            const clientSnap = await getDoc(clientRef);
            if (!clientSnap.exists()) {
                toast.error('Client not found');
                return;
            }

            const currentEmployees = clientSnap.data().assignedEmployees || [];
            const updatedAssignedEmployees = currentEmployees.filter(
                (id) => id !== employeeId,
            );

            // Update both documents
            await Promise.all([
                updateDoc(clientRef, {
                    assignedEmployees: updatedAssignedEmployees,
                }),
                updateDoc(userRef, {
                    assignedClient: null,
                    companyName: null,
                }),
            ]);

            toast.success('Employee removed successfully!');
        } catch (error) {
            console.error('Error removing employee:', error);
            toast.error(`Failed to remove employee: ${error.message}`);
        }
    };

    // Helper function to check if employee is already assigned to another client
    const isEmployeeAssignedToOtherClient = (employeeId, currentClientId) => {
        const employee = employees.find((emp) => emp.id === employeeId);
        return (
            employee?.assignedClient &&
            employee.assignedClient !== currentClientId
        );
    };

    if (loading) {
        return (
            <div className='flex justify-center p-8'>
                <Loader2 className='animate-spin text-blue-500' size={48} />
            </div>
        );
    }

    return (
        <div className={`container mx-auto py-8`}>
            <Card className='shadow-xl border-gray-200 rounded-lg'>
                <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
                    <CardTitle className='text-3xl font-bold text-gray-800'>
                        Client Management
                    </CardTitle>
                    <div className='flex items-center space-x-4'>
                        <Button
                            onClick={() => setShowAddClientModal(true)}
                            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out'
                        >
                            <Plus className='mr-2 h-4 w-4' /> Add Client
                        </Button>
                        <Button
                            variant='outline'
                            onClick={() => navigate('/admin/employee')}
                        >
                            <UserPlus className='mr-2 h-4 w-4' />
                            Manage Employees
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='p-6'>
                    {clients.length === 0 ? (
                        <p className='text-center text-gray-500 text-lg py-10'>
                            No clients added yet. Click "Add Client" to get
                            started!
                        </p>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                            {clients.map((client) => {
                                const status = getPlanStatus(
                                    client.planEndDate,
                                );
                                return (
                                    <Card
                                        key={client.id}
                                        className='border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-white flex flex-col'
                                    >
                                        <CardHeader className='pb-3 bg-gray-50 border-b border-gray-200 flex-grow'>
                                            <CardTitle
                                                className='text-lg font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600'
                                                onClick={() =>
                                                    handleClientClick(client)
                                                }
                                            >
                                                {client.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className='p-4 text-sm text-gray-700 space-y-2 flex-grow'>
                                            <p>
                                                <strong>Country:</strong>{' '}
                                                {client.country}
                                            </p>
                                            <p>
                                                <strong>Business Type:</strong>{' '}
                                                {client.businessType}
                                            </p>
                                            <p>
                                                <strong>Plan:</strong>{' '}
                                                {client.plan}
                                            </p>
                                            <p>
                                                <strong>Status:</strong>{' '}
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                                                >
                                                    {status.status}
                                                </span>
                                            </p>
                                            <p>
                                                <strong>Assigned:</strong>{' '}
                                                {client.assignedEmployees &&
                                                client.assignedEmployees
                                                    .length > 0
                                                    ? client.assignedEmployees.map(
                                                          (empId) => {
                                                              const emp =
                                                                  employees.find(
                                                                      (e) =>
                                                                          e.id ===
                                                                          empId,
                                                                  );
                                                              return emp ? (
                                                                  <span
                                                                      key={
                                                                          empId
                                                                      }
                                                                      className='inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 mb-1'
                                                                  >
                                                                      {emp.name}
                                                                  </span>
                                                              ) : null;
                                                          },
                                                      )
                                                    : 'None'}
                                            </p>
                                        </CardContent>
                                        <CardFooter className='p-4 pt-0 text-xs text-gray-500 border-t border-gray-100 flex justify-between items-center'>
                                            {client.planEndDate && (
                                                <p>
                                                    Ends:{' '}
                                                    {client.planEndDate.toDate
                                                        ? client.planEndDate
                                                              .toDate()
                                                              .toLocaleDateString()
                                                        : new Date(
                                                              client.planEndDate,
                                                          ).toLocaleDateString()}
                                                </p>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant='outline'
                                                        size='sm'
                                                    >
                                                        <UserPlus className='mr-2 h-4 w-4' />{' '}
                                                        Assign/Remove
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {employees.length === 0 ? (
                                                        <DropdownMenuItem
                                                            disabled
                                                        >
                                                            No employees
                                                            available
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <>
                                                            {employees
                                                                .filter(
                                                                    (
                                                                        employee,
                                                                    ) =>
                                                                        !client.assignedEmployees?.includes(
                                                                            employee.id,
                                                                        ),
                                                                )
                                                                .map(
                                                                    (
                                                                        employee,
                                                                    ) => {
                                                                        const isAssignedElsewhere =
                                                                            isEmployeeAssignedToOtherClient(
                                                                                employee.id,
                                                                                client.id,
                                                                            );
                                                                        return (
                                                                            <DropdownMenuItem
                                                                                key={
                                                                                    employee.id
                                                                                }
                                                                                onClick={() =>
                                                                                    assignEmployee(
                                                                                        client.id,
                                                                                        employee.id,
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isAssignedElsewhere
                                                                                }
                                                                            >
                                                                                <UserPlus className='mr-2 h-4 w-4' />{' '}
                                                                                Assign{' '}
                                                                                {
                                                                                    employee.name
                                                                                }
                                                                                {isAssignedElsewhere && (
                                                                                    <span className='text-xs text-gray-500 ml-2'>
                                                                                        (Already
                                                                                        assigned)
                                                                                    </span>
                                                                                )}
                                                                            </DropdownMenuItem>
                                                                        );
                                                                    },
                                                                )}
                                                            {client.assignedEmployees &&
                                                                client
                                                                    .assignedEmployees
                                                                    .length >
                                                                    0 && (
                                                                    <>
                                                                        <DropdownMenuSeparator />
                                                                        {client.assignedEmployees.map(
                                                                            (
                                                                                empId,
                                                                            ) => {
                                                                                const emp =
                                                                                    employees.find(
                                                                                        (
                                                                                            e,
                                                                                        ) =>
                                                                                            e.id ===
                                                                                            empId,
                                                                                    );
                                                                                return emp ? (
                                                                                    <DropdownMenuItem
                                                                                        key={`remove-${empId}`}
                                                                                        onClick={() =>
                                                                                            removeEmployee(
                                                                                                client.id,
                                                                                                empId,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <UserMinus className='mr-2 h-4 w-4 text-red-500' />{' '}
                                                                                        Remove{' '}
                                                                                        {
                                                                                            emp.name
                                                                                        }
                                                                                    </DropdownMenuItem>
                                                                                ) : null;
                                                                            },
                                                                        )}
                                                                    </>
                                                                )}
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Client Modal */}
                    <Dialog
                        open={showAddClientModal}
                        onOpenChange={(open) => {
                            setShowAddClientModal(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-black'>
                            <DialogHeader className='border-b pb-4 mb-4 border-gray-200'>
                                <DialogTitle className='text-2xl font-bold'>
                                    Add New Client
                                </DialogTitle>
                                <DialogDescription className='text-gray-600'>
                                    Fill in the details to add a new client to
                                    your system.
                                </DialogDescription>
                            </DialogHeader>

                            <form
                                onSubmit={handleAddClientSubmit}
                                className='space-y-6'
                            >
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                    <div className='pb-2'>
                                        <Label htmlFor='name'>
                                            Client Name *
                                        </Label>
                                        <Input
                                            id='name'
                                            name='name'
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className='pb-2'>
                                        <Label htmlFor='country'>
                                            Country *
                                        </Label>
                                        <Input
                                            id='country'
                                            name='country'
                                            value={formData.country}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className='pb-2'>
                                        <Label htmlFor='state'>
                                            State/Region
                                        </Label>
                                        <Input
                                            id='state'
                                            name='state'
                                            value={formData.state}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className='pb-2'>
                                        <Label htmlFor='timezone'>
                                            Timezone *
                                        </Label>
                                        <Select
                                            name='timezone'
                                            value={formData.timezone}
                                            onValueChange={(value) =>
                                                setFormData({
                                                    ...formData,
                                                    timezone: value,
                                                })
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select timezone' />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timezoneOptions.map((tz) => (
                                                    <SelectItem
                                                        key={tz.value}
                                                        value={tz.value}
                                                    >
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className='pb-2'>
                                    <Label htmlFor='plan'>Plan *</Label>
                                    <Select
                                        name='plan'
                                        value={formData.plan}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                plan: value,
                                            })
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Select plan' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {planOptions.map((plan) => (
                                                <SelectItem
                                                    key={plan.value}
                                                    value={plan.value}
                                                >
                                                    {plan.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='pb-2'>
                                    <Label htmlFor='businessType'>
                                        Business Type *
                                    </Label>
                                    <Select
                                        name='businessType'
                                        value={formData.businessType}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                businessType: value,
                                            })
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder='Select business type' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {businessTypes.map((type) => (
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                >
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className='pb-2'>
                                    <Label>Tech Stack</Label>
                                    <div className='flex flex-wrap gap-2 mt-2'>
                                        {techStackOptions.map((tech) => (
                                            <Button
                                                key={tech}
                                                variant={
                                                    formData.techStack.includes(
                                                        tech,
                                                    )
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                type='button'
                                                onClick={() =>
                                                    handleTechStackChange(tech)
                                                }
                                                className='h-8 px-3 text-xs'
                                            >
                                                {tech}
                                            </Button>
                                        ))}
                                    </div>
                                    {formData.techStack.includes('Other') && (
                                        <div className='mt-4'>
                                            <Label htmlFor='otherTechStack'>
                                                Please specify other tech stack
                                            </Label>
                                            <Input
                                                id='otherTechStack'
                                                name='otherTechStack'
                                                value={formData.otherTechStack}
                                                onChange={handleChange}
                                                required={formData.techStack.includes(
                                                    'Other',
                                                )}
                                                placeholder='e.g., Go, Rust, PostgreSQL'
                                            />
                                        </div>
                                    )}
                                </div>

                                <DialogFooter className='pt-4 border-t border-gray-200 flex gap-2'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={() => {
                                            setShowAddClientModal(false);
                                            resetForm();
                                        }}
                                        disabled={addClientLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type='submit'
                                        disabled={addClientLoading}
                                        className='bg-blue-600 hover:bg-blue-700 text-white'
                                    >
                                        {addClientLoading ? (
                                            <>
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                                Creating...
                                            </>
                                        ) : (
                                            'Add Client'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Client Details Modal */}
                    <Dialog
                        open={!!selectedClient}
                        onOpenChange={() => setSelectedClient(null)}
                    >
                        <DialogContent className='sm:max-w-[425px] bg-white p-6'>
                            <DialogHeader className='border-b pb-4 mb-4 border-gray-200'>
                                <DialogTitle className='text-2xl font-bold'>
                                    {selectedClient?.name}
                                </DialogTitle>
                                <DialogDescription className='text-gray-600'>
                                    Detailed information for this client.
                                </DialogDescription>
                            </DialogHeader>
                            {selectedClient && (
                                <div className='grid gap-4 py-4 text-gray-700'>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Country:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.country}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            State/Region:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.state || 'N/A'}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Timezone:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.timezone}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Business Type:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.businessType}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Plan:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.plan}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Plan End Date:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.planEndDate
                                                ? selectedClient.planEndDate
                                                      .toDate
                                                    ? selectedClient.planEndDate
                                                          .toDate()
                                                          .toLocaleDateString()
                                                    : new Date(
                                                          selectedClient.planEndDate,
                                                      ).toLocaleDateString()
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Plan Status:
                                        </Label>
                                        <span
                                            className={`col-span-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getPlanStatus(selectedClient.planEndDate).className}`}
                                        >
                                            {
                                                getPlanStatus(
                                                    selectedClient.planEndDate,
                                                ).status
                                            }
                                        </span>
                                    </div>
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Tech Stack:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.techStack?.join(
                                                ', ',
                                            ) || 'N/A'}
                                        </span>
                                    </div>
                                    {selectedClient.otherTechStack && (
                                        <div className='grid grid-cols-3 items-center gap-4'>
                                            <Label className='text-right font-medium'>
                                                Other Tech:
                                            </Label>
                                            <span className='col-span-2'>
                                                {selectedClient.otherTechStack}
                                            </span>
                                        </div>
                                    )}
                                    <div className='grid grid-cols-3 items-center gap-4'>
                                        <Label className='text-right font-medium'>
                                            Assigned Employees:
                                        </Label>
                                        <span className='col-span-2'>
                                            {selectedClient.assignedEmployees &&
                                            selectedClient.assignedEmployees
                                                .length > 0
                                                ? selectedClient.assignedEmployees.map(
                                                      (empId) => {
                                                          const emp =
                                                              employees.find(
                                                                  (e) =>
                                                                      e.id ===
                                                                      empId,
                                                              );
                                                          return emp ? (
                                                              <span
                                                                  key={empId}
                                                                  className='inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-1 mb-1'
                                                              >
                                                                  {emp.name}
                                                              </span>
                                                          ) : null;
                                                      },
                                                  )
                                                : 'None'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <DialogFooter className='pt-4 border-t border-gray-200'>
                                <Button
                                    onClick={() => setSelectedClient(null)}
                                    className='bg-blue-600 hover:bg-blue-700 text-white'
                                >
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
