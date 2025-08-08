import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ResponsiveContainer,
} from 'recharts';
import {
    Users,
    Building2,
    TrendingUp,
    UserCheck,
    Briefcase,
} from 'lucide-react';
import { db } from '../lib/Firebase.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [error, setError] = useState(null);

    const COLORS = [
        '#3B82F6',
        '#10B981',
        '#F59E0B',
        '#EF4444',
        '#8B5CF6',
        '#06B6D4',
        '#F472B6',
        '#14B8A6',
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const clientsRef = collection(db, 'clients');
                const employeesRef = collection(db, 'users');

                const [clientsSnapshot, employeesSnapshot] = await Promise.all([
                    getDocs(query(clientsRef, orderBy('createdAt', 'desc'))),
                    getDocs(query(employeesRef, orderBy('createdAt', 'desc'))),
                ]);

                const clientsData = clientsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt:
                        doc.data().createdAt?.toDate?.() ||
                        new Date(doc.data().createdAt),
                }));

                const employeesData = employeesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt:
                        doc.data().createdAt?.toDate?.() ||
                        new Date(doc.data().createdAt),
                    isProfileComplete:
                        doc.data().department &&
                        doc.data().department !== 'Unassigned',
                }));

                setClients(clientsData);
                setEmployees(employeesData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const totalClients = clients.length;
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((emp) => emp.isActive).length;
    const incompleteProfiles = employees.filter(
        (emp) => !emp.isProfileComplete,
    ).length;

    const departmentCounts = employees.reduce((acc, emp) => {
        const dept =
            emp.department && emp.department !== 'Unassigned'
                ? emp.department
                : 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});

    const departmentChartData = Object.entries(departmentCounts).map(
        ([name, value], index) => ({
            name,
            value,
            fill: COLORS[index % COLORS.length],
        }),
    );

    const businessTypeCounts = clients.reduce((acc, client) => {
        const type = client.businessType || 'Not Specified';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const formattedBusinessTypeData = Object.entries(businessTypeCounts).map(
        ([name, value], index) => ({
            name,
            value,
            fill: COLORS[index % COLORS.length],
        }),
    );

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div
            className='bg-gray-800 rounded-lg p-4 border-l-4 border-opacity-80'
            style={{ borderLeftColor: color }}
        >
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs font-medium text-gray-300 uppercase tracking-wider'>
                        {title}
                    </p>
                    <p className='text-xl font-semibold text-white mt-1'>
                        {value}
                    </p>
                    {subtitle && (
                        <p className='text-xs text-gray-400 mt-1'>{subtitle}</p>
                    )}
                </div>
                <div
                    className='p-2 rounded-full'
                    style={{ backgroundColor: color + '20' }}
                >
                    <Icon className='h-5 w-5' style={{ color }} />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className='min-h-screen bg-gray-900 flex items-center justify-center text-white'>
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className='min-h-screen bg-gray-900 flex items-center justify-center text-red-500'>
                Error: {error}
            </div>
        );
    }

    return (
        <div className='min-h-screen p-4 md:p-6'>
            <div className='max-w-full mx-auto'>
                {/* Header */}
                <div className='mb-6'>
                    <h1 className='text-xl font-semibold text-white'>
                        Admin Dashboard
                    </h1>
                    <p className='text-gray-400 text-sm'>
                        Overview of your business metrics
                    </p>
                </div>

                {/* Stats Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                    <StatCard
                        title='Total Clients'
                        value={totalClients}
                        icon={Building2}
                        color='#3B82F6'
                    />
                    <StatCard
                        title='Total Employees'
                        value={totalEmployees}
                        icon={Users}
                        color='#10B981'
                        subtitle={`${incompleteProfiles} incomplete`}
                    />
                    <StatCard
                        title='Active Employees'
                        value={activeEmployees}
                        icon={UserCheck}
                        color='#F59E0B'
                    />
                </div>

                {/* Charts Grid */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                    {/* Department Distribution */}
                    <div className='bg-gray-900 border border-gray-700 rounded-lg p-4'>
                        <h3 className='text-sm font-medium text-white mb-3 flex items-center'>
                            <Briefcase className='h-4 w-4 mr-2 text-blue-400' />
                            Department Distribution
                        </h3>
                        <div className='h-[450px] w-full px-4'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart
                                    data={departmentChartData}
                                    layout='vertical'
                                    margin={{
                                        top: 10,
                                        right: 30,
                                        left: 10,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray='3 3'
                                        opacity={0.1}
                                        horizontal={false}
                                        stroke='#4B5563'
                                    />
                                    <XAxis type='number' hide />
                                    <YAxis
                                        dataKey='name'
                                        type='category'
                                        width={140}
                                        tick={{ fontSize: 13, fill: '#D1D5DB' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            borderColor: '#374151',
                                        }}
                                        itemStyle={{ color: '#F3F4F6' }}
                                        labelStyle={{ color: '#9CA3AF' }}
                                    />
                                    <Bar dataKey='value' barSize={22}>
                                        {departmentChartData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                />
                                            ),
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Business Type Distribution */}
                    <div className='bg-gray-900 border border-gray-700 rounded-lg p-4'>
                        <h3 className='text-sm font-medium text-white mb-3 flex items-center'>
                            <TrendingUp className='h-4 w-4 mr-2 text-green-400' />
                            Client Business Types
                        </h3>
                        <div className='h-[450px] w-full px-4'>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart
                                    data={formattedBusinessTypeData}
                                    layout='vertical'
                                    margin={{
                                        top: 10,
                                        right: 30,
                                        left: 10,
                                        bottom: 10,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray='3 3'
                                        opacity={0.1}
                                        horizontal={false}
                                        stroke='#4B5563'
                                    />
                                    <XAxis type='number' hide />
                                    <YAxis
                                        dataKey='name'
                                        type='category'
                                        width={140}
                                        tick={{ fontSize: 13, fill: '#D1D5DB' }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            borderColor: '#374151',
                                        }}
                                        itemStyle={{ color: '#F3F4F6' }}
                                        labelStyle={{ color: '#9CA3AF' }}
                                    />
                                    <Bar dataKey='value' barSize={22}>
                                        {formattedBusinessTypeData.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                />
                                            ),
                                        )}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
