import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaChalkboardTeacher, FaBook, FaBolt, FaHistory, FaChevronRight, FaPlayCircle, FaCheckCircle, FaFlask } from 'react-icons/fa';
import { apiGet } from '../../utils/apiClient';
import StudentLabsSchedule from './StudentLabsSchedule';
import ProfessionalEmptyState from './Sections/ProfessionalEmptyState';
import './StudentSchedule.css';

/**
 * CHRONOS NEXUS - Student Schedule V3
 * A high-fidelity, interactive timeline for academic operations.
 */
const StudentSchedule = ({ studentData, preloadedData }) => {
    const [subView, setSubView] = useState('theory');
    const [schedule, setSchedule] = useState(preloadedData || []);
    const [loading, setLoading] = useState(!preloadedData);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);
    const [currentTime, setCurrentTime] = useState(new Date());

    const daysOfWeek = useMemo(() => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);
    const weekDays = useMemo(() => daysOfWeek.filter(day => day !== 'Sunday'), [daysOfWeek]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const fetchSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                year: String(studentData?.year || 1).replace(/[^0-9]/g, ''),
                section: String(studentData?.section || 'A').replace(/Section\s*/i, '').trim(),
                branch: String(studentData?.branch || 'CSE').trim()
            });
            const data = await apiGet(`/api/schedule?${query}`);
            setSchedule(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Schedule Fetch Failed', e);
        } finally {
            setLoading(false);
        }
    }, [studentData]);

    useEffect(() => {
        if (preloadedData) setSchedule(preloadedData);
        else fetchSchedule();
    }, [fetchSchedule, preloadedData]);

    const getStatus = (timeRange) => {
        if (!timeRange?.includes(' - ')) return 'upcoming';
        const [startStr, endStr] = timeRange.split(' - ');
        const parse = (s) => {
            const [h, m] = s.split(':');
            const d = new Date(); d.setHours(parseInt(h), parseInt(m), 0);
            return d;
        };
        const start = parse(startStr);
        const end = parse(endStr);
        if (currentTime >= start && currentTime <= end) return 'ongoing';
        if (currentTime > end) return 'past';
        return 'upcoming';
    };

    const todayClasses = useMemo(() => {
        return schedule
            .filter(item => item.day === daysOfWeek[selectedDay])
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [schedule, selectedDay, daysOfWeek]);

    if (loading) return <LoadingPortal />;

    return (
        <div className="chronos-protocol-container fade-in">
            {/* 🛸 Protocol Header */}
            <header className="chronos-header">
                <div className="header-core">
                    <div className="protocol-badge"><FaBolt /> NEXUS TEMPORAL GRID</div>
                    <h1>ACADEMIC <span>CHRONOLOGY</span></h1>
                </div>
                <div className="chronos-stats">
                    <div className="stat-unit">
                        <span className="lbl">DEPT</span>
                        <span className="val">{studentData?.branch || 'CSE'}</span>
                    </div>
                    <div className="stat-unit">
                        <span className="lbl">STATUS</span>
                        <span className="val active">SYNCHRONIZED</span>
                    </div>
                </div>
            </header>

            {/* 🎛️ Mode Dispatcher */}
            <div className="nexus-glass-pills">
                <button onClick={() => setSubView('theory')} className={`nexus-pill ${subView === 'theory' ? 'active' : ''}`}>
                    <FaBook /> THEORY MATRIX
                </button>
                <button onClick={() => setSubView('labs')} className={`nexus-pill ${subView === 'labs' ? 'active' : ''}`}>
                    <FaFlask /> KINETIC LABS
                </button>
            </div>

            <AnimatePresence mode="wait">
                {subView === 'theory' ? (
                    <motion.div key="theory" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        {/* 📅 Temporal Navigator */}
                        <div className="chronos-day-nav">
                            {weekDays.map((day) => {
                                const idx = daysOfWeek.indexOf(day);
                                return (
                                    <button key={day} onClick={() => setSelectedDay(idx)} className={`day-node ${selectedDay === idx ? 'active' : ''}`}>
                                        <span className="day-abbr">{day.substring(0, 3)}</span>
                                        <span className="day-full">{day.toUpperCase()}</span>
                                        {new Date().getDay() === idx && <div className="pulse-indicator" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ⏳ Chrono Timeline */}
                        <div className="chronos-timeline">
                            {todayClasses.length > 0 ? (
                                todayClasses.map((item, idx) => {
                                    const status = getStatus(item.time);
                                    return <TimelineEvent key={idx} item={item} status={status} index={idx} />;
                                })
                            ) : (
                                <ProfessionalEmptyState
                                    title="TIMELINE CLEAR"
                                    description={`No synchronized events found for ${daysOfWeek[selectedDay]}.`}
                                    icon={<FaHistory />}
                                    theme="all-clear"
                                />
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="labs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <StudentLabsSchedule studentData={studentData} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* --- Modular Sub-Components --- */

const TimelineEvent = ({ item, status, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`chronos-event-card ${status}`}
    >
        <div className="event-time-rail">
            <span className="time-stamp">{item.time}</span>
            <div className="rail-visual">
                <div className={`node-marker ${status}`}>
                    {status === 'ongoing' ? <FaPlayCircle className="spin" /> : status === 'past' ? <FaCheckCircle /> : <div className="dot" />}
                </div>
                <div className="rail-line" />
            </div>
        </div>
        <div className="event-body">
            <div className="event-meta-row">
                <span className="type-tag">{item.type || 'THEORY'}</span>
                {status === 'ongoing' && <span className="status-badge live">LIVE NOW</span>}
            </div>
            <h3 className="event-name">{item.subject}</h3>
            <div className="event-details">
                <div className="detail"><FaChalkboardTeacher /> {item.faculty || 'AI INSTRUCTOR'}</div>
                <div className="detail"><FaMapMarkerAlt /> HUB: {item.room || 'VIRTUAL'}</div>
            </div>
        </div>
        <div className="event-action-zone">
            <button className="nexus-icon-btn"><FaChevronRight /></button>
        </div>
        {status === 'ongoing' && <div className="event-glow-border" />}
    </motion.div>
);

const LoadingPortal = () => (
    <div className="nexus-loading-viewport">
        <div className="neural-spinner" />
        <p>Synchronizing Chronos...</p>
    </div>
);

export default StudentSchedule;
