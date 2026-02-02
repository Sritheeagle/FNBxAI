import React, { useState, useEffect, useMemo } from 'react';
import { FaClock, FaMapMarkerAlt, FaBook, FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import { apiGet } from '../../utils/apiClient';

/**
 * CHRONOS SCHEDULE (FACULTY EDITION)
 * High-fidelity timetable management and weekly session analytics.
 * Theme: Luxe Pearl / Nexus
 */
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const weekDays = daysOfWeek.filter(day => day !== 'Sunday');

/**
 * Faculty Schedule
 * Weekly Class Schedule management.
 * Theme: Friendly Notebook
 */
const FacultyScheduleView = ({ facultyData, schedule = [] }) => {
    // Proactive Hardening
    facultyData = facultyData || {};
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [myClasses, setMyClasses] = useState([]);

    useEffect(() => {
        if (schedule && schedule.length > 0) {
            const classesMap = new Map();
            schedule.forEach(item => {
                const key = `${item.year}-${item.section}-${item.branch}`;
                if (!classesMap.has(key)) {
                    classesMap.set(key, { year: item.year, section: item.section, branch: item.branch, subjects: new Set() });
                }
                classesMap.get(key).subjects.add(item.subject);
            });
            setMyClasses(Array.from(classesMap.values()).map(c => ({ ...c, subjects: Array.from(c.subjects) })));
        } else {
            setMyClasses([]);
        }
    }, [schedule]);

    const todaySchedule = useMemo(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayStr = days[selectedDay];
        return schedule.filter(item => item.day === todayStr);
    }, [schedule, selectedDay]);

    if (loading) return <div className="no-content">Loading Schedule...</div>;

    return (
        <div className="animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>FACULTY <span>SCHEDULE</span></h2>
                    <p className="nexus-subtitle">Manage your weekly classes and labs</p>
                </div>
            </header>

            {/* My Classes Control Summary */}
            {myClasses.length > 0 && (
                <div className="f-schedule-grid animate-slide-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '3.5rem' }}>
                    {myClasses.map((cls, idx) => (
                        <div key={idx} className="f-node-card f-flex-gap" style={{ padding: '1.5rem', borderRadius: '24px' }}>
                            <div className="f-node-type-icon">
                                <FaUsers />
                            </div>
                            <div>
                                <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '0.95rem' }}>
                                    YEAR {cls.year} • SEC {cls.section} • {cls.branch}
                                </div>
                                <div className="f-text-muted" style={{ fontSize: '0.75rem', fontWeight: 850, marginTop: '0.2rem' }}>
                                    {cls.subjects.join(', ')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Day Selector Navigation */}
            <div className="nexus-glass-pills f-spacer-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {weekDays.map((day, index) => {
                    const dayIndex = daysOfWeek.indexOf(day);
                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(dayIndex)}
                            className={`nexus-pill ${selectedDay === dayIndex ? 'active' : ''}`}
                        >
                            {day.toUpperCase()}
                        </button>
                    );
                })}
            </div>

            {/* Session Node List */}
            <div className="f-schedule-grid animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {todaySchedule.length > 0 ? (
                    todaySchedule.map((item, index) => (
                        <div key={index} className="f-schedule-item" style={{ animationDelay: `${index * 0.1}s` }}>
                            {/* Temporal Reference */}
                            <div className="f-schedule-time-box">
                                <div className={`f-schedule-icon ${item.type === 'Lab' ? 'lab' : 'lecture'}`}>
                                    <FaClock />
                                </div>
                                <div className="f-schedule-time">{item.time}</div>
                            </div>

                            {/* Class Logistics */}
                            <div className="f-schedule-info">
                                <div className="f-schedule-subject">
                                    <FaBook style={{ color: 'var(--nexus-primary)' }} />
                                    {item.subject}
                                    {item.courseCode && <span className="f-meta-badge type">{item.courseCode}</span>}
                                </div>
                                <div className="f-schedule-meta-row">
                                    <div className="f-schedule-meta-item">
                                        <FaChalkboardTeacher />
                                        YEAR {item.year} • SEC {item.section} • {item.branch}
                                    </div>
                                    <div className="f-schedule-meta-item">
                                        <FaMapMarkerAlt />
                                        {item.room}
                                    </div>
                                </div>
                            </div>

                            {/* Operational Status */}
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end' }}>
                                <div className={`f-schedule-badge ${item.type === 'Lab' ? 'lab' : 'lecture'}`}>
                                    {item.type.toUpperCase()} SESSION
                                </div>
                                {item.batch && <div className="f-schedule-badge batch">BATCH {item.batch}</div>}
                                <button className="f-cancel-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                    ROSTER
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="f-node-card f-center-empty animate-fade-in">
                        <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.1 }}>📅</div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b' }}>No Classes</h3>
                        <p style={{ color: '#94a3b8', fontWeight: 850, marginTop: '1rem' }}>No classes scheduled for {daysOfWeek[selectedDay]}. Enjoy your free time!</p>
                    </div>
                )}
            </div>

            {/* Weekly Telemetry Overview */}
            {schedule.length > 0 && (
                <div className="f-question-panel animate-slide-up">
                    <h3 className="f-node-title f-spacer-lg">Weekly Overview</h3>
                    <div className="f-weekly-stats">
                        <div className="f-stat-card">
                            <span className="val">{schedule.length}</span>
                            <span className="lab">Total Sessions</span>
                        </div>
                        <div className="f-stat-card">
                            <span className="val">{myClasses.length}</span>
                            <span className="lab">Active Sections</span>
                        </div>
                        <div className="f-stat-card">
                            <span className="val">{new Set(schedule.map(s => s.subject)).size}</span>
                            <span className="lab">Subjects</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyScheduleView;
