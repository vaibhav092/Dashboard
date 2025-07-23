import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { useNavigate } from 'react-router';

// --- Import your Firebase instances ---
import { auth, db } from '@/lib/Firebase';

// --- Import your shadcn/ui components ---
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon, TrashIcon, ExitIcon } from '@radix-ui/react-icons';

export default function OfficeLogin() {
    const navigate = useNavigate();
    const [todos, setTodos] = useState([]);
    const [completedTodos, setCompletedTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [workStartTime, setWorkStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timerActive, setTimerActive] = useState(true);

    // Effect to get the current user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                startWorkSession(user.uid);
            } else {
                setCurrentUser(null);
                setLoading(false);
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Effect for the work timer
    useEffect(() => {
        let interval;
        if (timerActive && workStartTime) {
            interval = setInterval(() => {
                setElapsedTime(Math.floor((new Date() - workStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive, workStartTime]);

    // Effect to fetch todos for the current user
    useEffect(() => {
        if (!currentUser) return;

        const todosCollectionRef = collection(db, 'users', currentUser.uid, 'todos');
        const q = query(todosCollectionRef);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const todosData = [];
            const completedData = [];
            querySnapshot.forEach((doc) => {
                const todo = { ...doc.data(), id: doc.id };
                todosData.push(todo);
                if (todo.completed) {
                    completedData.push(todo);
                }
            });
            todosData.sort((a, b) => (a.createdAt?.seconds > b.createdAt?.seconds) ? 1 : -1);
            setTodos(todosData);
            setCompletedTodos(completedData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching todos:", err);
            setError("Failed to fetch tasks. Please try again.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const startWorkSession = async (userId) => {
        const startTime = new Date();
        setWorkStartTime(startTime);
        setTimerActive(true);
        
        try {
            const workSessionsRef = collection(db, 'users', userId, 'workSessions');
            await addDoc(workSessionsRef, {
                startTime: startTime,
                status: 'active',
                tasksCompleted: 0,
            });
        } catch (err) {
            console.error("Error starting work session:", err);
        }
    };

    const handleCheckout = async () => {
        if (!currentUser) return;
        
        try {
            // Update the active work session
            const workSessionsRef = collection(db, 'users', currentUser.uid, 'workSessions');
            const q = query(workSessionsRef, orderBy('startTime', 'desc'), limit(1));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const latestSession = querySnapshot.docs[0];
                await updateDoc(latestSession.ref, {
                    endTime: new Date(),
                    duration: elapsedTime,
                    tasksCompleted: completedTodos.length,
                    status: 'completed',
                });
            }

            setTimerActive(false);
            navigate('/report');
        } catch (err) {
            console.error("Error during checkout:", err);
            setError("Failed to complete checkout. Please try again.");
        }
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (newTodo.trim() === '' || !currentUser) return;

        try {
            const todosCollectionRef = collection(db, 'users', currentUser.uid, 'todos');
            await addDoc(todosCollectionRef, {
                text: newTodo.trim(),
                completed: false,
                createdAt: serverTimestamp(),
            });
            setNewTodo('');
        } catch (err) {
            console.error("Error adding todo:", err);
            setError("Failed to add task.");
        }
    };

    const handleToggleTodo = async (todoId, currentStatus) => {
        if (!currentUser) return;
        const todoDocRef = doc(db, 'users', currentUser.uid, 'todos', todoId);
        try {
            await updateDoc(todoDocRef, {
                completed: !currentStatus,
            });
            
            if (!currentStatus) {
                const doneWorkRef = collection(db, 'users', currentUser.uid, 'doneWork');
                const todo = todos.find(t => t.id === todoId);
                if (todo) {
                    await addDoc(doneWorkRef, {
                        task: todo.text,
                        completedAt: serverTimestamp(),
                        workSessionDuration: elapsedTime,
                    });
                }
            }
        } catch (err) {
            console.error("Error updating todo:", err);
            setError("Failed to update task status.");
        }
    };

    const handleDeleteTodo = async (todoId) => {
        if (!currentUser) return;
        const todoDocRef = doc(db, 'users', currentUser.uid, 'todos', todoId);
        try {
            await deleteDoc(todoDocRef);
        } catch (err) {
            console.error("Error deleting todo:", err);
            setError("Failed to delete task.");
        }
    };

    return (
        <div className="flex justify-center p-4 font-sans">
            <Card className="w-full max-w-2xl bg-black/20 backdrop-blur-lg border border-white/20 text-white mt-16">
                <CardHeader className="text-center">
                    <div className="flex justify-between items-center">
                        <div className="flex-1 text-left">
                            <Button 
                                variant="ghost" 
                                onClick={handleCheckout}
                                className="text-gray-300 hover:text-white"
                            >
                                <ExitIcon className="mr-2 h-4 w-4" />
                                Checkout
                            </Button>
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-3xl">My Daily Tasks</CardTitle>
                            <CardDescription className="text-gray-300">Manage your tasks for the day.</CardDescription>
                        </div>
                        <div className="flex-1"></div> {/* Empty div for balance */}
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="bg-red-900/50 text-red-300 border-red-500/50 mb-4">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleAddTodo} className="flex gap-2 mb-6">
                        <Input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="Add a new task..."
                            className="bg-white/10 border-gray-600 placeholder:text-gray-400"
                        />
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Task</Button>
                    </form>

                    {loading ? (
                        <div className="text-center text-gray-300">Loading tasks...</div>
                    ) : (
                        <div className="space-y-3">
                            {todos.length > 0 ? (
                                todos.map((todo) => (
                                    <div
                                        key={todo.id}
                                        className={`flex items-center p-3 rounded-md transition-colors ${
                                            todo.completed ? 'bg-green-500/20' : 'bg-gray-500/20'
                                        }`}
                                    >
                                        <Checkbox
                                            id={`todo-${todo.id}`}
                                            checked={todo.completed}
                                            onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                                            className="mr-3 border-gray-400 data-[state=checked]:bg-green-500"
                                        />
                                        <label
                                            htmlFor={`todo-${todo.id}`}
                                            className={`flex-grow cursor-pointer ${
                                                todo.completed ? 'line-through text-gray-400' : ''
                                            }`}
                                        >
                                            {todo.text}
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteTodo(todo.id)}
                                            className="text-gray-400 hover:bg-red-500/20 hover:text-red-300"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 py-4">You have no tasks. Well done!</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}