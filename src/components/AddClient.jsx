import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    doc,
    setDoc,
    serverTimestamp,
    collection,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/Firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

export default function AddClient() {
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
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
        { value: 'UTC', label: 'Coordinated Universal Time (UTC±00:00)' }, // Generic UTC option
        // You can add more specific timezones as needed
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
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
        const firestorePlanEndDate = Timestamp.fromDate(planEndDate); // Convert to Firestore Timestamp

        try {
            const clientRef = doc(collection(db, 'clients'));
            await setDoc(clientRef, {
                ...formData,
                techStack: finalTechStack,
                otherTechStack: null, // Ensure this is not saved if 'Other' is not selected or specified
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                planEndDate: firestorePlanEndDate, // Store the calculated end date
            });

            toast.success(`Client ${formData.name} created successfully`, {
                id: toastId,
            });
            navigate('/admin/client');
        } catch (error) {
            toast.error(`Failed: ${error.message}`, { id: toastId });
        } finally {
            setLoading(false);
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

    return (
        <div className='flex min-h-screen items-center justify-center p-4'>
            <Card className='w-full max-w-2xl'>
                <CardHeader>
                    <CardTitle className='text-2xl font-bold'>
                        Add New Client
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <Label htmlFor='name'>Client Name *</Label>
                                <Input
                                    id='name'
                                    name='name'
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor='country'>Country *</Label>
                                <Input
                                    id='country'
                                    name='country'
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor='state'>State/Region</Label>
                                <Input
                                    id='state'
                                    name='state'
                                    value={formData.state}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <Label htmlFor='timezone'>Timezone *</Label>
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

                        {/* Plan and Business Type now take full rows */}
                        <div>
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

                        <div>
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
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Tech Stack</Label>
                            <div className='flex flex-wrap gap-2 mt-2'>
                                {techStackOptions.map((tech) => (
                                    <Button
                                        key={tech}
                                        variant={
                                            formData.techStack.includes(tech)
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

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Add Client'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
