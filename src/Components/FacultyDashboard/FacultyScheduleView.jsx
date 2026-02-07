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
                <div className="f-schedule-grid animate-slide-up" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '3.5rem', gap: '1.5rem' }}>
                    {myClasses.map((cls, idx) => (
                        <div key={idx} className="f-node-card f-flex-gap sentinel-floating" style={{ padding: '1.5rem', borderRadius: '24px', animationDelay: `${idx * -0.5}s` }}>
                            <div className="f-node-type-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--nexus-primary)', width: '48px', height: '48px', borderRadius: '12px' }}>
                                <FaUsers />
                            </div>
                            <div>
                                <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                                    YEAR {cls.year} • SEC {cls.section}
                                </div>
                                <div className="f-text-muted" style={{ fontSize: '0.75rem', fontWeight: 850, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
            <div className="f-schedule-grid animate-slide-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {todaySchedule.length > 0 ? (
                    todaySchedule.map((item, index) => (
                        <div key={index} className="f-schedule-item sentinel-floating" style={{ animationDelay: `${index * -0.2}s`, background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #f1f5f9' }}>
                            {/* Temporal Reference */}
                            <div className="f-schedule-time-box">
                                <div className={`f-schedule-icon ${item.type === 'Lab' ? 'lab' : 'lecture'}`}>
                                    <FaClock />
                                </div>
                                <div className="f-schedule-time" style={{ fontWeight: 950, fontSize: '1.1rem' }}>{item.time}</div>
                            </div>

                            {/* Class Logistics */}
                            <div className="f-schedule-info">
                                <div className="f-schedule-subject" style={{ fontSize: '1.2rem', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FaBook style={{ color: 'var(--nexus-primary)' }} />
                                    {item.subject}
                                    {item.courseCode && <span className="f-meta-badge type" style={{ fontSize: '0.6rem' }}>{item.courseCode}</span>}
                                </div>
                                <div className="f-schedule-meta-row" style={{ marginTop: '0.5rem' }}>
                                    <div className="f-schedule-meta-item" style={{ fontWeight: 850, color: '#64748b' }}>
                                        <FaChalkboardTeacher />
                                        YEAR {item.year} • SEC {item.section} • {item.branch}
                                    </div>
                                    <div className="f-schedule-meta-item" style={{ fontWeight: 850, color: '#64748b' }}>
                                        <FaMapMarkerAlt />
                                        {item.room}
                                    </div>
                                </div>
                            </div>

                            {/* Operational Status */}
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end' }}>
                                <div className={`f-schedule-badge ${item.type === 'Lab' ? 'lab' : 'lecture'}`} style={{ fontWeight: 950, fontSize: '0.7rem' }}>
                                    {item.type.toUpperCase()} SESSION
                                </div>
                                {item.batch && <div className="f-schedule-badge batch" style={{ fontWeight: 950, fontSize: '0.65rem' }}>BATCH {item.batch}</div>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="f-node-card f-center-empty animate-fade-in" style={{ padding: '6rem 2rem' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '2rem', filter: 'grayscale(1)' }}>📅</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>NO SCHEDULED CLASSES</h3>
                        <p style={{ color: '#94a3b8', fontWeight: 850, marginTop: '1rem', textAlign: 'center' }}>The operational pipeline is clear for {daysOfWeek[selectedDay]}. Enjoy your downtime.</p>
                    </div>
                )}
            </div>

            {/* Weekly Telemetry Overview */}
            {schedule.length > 0 && (
                <div className="f-question-panel animate-slide-up" style={{ marginTop: '4rem' }}>
                    <h3 className="f-node-title f-spacer-lg" style={{ fontSize: '1rem', letterSpacing: '0.1em' }}>WEEKLY TELEMETRY</h3>
                    <div className="f-weekly-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s', background: 'white' }}>
                            <div className="summary-icon-box" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}><FaClock /></div>
                            <div className="value">{schedule.length}</div>
                            <div className="label">TOTAL SESSIONS</div>
                        </div>
                        <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1.5s', background: 'white' }}>
                            <div className="summary-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><FaUsers /></div>
                            <div className="value">{myClasses.length}</div>
                            <div className="label">ACTIVE SECTIONS</div>
                        </div>
                        <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s', background: 'white' }}>
                            <div className="summary-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><FaBook /></div>
                            <div className="value">{new Set(schedule.map(s => s.subject)).size}</div>
                            <div className="label">SUBJECT NODES</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyScheduleView;
