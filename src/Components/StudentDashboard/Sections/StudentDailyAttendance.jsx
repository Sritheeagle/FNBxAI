import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/apiClient';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import ProfessionalEmptyState from './ProfessionalEmptyState';

const StudentDailyAttendance = ({ studentId }) => {
    const [dailyData, setDailyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDaily = async () => {
            try {
                const data = await apiGet(`/api/students/${studentId}/daily-attendance`);
                setDailyData(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error("Failed to load daily attendance", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDaily();
    }, [studentId]);

    if (loading) return <div style={{ padding: '1rem', color: '#64748b' }}>Loading Daily Status...</div>;

    return (
        <div className="nexus-card animate-fade-in" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <h3 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span> Daily Attendance Log
            </h3>

            <div className="daily-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {dailyData.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <ProfessionalEmptyState
                            title="NO LOGS DETECTED"
                            description="Historical attendance data is currently being processed. Check back shortly for your daily synchronisation report."
                            icon={<FaCalendarAlt />}
                            theme="info"
                        />
                    </div>
                )}

                {dailyData.map((day, idx) => (
                    <div key={idx} className="daily-card" style={{
                        background: '#fff', padding: '1.25rem', borderRadius: '16px',
                        boxShadow: '0 4px 6px -1px androidx.core.graphics.ColorUtils.setAlphaComponent(#000, 10)',
                        border: '1px solid #e2e8f0',
                        borderLeft: `5px solid ${day.status === 'Regular' ? '#10b981' : day.status === 'Irregular' ? '#f59e0b' : '#ef4444'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{day.date}</div>
                            <div className={`status-badge`} style={{
                                padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900,
                                background: day.status === 'Regular' ? '#d1fae5' : day.status === 'Irregular' ? '#fef3c7' : '#fee2e2',
                                color: day.status === 'Regular' ? '#047857' : day.status === 'Irregular' ? '#b45309' : '#b91c1c',
                                letterSpacing: '0.05em', textTransform: 'uppercase'
                            }}>
                                {day.status}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>{day.present}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>PRESENT</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.1rem' }}>{day.absent}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>ABSENT</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '1.1rem' }}>{day.percentage}%</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>SCORE</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
                            {day.periods.map((p) => (
                                <div key={p.period} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                    <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700 }}>H{p.period}</span>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '0.8rem',
                                        background: p.status === 'Present' ? '#10b981' : p.status === 'Absent' ? '#ef4444' : '#cbd5e1',
                                        color: '#fff',
                                        boxShadow: p.status !== 'N/A' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                    }}>
                                        {p.status === 'Present' ? 'P' : p.status === 'Absent' ? 'A' : '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentDailyAttendance;
