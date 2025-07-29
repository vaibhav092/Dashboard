import { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsPDF } from 'jspdf';
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
    const [generating, setGenerating] = useState(false);
    const [totalHours, setTotalHours] = useState(0);

    // Initialize Gemini API with Vite environment variable
    const genAI = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY || '',
    );

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
                    hours: doc.data().hours || 0,
                }));

                setTasks(taskList);

                // 4. Fetch work hours from workHours collection for today
                const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
                const workHoursRef = doc(
                    db,
                    'users',
                    user.uid,
                    'workHours',
                    today,
                );
                const workHoursSnap = await getDoc(workHoursRef);

                let totalWorkHours = 0;
                if (workHoursSnap.exists()) {
                    const workHoursData = workHoursSnap.data();
                    // Convert string hours to number
                    totalWorkHours = parseFloat(workHoursData.hours || '0');
                }

                setTotalHours(totalWorkHours);
            } catch (error) {
                console.error('Error fetching report:', error);
                setTaskError('Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const generateReportContent = async () => {
        try {
            setGenerating(true);

            // Initialize with correct API version
            const genAI = new GoogleGenerativeAI(
                import.meta.env.VITE_GEMINI_API_KEY || '',
            );

            // Use the correct model name for current API
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash', // Updated to use available model
            });

            // Prepare the prompt
            const prompt = `
        Generate a professional daily work report in Markdown format based on the following details:
        
        Client: ${clientName}
        Date: ${new Date().toLocaleDateString()}
        Total Hours Worked: ${totalHours.toFixed(2)}
        
        Completed Tasks:
        ${tasks.map((task) => `- ${task.text} (completed at ${task.createdAt?.toLocaleTimeString()})`).join('\n')}
        
        Notes: ${userNotes}
        
        Please format this as a comprehensive daily report with sections for:
        1. Header with date, client, and total hours
        2. Task summary
        3. Key accomplishments
        4. Notes/observations
        5. Next steps (if any)
        
        Include the total hours worked prominently in the report.
        Use professional business language and keep it concise.
    `;

            // Generate content
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Convert to PDF and download
            generatePDF(text);
        } catch (error) {
            console.error('Error generating report:', error);

            // More specific error handling
            if (error.message.includes('404')) {
                alert(
                    'AI model not found. Please check your API configuration.',
                );
            } else if (error.message.includes('API_KEY')) {
                alert('Invalid API key. Please check your Gemini API key.');
            } else {
                alert('Failed to generate report. Please try again.');
            }
        } finally {
            setGenerating(false);
        }
    };

    const generatePDF = (markdownContent) => {
        try {
            // Create a new PDF with A4 size
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let yPosition = 25;

            // Helper function to render a line with mixed bold/regular text
            const renderMixedLine = (doc, parts, startX, y) => {
                let currentX = startX;

                parts.forEach((part) => {
                    if (part.text.trim()) {
                        doc.setFont('helvetica', part.bold ? 'bold' : 'normal');
                        doc.text(part.text, currentX, y);
                        currentX += doc.getTextWidth(part.text);

                        // Add space if not the last part and text doesn't end with space
                        if (!part.text.endsWith(' ')) {
                            currentX += doc.getTextWidth(' ');
                        }
                    }
                });
            };

            // Helper function to add new page if needed
            const checkPageBreak = (requiredSpace = 15) => {
                if (yPosition + requiredSpace > pageHeight - margin) {
                    doc.addPage();
                    yPosition = 25;
                    return true;
                }
                return false;
            };

            // Add header with company branding
            doc.setFillColor(41, 128, 185); // Professional blue
            doc.rect(0, 0, pageWidth, 35, 'F');

            // Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('DAILY WORK REPORT', pageWidth / 2, 20, {
                align: 'center',
            });

            // Reset text color
            doc.setTextColor(0, 0, 0);
            yPosition = 50;

            // Report Info Box
            doc.setFillColor(248, 249, 250); // Light gray background
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'S');

            // Report details in columns
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Date:', margin + 5, yPosition + 5);
            doc.text('Client:', margin + 5, yPosition + 12);
            doc.text('Total Hours:', margin + 5, yPosition + 19);

            doc.setFont('helvetica', 'normal');
            doc.text(
                new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                margin + 25,
                yPosition + 5,
            );
            doc.text(clientName, margin + 25, yPosition + 12);

            // Highlight total hours
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 185);
            doc.text(
                `${totalHours.toFixed(2)} hours`,
                margin + 35,
                yPosition + 19,
            );
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            yPosition += 35;

            // Process markdown content with better formatting
            const lines = markdownContent.split('\n');

            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    yPosition += 3; // Small space for empty lines
                    return;
                }

                if (trimmedLine.startsWith('# ')) {
                    // Main heading
                    checkPageBreak(20);
                    yPosition += 8;

                    // Add separator line above heading
                    doc.setDrawColor(41, 128, 185);
                    doc.setLineWidth(1);
                    doc.line(
                        margin,
                        yPosition - 3,
                        pageWidth - margin,
                        yPosition - 3,
                    );

                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(41, 128, 185);
                    doc.text(trimmedLine.substring(2), margin, yPosition + 5);

                    doc.setTextColor(0, 0, 0);
                    yPosition += 15;
                } else if (trimmedLine.startsWith('## ')) {
                    // Subheading
                    checkPageBreak(15);
                    yPosition += 5;

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(52, 73, 94);
                    doc.text(trimmedLine.substring(3), margin, yPosition);

                    // Add underline
                    const textWidth = doc.getTextWidth(
                        trimmedLine.substring(3),
                    );
                    doc.setDrawColor(52, 73, 94);
                    doc.setLineWidth(0.5);
                    doc.line(
                        margin,
                        yPosition + 2,
                        margin + textWidth,
                        yPosition + 2,
                    );

                    doc.setTextColor(0, 0, 0);
                    yPosition += 12;
                } else if (trimmedLine.startsWith('### ')) {
                    // Sub-subheading
                    checkPageBreak(12);
                    yPosition += 3;

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(85, 85, 85);
                    doc.text(trimmedLine.substring(4), margin, yPosition);

                    doc.setTextColor(0, 0, 0);
                    yPosition += 10;
                } else if (
                    trimmedLine.startsWith('- ') ||
                    trimmedLine.startsWith('* ')
                ) {
                    // Bullet points
                    checkPageBreak(10);

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');

                    // Add bullet point
                    doc.setFillColor(41, 128, 185);
                    doc.circle(margin + 3, yPosition - 1, 1, 'F');

                    // Add text with proper wrapping
                    const bulletText = trimmedLine.substring(2);
                    const maxWidth = pageWidth - margin - 15;
                    const splitText = doc.splitTextToSize(bulletText, maxWidth);

                    splitText.forEach((textLine, i) => {
                        if (i > 0) checkPageBreak(6);
                        doc.text(textLine, margin + 8, yPosition);
                        yPosition += 6;
                    });

                    yPosition += 2; // Extra space after bullet
                } else if (trimmedLine.match(/^\d+\./)) {
                    // Numbered list
                    checkPageBreak(10);

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');

                    const maxWidth = pageWidth - margin - 15;
                    const splitText = doc.splitTextToSize(
                        trimmedLine,
                        maxWidth,
                    );

                    splitText.forEach((textLine, i) => {
                        if (i > 0) checkPageBreak(6);
                        doc.text(textLine, margin + 5, yPosition);
                        yPosition += 6;
                    });

                    yPosition += 2;
                } else if (trimmedLine.includes('**')) {
                    // Text with mixed bold formatting
                    checkPageBreak(8);

                    doc.setFontSize(11);

                    // Split text into parts (bold and regular)
                    const parts = [];
                    let currentIndex = 0;
                    let match;
                    const boldRegex = /\*\*(.*?)\*\*/g;

                    while ((match = boldRegex.exec(trimmedLine)) !== null) {
                        // Add text before bold part
                        if (match.index > currentIndex) {
                            parts.push({
                                text: trimmedLine.substring(
                                    currentIndex,
                                    match.index,
                                ),
                                bold: false,
                            });
                        }
                        // Add bold part
                        parts.push({
                            text: match[1],
                            bold: true,
                        });
                        currentIndex = match.index + match[0].length;
                    }

                    // Add remaining text after last bold part
                    if (currentIndex < trimmedLine.length) {
                        parts.push({
                            text: trimmedLine.substring(currentIndex),
                            bold: false,
                        });
                    }

                    // Render each part
                    let xPosition = margin;
                    const maxWidth = pageWidth - 2 * margin;
                    let currentLine = '';
                    let lineParts = [];

                    parts.forEach((part, partIndex) => {
                        const words = part.text.split(' ');

                        words.forEach((word, wordIndex) => {
                            const testLine =
                                currentLine + (currentLine ? ' ' : '') + word;
                            const testWidth = doc.getTextWidth(testLine);

                            if (testWidth > maxWidth && currentLine) {
                                // Render current line
                                renderMixedLine(
                                    doc,
                                    lineParts,
                                    margin,
                                    yPosition,
                                );
                                yPosition += 6;
                                checkPageBreak(6);

                                // Start new line
                                currentLine = word;
                                lineParts = [{ text: word, bold: part.bold }];
                            } else {
                                currentLine = testLine;
                                if (
                                    lineParts.length > 0 &&
                                    lineParts[lineParts.length - 1].bold ===
                                        part.bold
                                ) {
                                    // Same formatting, combine with previous part
                                    lineParts[lineParts.length - 1].text +=
                                        (lineParts[lineParts.length - 1].text
                                            ? ' '
                                            : '') + word;
                                } else {
                                    // Different formatting, add new part
                                    lineParts.push({
                                        text: word,
                                        bold: part.bold,
                                    });
                                }
                            }
                        });
                    });

                    // Render final line
                    if (currentLine) {
                        renderMixedLine(doc, lineParts, margin, yPosition);
                        yPosition += 6;
                    }

                    yPosition += 3;
                } else {
                    // Regular paragraph text
                    checkPageBreak(8);

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');

                    const maxWidth = pageWidth - 2 * margin;
                    const splitText = doc.splitTextToSize(
                        trimmedLine,
                        maxWidth,
                    );

                    splitText.forEach((textLine) => {
                        checkPageBreak(6);
                        doc.text(textLine, margin, yPosition);
                        yPosition += 6;
                    });

                    yPosition += 3; // Space after paragraph
                }
            });

            // Add footer
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);

                // Footer line
                if (yPosition > pageHeight - 30 || i > 1) {
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(
                        margin,
                        pageHeight - 25,
                        pageWidth - margin,
                        pageHeight - 25,
                    );
                }

                // Page number and generation info
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 15,
                    { align: 'right' },
                );
                doc.text(
                    `Generated on ${new Date().toLocaleString()}`,
                    margin,
                    pageHeight - 15,
                );
            }

            // Save the PDF with better filename
            const fileName = `Daily-Report-${clientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleGenerateReport = async () => {
        if (tasks.length === 0 && !userNotes) {
            alert('Please add some tasks or notes before generating a report');
            return;
        }

        await generateReportContent();
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
                    <p className='text-sm font-medium mt-2'>
                        <span className='font-semibold'>
                            Total Hours Today:
                        </span>{' '}
                        {totalHours.toFixed(2)}
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
                                    <div>
                                        <p className='text-base font-medium'>
                                            {task.text}
                                        </p>
                                        <p className='text-sm text-gray-400'>
                                            {task.hours || 0} hours
                                        </p>
                                    </div>
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
                <div className='mb-4 text-white'>
                    <label className='block text-sm font-semibold mb-2'>
                        ✍️ Notes / Feedback
                    </label>
                    <textarea
                        value={userNotes}
                        onChange={(e) => setUserNotes(e.target.value)}
                        placeholder='Write your summary or thoughts for today...'
                        className='w-full p-3 border rounded-md text-sm resize-none h-40 '
                    />
                </div>

                {/* Generate Report Button */}
                <Button
                    onClick={handleGenerateReport}
                    className='mt-4'
                    disabled={generating}
                >
                    {generating ? 'Generating Report...' : '📄 Generate Report'}
                </Button>
            </div>
        </div>
    );
}
