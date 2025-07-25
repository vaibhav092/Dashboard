import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/Firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ViewProfile() {
    const { id } = useParams(); // URL param
    const [userData, setUserData] = useState(null);
    const [doneWork, setDoneWork] = useState([]);
    const [workHours, setWorkHours] = useState([]);
    const [workSessions, setWorkSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userRef = doc(db, 'users', id);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setUserData(null);
                    return;
                }

                const user = userSnap.data();
                setUserData(user);

                const fetchSubcollection = async (sub) => {
                    const subRef = collection(db, 'users', id, sub);
                    const snap = await getDocs(subRef);
                    return snap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                };

                const [workList, hoursList, sessionsList] = await Promise.all([
                    fetchSubcollection('doneWork'),
                    fetchSubcollection('workHours'),
                    fetchSubcollection('workSessions'),
                ]);

                setDoneWork(workList);
                setWorkHours(hoursList);
                setWorkSessions(sessionsList);
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [id]);

    if (loading) {
        return (
            <div className='p-6 text-center text-gray-500'>
                Loading profile...
            </div>
        );
    }

    if (!userData) {
        return (
            <div className='p-6 text-center text-red-500'>
                Employee not found.
            </div>
        );
    }

    return (
        <div className='min-h-screen py-10 px-6 text-white'>
            <div className='max-w-5xl mx-auto space-y-6'>
                {/* User Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className='text-2xl'>
                            Employee Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                            <strong>Name:</strong> {userData.name || 'Unnamed'}
                        </div>
                        <div>
                            <strong>Email:</strong> {userData.email}
                        </div>
                        <div>
                            <strong>Department:</strong>{' '}
                            {userData.department || '-'}
                        </div>
                        <div>
                            <strong>Location:</strong>{' '}
                            {userData.location || '-'}
                        </div>
                        <div>
                            <strong>Job Title:</strong>{' '}
                            {userData.jobTitle || '-'}
                        </div>
                        <div>
                            <strong>Company:</strong>{' '}
                            {userData.companyName || '-'}
                        </div>
                        <div>
                            <strong>Client ID:</strong>{' '}
                            {userData.assignedClient || (
                                <span className='text-gray-400 italic'>
                                    Not assigned
                                </span>
                            )}
                        </div>
                        <div>
                            <strong>Bio:</strong> {userData.bio || '—'}
                        </div>
                        <div>
                            <strong>Active:</strong>{' '}
                            {userData.isActive ? '✅ Yes' : '❌ No'}
                        </div>
                    </CardContent>
                </Card>

                {/* Done Work */}
                <Card>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Tasks Completed ({doneWork.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        {doneWork.length === 0 ? (
                            <p className='text-gray-500'>No tasks completed.</p>
                        ) : (
                            <ul className='list-disc pl-6 space-y-1'>
                                {doneWork.map((task) => (
                                    <li key={task.id}>
                                        <span className='font-medium'>
                                            {task.text || 'Untitled task'}
                                        </span>{' '}
                                        <span className='text-sm text-gray-500'>
                                            (
                                            {task.createdAt
                                                ?.toDate?.()
                                                .toLocaleString() ||
                                                'Unknown time'}
                                            )
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Work Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Work Hours Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {workHours.length === 0 ? (
                            <p className='text-gray-500'>
                                No work hours logged.
                            </p>
                        ) : (
                            <ul className='list-disc pl-6 space-y-1'>
                                {workHours.map((hour) => (
                                    <li key={hour.id}>
                                        {hour.date || 'No date'}:{' '}
                                        <span className='font-semibold'>
                                            {parseFloat(hour.hours || '0')} hrs
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Work Sessions */}
                <Card>
                    <CardHeader>
                        <CardTitle className='text-lg'>
                            Work Sessions ({workSessions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {workSessions.length === 0 ? (
                            <p className='text-gray-500'>No sessions logged.</p>
                        ) : (
                            workSessions.map((session) => {
                                const start = session.startTime?.toDate?.();
                                const end = session.endTime?.toDate?.();
                                const duration = session.durationSeconds
                                    ? (
                                          parseFloat(session.durationSeconds) /
                                          3600
                                      ).toFixed(2)
                                    : '-';

                                return (
                                    <div
                                        key={session.id}
                                        className='border p-3 rounded-md bg-gray-100'
                                    >
                                        <div>
                                            <strong>Start:</strong>{' '}
                                            {start
                                                ? start.toLocaleString()
                                                : 'Unknown'}
                                        </div>
                                        <div>
                                            <strong>End:</strong>{' '}
                                            {end
                                                ? end.toLocaleString()
                                                : 'Ongoing'}
                                        </div>
                                        <div>
                                            <strong>Duration:</strong>{' '}
                                            {duration} hrs
                                        </div>
                                        <div>
                                            <strong>Tasks Completed:</strong>{' '}
                                            {session.tasksCompletedCount ?? '-'}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
