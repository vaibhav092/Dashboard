import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs,
    orderBy,
    limit,
    writeBatch,
} from 'firebase/firestore';
import { useNavigate } from 'react-router';
import { auth, db } from '@/lib/Firebase';

// UI Components
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ExclamationTriangleIcon,
    TrashIcon,
    ExitIcon,
} from '@radix-ui/react-icons';

export default function OfficeLogin() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                startWorkSession(user.uid);
            } else {
                setCurrentUser(null);
                setTimerActive(false);
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        let interval;
        if (timerActive && currentUser) {
            interval = setInterval(async () => {
                try {
                    const workSessionsRef = collection(
                        db,
                        'users',
                        currentUser.uid,
                        'workSessions',
                    );
                    const q = query(
                        workSessionsRef,
                        where('status', '==', 'active'),
                        limit(1),
                    );
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const sessionData = querySnapshot.docs[0].data();
                        if (sessionData.startTime) {
                            const startTime = sessionData.startTime.toDate();
                            setElapsedTime(
                                Math.floor((new Date() - startTime) / 1000),
                            );
                        }
                    }
                } catch (err) {
                    console.error('Error fetching active session:', err);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, currentUser]);

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const doneWorkRef = collection(
            db,
            'users',
            currentUser.uid,
            'doneWork',
        );
        const q = query(doneWorkRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const tasksData = [];
                querySnapshot.forEach((doc) => {
                    tasksData.push({ ...doc.data(), id: doc.id });
                });
                const today = new Date().toISOString().split('T')[0];
                const todayTasks = tasksData.filter((task) => {
                    const createdAtDate = task.createdAt
                        ?.toDate?.()
                        .toISOString()
                        .split('T')[0];
                    return createdAtDate === today;
                });
                setTasks(todayTasks);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching tasks:', err);
                setError('Failed to fetch tasks. Please try again.');
                setLoading(false);
            },
        );
        return () => unsubscribe();
    }, [currentUser]);

    const startWorkSession = async (userId) => {
        const startTime = new Date();
        setTimerActive(true);
        try {
            const workSessionsRef = collection(
                db,
                'users',
                userId,
                'workSessions',
            );
            const q = query(
                workSessionsRef,
                where('status', '==', 'active'),
                limit(1),
            );
            const existingSession = await getDocs(q);
            if (existingSession.empty) {
                await addDoc(workSessionsRef, {
                    startTime: startTime,
                    status: 'active',
                    assignedClient: currentUser?.assignedClient || null,
                });
            }
        } catch (err) {
            console.error('Error starting work session:', err);
            setError('Failed to start work session.');
        }
    };

    const handleCheckout = async () => {
        if (!window.confirm('Are you sure you want to checkout?')) return;
        if (!currentUser) return;
        setTimerActive(false);
        try {
            const today = new Date().toISOString().split('T')[0];
            const hoursWorked = (elapsedTime / 3600).toFixed(2);
            const completedTasks = tasks.filter((task) => task.completed);
            const batch = writeBatch(db);

            const workSessionsRef = collection(
                db,
                'users',
                currentUser.uid,
                'workSessions',
            );
            const q = query(
                workSessionsRef,
                where('status', '==', 'active'),
                orderBy('startTime', 'desc'),
                limit(1),
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const sessionDoc = querySnapshot.docs[0];
                batch.update(sessionDoc.ref, {
                    endTime: serverTimestamp(),
                    durationSeconds: elapsedTime,
                    tasksCompletedCount: completedTasks.length,
                    status: 'completed',
                });
            }
            const dailySummaryRef = doc(
                db,
                'users',
                currentUser.uid,
                'workHours',
                today,
            );
            batch.set(
                dailySummaryRef,
                {
                    hours: hoursWorked,
                    date: today,
                    clientId: currentUser.assignedClient || null,
                },
                { merge: true },
            );

            await batch.commit();
            navigate('/report');
        } catch (err) {
            console.error('Error during checkout:', err);
            setError(`Checkout failed: ${err.message}`);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (newTask.trim() === '' || !currentUser) return;
        try {
            const doneWorkRef = collection(
                db,
                'users',
                currentUser.uid,
                'doneWork',
            );
            await addDoc(doneWorkRef, {
                text: newTask.trim(),
                completed: false,
                createdAt: serverTimestamp(),
                clientId: currentUser.assignedClient || null,
            });
            setNewTask('');
        } catch (err) {
            console.error('Error adding task:', err);
            setError('Failed to add task.');
        }
    };

    const handleToggleTask = async (taskId, currentStatus) => {
        if (!currentUser) return;
        const taskRef = doc(db, 'users', currentUser.uid, 'doneWork', taskId);
        try {
            await updateDoc(taskRef, { completed: !currentStatus });
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Failed to update task status.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!currentUser) return;
        const taskRef = doc(db, 'users', currentUser.uid, 'doneWork', taskId);
        try {
            await deleteDoc(taskRef);
        } catch (err) {
            console.error('Error deleting task:', err);
            setError('Failed to delete task.');
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className='flex justify-center p-4 min-h-screen'>
            <Card className='w-full max-w-2xl bg-black/20 backdrop-blur-lg border border-white/20 text-white mt-16 h-fit'>
                <CardHeader className='text-center'>
                    <div className='flex justify-between items-center'>
                        <div className='flex-1 text-left'>
                            <Button
                                variant='ghost'
                                onClick={handleCheckout}
                                className='text-red-400 hover:text-white hover:bg-red-500/20'
                            >
                                <ExitIcon className='mr-2 h-4 w-4' />
                                Checkout ({formatTime(elapsedTime)})
                            </Button>
                        </div>
                        <div className='flex-1'>
                            <CardTitle className='text-3xl'>
                                Daily Tasks
                            </CardTitle>
                        </div>
                        <div className='flex-1'></div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert
                            variant='destructive'
                            className='bg-red-900/50 text-red-300 border-red-500/50 mb-4'
                        >
                            <ExclamationTriangleIcon className='h-4 w-4' />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleAddTask} className='flex gap-2 mb-6'>
                        <textarea
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder='Describe your task...'
                            rows={3}
                            className='w-full rounded-md bg-white/10 border border-gray-600 p-2 placeholder:text-gray-400 focus:ring-indigo-500 text-white resize-none'
                        />
                        <Button
                            type='submit'
                            className='bg-indigo-600 hover:bg-indigo-700 text-white'
                        >
                            Add Task
                        </Button>
                    </form>
                    {loading ? (
                        <div className='text-center text-gray-300 py-4'>
                            Loading tasks...
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center p-3 rounded-md transition-all duration-300 ${task.completed ? 'bg-green-500/20 opacity-60' : 'bg-gray-500/20'}`}
                                    >
                                        <Checkbox
                                            id={`task-${task.id}`}
                                            checked={task.completed}
                                            onCheckedChange={() =>
                                                handleToggleTask(
                                                    task.id,
                                                    task.completed,
                                                )
                                            }
                                            className='mr-3 border-gray-400 data-[state=checked]:bg-green-500'
                                        />
                                        <label
                                            htmlFor={`task-${task.id}`}
                                            className={`flex-grow cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}
                                        >
                                            {task.text}
                                        </label>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            onClick={() =>
                                                handleDeleteTask(task.id)
                                            }
                                            className='text-gray-400 hover:bg-red-500/20 hover:text-red-300'
                                        >
                                            <TrashIcon className='h-4 w-4' />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className='text-center text-gray-400 py-4'>
                                    No tasks for today. Add one to get started!
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
