'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    Timestamp,
    orderBy,
} from 'firebase/firestore';
import { auth, db } from '@/lib/Firebase';
import { Button } from '@/components/ui/button';

export default function Report() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNotes, setUserNotes] = useState('');
    const [clientName, setClientName] = useState('');
    const [taskError, setTaskError] = useState('');

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            const user = auth.currentUser;

            if (!user) {
                setTaskError('User not logged in');
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch user info
                const userDocRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userDocRef);

                if (!userSnap.exists()) {
                    setTaskError('User not found');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();
                const assignedClientId = userData.assignedClient;

                if (assignedClientId) {
                    // 2. Fetch client name using assignedClient
                    const clientDocRef = doc(db, 'clients', assignedClientId);
                    const clientSnap = await getDoc(clientDocRef);
                    if (clientSnap.exists()) {
                        setClientName(
                            clientSnap.data().name || 'Unnamed Client',
                        );
                    } else {
                        setClientName('Unnamed Client');
                    }
                } else {
                    setClientName('No client assigned');
                }

                // 3. Fetch tasks from doneWork for today
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date();
                endOfDay.setHours(23, 59, 59, 999);

                const tasksRef = collection(db, 'users', user.uid, 'doneWork');
                const q = query(
                    tasksRef,
                    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
                    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
                    orderBy('createdAt', 'desc'),
                );

                const querySnapshot = await getDocs(q);

                const taskList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                }));

                setTasks(taskList);
            } catch (error) {
                console.error('Error fetching report:', error);
                setTaskError('Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const handleGenerateReport = () => {
        alert('📝 PDF report generation coming soon!');
        // You can plug in PDFMake, jsPDF, or server-side PDF logic here.
    };

    return (
        <div className='min-h-screen text-white px-4 py-6 pt-24'>
            <div className='max-w-3xl mx-auto'>
                <h1 className='text-3xl font-bold mb-4'>
                    🗂️ Daily Work Report
                </h1>

                {/* Client Info */}
                <div className='mb-6'>
                    <p className='text-sm font-medium'>
                        <span className='font-semibold'>Client:</span>{' '}
                        {clientName}
                    </p>
                </div>

                {/* Task List */}
                {loading ? (
                    <p className='text-gray-500'>Loading tasks...</p>
                ) : taskError ? (
                    <p className='text-red-500'>{taskError}</p>
                ) : tasks.length === 0 ? (
                    <p className='text-gray-600'>No tasks completed today.</p>
                ) : (
                    <ul className='mb-6 divide-y border rounded overflow-hidden'>
                        {tasks.map((task) => (
                            <li key={task.id} className='p-4 bg-black'>
                                <div className='flex justify-between items-center'>
                                    <p className='text-base font-medium'>
                                        {task.text}
                                    </p>
                                    <span className='text-sm text-gray-500'>
                                        {task.createdAt?.toLocaleTimeString(
                                            [],
                                            {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            },
                                        )}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Notes Section */}
                <div className='mb-4'>
                    <label className='block text-sm font-semibold mb-2'>
                        ✍️ Notes / Feedback
                    </label>
                    <textarea
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder='Write your summary or thoughts for today...'
                        className='w-full p-3 border rounded-md text-sm resize-none h-40'
                    />
                </div>

                {/* ShadCN Button */}
                <Button onClick={handleGenerateReport} className='mt-4'>
                    📄 Generate Report
                </Button>
            </div>
        </div>
    );
}
