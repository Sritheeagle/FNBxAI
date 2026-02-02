import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegister from './Components/LoginRegister/LoginRegister';
import StudentDashboard from './Components/StudentDashboard/StudentDashboard';
import SemesterNotes from './Components/StudentDashboard/Sections/SemesterNotes';
import AdminDashboard from './Components/AdminDashboard/AdminDashboard';
import FacultyDashboard from './Components/FacultyDashboard/FacultyDashboard';
import AdvancedLearning from './Components/StudentDashboard/Sections/AdvancedLearning';
import './App.css';
import RocketSplash from './Components/RocketSplash/RocketSplash';
import CommandPalette from './Components/CommandPalette/CommandPalette';

import GlobalNotifications from './Components/GlobalNotifications/GlobalNotifications';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isFaculty, setIsFaculty] = useState(false);
    const [facultyData, setFacultyData] = useState(null);
    const [isCmdOpen, setIsCmdOpen] = useState(false);

    // Global Key Listeners
    useEffect(() => {
        const handleKeys = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsCmdOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    useEffect(() => {
        document.body.removeAttribute('data-theme');
        localStorage.removeItem('system-theme');
    }, []);

    const userRole = isAdmin ? 'admin' : isFaculty ? 'faculty' : 'student';
    const currentUser = studentData || facultyData || { studentName: 'Administrator' };

    // Restore session from localStorage on mount
    useEffect(() => {
        const restoreSession = () => {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                try {
                    const user = JSON.parse(storedUserData);
                    if (user.role === 'admin') {
                        const token = localStorage.getItem('adminToken');
                        if (token) {
                            setIsAdmin(true);
                            setIsAuthenticated(true);
                        } else {
                            console.warn('Session restore failed: Admin token missing');
                            localStorage.removeItem('userData'); // Incomplete session
                        }
                    } else if (user.role === 'faculty') {
                        const token = localStorage.getItem('facultyToken');
                        if (token) {
                            setIsFaculty(true);
                            setFacultyData(user);
                            setIsAuthenticated(true);
                        } else {
                            console.warn('Session restore failed: Faculty token missing');
                            localStorage.removeItem('userData');
                        }
                    } else if (user.role === 'student') {
                        const token = localStorage.getItem('studentToken');
                        if (token) {
                            setStudentData(user);
                            setIsAuthenticated(true);
                        } else {
                            console.warn('Session restore failed: Student token missing');
                            localStorage.removeItem('userData');
                        }
                    }
                } catch (e) {
                    console.error("Failed to restore session", e);
                    localStorage.removeItem('userData'); // Clear corrupted data
                }
            }
            setIsInitialized(true); // Mark init as done regardless of result
        };

        restoreSession();
    }, []);

    useEffect(() => {
        if (isInitialized) {
            // We no longer auto-hide splash. User must touch it.
            // But we can add a small safety timeout if needed.
        }
    }, [isInitialized]);



    // Prevent routing until we have checked for an existing session and splash is done
    if (!isInitialized || showSplash) {
        return <RocketSplash onFinish={() => setShowSplash(false)} />;
    }

    const rootElement = (() => {
        if (!isAuthenticated) return (
            <LoginRegister
                setIsAuthenticated={setIsAuthenticated}
                setStudentData={setStudentData}
                setIsAdmin={setIsAdmin}
                setIsFaculty={setIsFaculty}
                setFacultyData={setFacultyData}
            />
        );
        if (isAdmin) return <Navigate to="/admin" replace />;
        if (isFaculty) return <Navigate to="/faculty" replace />;
        return <Navigate to="/dashboard" replace />;
    })();

    return (
        <Router>
            <div className="App">
                {isAuthenticated && (
                    <>
                        {/* GLOBAL NOTIFICATION SYSTEM */}
                        <GlobalNotifications userRole={userRole} userData={currentUser} />

                        <CommandPalette
                            isOpen={isCmdOpen}
                            onClose={() => setIsCmdOpen(false)}
                            role={userRole}
                            userData={currentUser}
                        />

                    </>
                )}
                <Routes>
                    <Route path="/" element={rootElement} />
                    <Route
                        path="/dashboard"
                        element={
                            isAuthenticated && studentData && !isAdmin ?
                                <StudentDashboard
                                    studentData={studentData}
                                    onLogout={() => {
                                        setIsAuthenticated(false);
                                        setStudentData(null);
                                        localStorage.removeItem('studentToken');
                                        localStorage.removeItem('userData');
                                    }}
                                /> :
                                <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/semester-notes"
                        element={
                            isAuthenticated && studentData && !isAdmin ?
                                <SemesterNotes /> :
                                <Navigate to="/" replace />
                        }
                    />
                    <Route
                        path="/advanced-learning"
                        element={
                            isAuthenticated && studentData && !isAdmin ?
                                <AdvancedLearning /> :
                                <Navigate to="/" replace />
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            isAuthenticated && isAdmin ?
                                <AdminDashboard
                                    setIsAuthenticated={setIsAuthenticated}
                                    setIsAdmin={setIsAdmin}
                                    setStudentData={setStudentData}
                                /> :
                                <Navigate to="/" replace />
                        }
                    />
                    {/* Catch all route */}
                    <Route
                        path="/faculty"
                        element={
                            isAuthenticated && isFaculty ?
                                <FacultyDashboard
                                    facultyData={facultyData}
                                    setIsAuthenticated={setIsAuthenticated}
                                    setIsFaculty={setIsFaculty}
                                /> :
                                <Navigate to="/" replace />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
