import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaClock, FaChalkboardTeacher, FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

/**
 * CHRONOS MASTER
 * Management of academic schedules and resource allocation.
 */
const AdminScheduleManager = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [filters, setFilters] = useState({
        year: '',
        section: '',
        branch: '',
        day: ''
    });

    const [formData, setFormData] = useState({
        day: 'Monday',
        time: '',
        subject: '',
        faculty: '',
        room: '',
        type: 'Theory',
        year: 1,
        section: 'A',
        branch: 'CSE',
        semester: 1,
        batch: '',
        courseCode: '',
        credits: 3
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const types = ['Theory', 'Lab', 'Tutorial', 'Seminar', 'Other'];
    const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'IT'];

    // Dynamic Sections: A-P and 1-20
    const alphaSections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i));
    const numSections = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const sections = [...alphaSections, ...numSections];

    const fetchSchedules = React.useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.year) queryParams.append('year', filters.year);
            if (filters.section) queryParams.append('section', filters.section);
            if (filters.branch) queryParams.append('branch', filters.branch);
            if (filters.day) queryParams.append('day', filters.day);

            const response = await apiGet(`/api/schedule?${queryParams.toString()}`);
            setSchedules(response || []);
        } catch (error) {
            console.error('Failed to fetch schedules:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const fetchFaculty = async () => {
            try {
                const res = await apiGet('/api/faculty');
                if (res) setFacultyList(res);
            } catch (err) { console.error("Faculty fetch failed", err); }
        };
        fetchFaculty();
        fetchSchedules();
    }, [fetchSchedules]);

    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'schedule') {
                fetchSchedules();
            }
        });
        return unsub;
    }, [fetchSchedules]);

    const handleSave = async () => {
        try {
            if (editingSchedule) {
                await apiPut(`/api/schedule/${editingSchedule._id}`, formData);
            } else {
                await apiPost('/api/schedule', formData);
            }
            setShowModal(false);
            setEditingSchedule(null);
            resetForm();
            fetchSchedules();
        } catch (error) {
            console.error('Failed to save schedule:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('DELETE SCHEDULE ENTRY?\n\nThis action will delete this schedule entry from the database.')) return;
        try {
            await apiDelete(`/api/schedule/${id}`);
            alert("Schedule entry deleted");
        } catch (error) {
            console.error('Failed to delete schedule:', error);
            alert("Failed to delete schedule: " + error.message);
        } finally {
            fetchSchedules();
        }
    };

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            day: schedule.day,
            time: schedule.time,
            subject: schedule.subject,
            faculty: schedule.faculty,
            room: schedule.room,
            type: schedule.type,
            year: schedule.year,
            section: schedule.section,
            branch: schedule.branch,
            semester: schedule.semester || 1,
            batch: schedule.batch || '',
            courseCode: schedule.courseCode || '',
            credits: schedule.credits || 3
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            day: 'Monday',
            time: '',
            subject: '',
            faculty: '',
            room: '',
            type: 'Theory',
            year: 1,
            section: 'A',
            branch: 'CSE',
            semester: 1,
            batch: '',
            courseCode: '',
            credits: 3
        });
    };

    const groupedSchedules = schedules.reduce((acc, schedule) => {
        const key = `${schedule.year}-${schedule.section}-${schedule.branch}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(schedule);
        return acc;
    }, {});

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>CHRONOS <span>MASTER</span></h1>
                    <p>Tactical academic timelines and resource allocation</p>
                </div>
                <div className="admin-action-bar compact" style={{ padding: '0.5rem 1.5rem' }}>
                    <button
                        onClick={() => { resetForm(); setEditingSchedule(null); setShowModal(true); }}
                        className="admin-btn admin-btn-primary"
                    >
                        <FaPlus /> CREATE SCHEDULE
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="admin-card" style={{ marginBottom: '2.5rem' }}>
                <div className="admin-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1.5rem' }}>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block', fontWeight: 950, fontSize: '0.65rem', color: '#94a3b8' }}>ACADEMIC YEAR</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%', borderRadius: '12px' }}
                            value={filters.year}
                            onChange={e => setFilters({ ...filters, year: e.target.value })}
                        >
                            <option value="">All Years</option>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block', fontWeight: 950, fontSize: '0.65rem', color: '#94a3b8' }}>SECTION</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%', borderRadius: '12px' }}
                            value={filters.section}
                            onChange={e => setFilters({ ...filters, section: e.target.value })}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block', fontWeight: 950, fontSize: '0.65rem', color: '#94a3b8' }}>BRANCH</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%', borderRadius: '12px' }}
                            value={filters.branch}
                            onChange={e => setFilters({ ...filters, branch: e.target.value })}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block', fontWeight: 950, fontSize: '0.65rem', color: '#94a3b8' }}>DAY OF WEEK</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%', borderRadius: '12px' }}
                            value={filters.day}
                            onChange={e => setFilters({ ...filters, day: e.target.value })}
                        >
                            <option value="">All Days</option>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Schedule List */}
            {loading ? (
                <div className="f-loader-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '6rem' }}>
                    <div className="sentinel-scanner"></div>
                    <p style={{ fontWeight: 950, letterSpacing: '0.2em', color: '#94a3b8', fontSize: '0.8rem' }}>SYNCING TEMPORAL NODES...</p>
                </div>
            ) : Object.keys(groupedSchedules).length > 0 ? (
                Object.entries(groupedSchedules).map(([key, classSchedules]) => {
                    const [year, section, branch] = key.split('-');
                    return (
                        <div key={key} className="admin-card sentinel-floating" style={{ marginBottom: '2.5rem', padding: '0', overflow: 'hidden' }}>
                            <div className="sentinel-scanner"></div>
                            <div className="f-node-head" style={{ padding: '1.5rem', margin: 0, borderBottom: '1px solid #f1f5f9' }}>
                                <h2 className="f-node-title" style={{ fontSize: '1.1rem', fontWeight: 950 }}>
                                    YEAR {year} <span>•</span> SECTION {section} <span>•</span> {branch}
                                </h2>
                                <span className="admin-badge primary" style={{ fontWeight: 950, borderRadius: '8px' }}>{classSchedules.length} NODES LOADED</span>
                            </div>

                            <div className="admin-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {classSchedules.map((schedule, idx) => (
                                    <div key={schedule._id || idx} className="admin-summary-card sentinel-floating" style={{ padding: '1.5rem', animationDelay: `${idx * -0.4}s`, border: '1px solid #f1f5f9' }}>
                                        <div className="sentinel-scanner"></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                            <div className="summary-icon-box" style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: schedule.type === 'Lab' ? '#ecfdf5' : '#eff6ff',
                                                color: schedule.type === 'Lab' ? '#10b981' : '#6366f1',
                                                fontSize: '1.1rem',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}>
                                                <FaClock />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{schedule.day.toUpperCase()}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 950, color: '#1e293b' }}>{schedule.time}</div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 950, color: '#1e293b', marginBottom: '1rem', lineHeight: 1.3 }}>
                                                {schedule.subject}
                                            </h3>

                                            <div style={{ display: 'grid', gap: '0.6rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 900, color: '#64748b' }}>
                                                    <FaChalkboardTeacher style={{ color: '#6366f1', opacity: 0.7 }} /> {schedule.faculty}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 900, color: '#64748b' }}>
                                                    <FaMapMarkerAlt style={{ color: '#10b981', opacity: 0.7 }} /> {schedule.room}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                                                <span className={`admin-badge ${schedule.type === 'Lab' ? 'success' : 'primary'}`} style={{ fontSize: '0.6rem', fontWeight: 950, padding: '0.3rem 0.7rem' }}>{schedule.type.toUpperCase()}</span>
                                                {schedule.batch && <span className="admin-badge warning" style={{ fontSize: '0.6rem', fontWeight: 950, padding: '0.3rem 0.7rem' }}>BATCH {schedule.batch}</span>}
                                                {schedule.courseCode && <span className="admin-badge" style={{ fontSize: '0.6rem', fontWeight: 950, padding: '0.3rem 0.7rem', background: '#f1f5f9', color: '#64748b' }}>{schedule.courseCode}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: '1rem' }}>
                                            <button className="admin-action-btn secondary" onClick={() => handleEdit(schedule)} title="Edit" style={{ width: '32px', height: '32px', borderRadius: '8px' }}><FaEdit /></button>
                                            <button className="admin-action-btn danger" onClick={() => handleDelete(schedule._id)} title="Delete" style={{ width: '32px', height: '32px', borderRadius: '8px' }}><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="admin-empty-state">
                    <FaCalendarAlt className="admin-empty-icon" />
                    <h2 className="admin-empty-title">NO TEMPORAL NODES FOUND</h2>
                    <p className="admin-empty-text">The timeline is currently empty for this sector.</p>
                </div>
            )}

            {/* Schedule Modal Overlay */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: '800px', borderRadius: '24px' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0, color: '#1e293b' }}>
                                {editingSchedule ? 'RECONFIGURE NODE' : 'INITIALIZE NODE'}
                            </h2>
                            <button onClick={() => { setShowModal(false); setEditingSchedule(null); }} style={{ background: '#f1f5f9', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><FaTimes /></button>
                        </div>

                        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>MODULE IDENTIFIER *</label>
                                <input style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Enter subject name..." required />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>TEMPORAL DAY *</label>
                                <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>TIME VECTOR *</label>
                                <input style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} placeholder="e.g., 09:00 - 10:00" required />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>PRIMARY FACULTY *</label>
                                <select
                                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }}
                                    value={formData.faculty}
                                    onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                                    required
                                >
                                    <option value="">Select Instructor...</option>
                                    {facultyList.map(f => (
                                        <option key={f._id} value={f.name}>
                                            {f.name} ({f.facultyId})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>SECTOR LOCATION *</label>
                                <input style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., Nexus 301" required />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>MODULE TYPE *</label>
                                <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>COHORT YEAR *</label>
                                <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}>
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>SECTION SECTOR *</label>
                                <input style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })} placeholder="e.g. A, B" required />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>BRANCH DOMAIN *</label>
                                <input style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 650 }} value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} placeholder="e.g. CSE, ECE" required />
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => { setShowModal(false); setEditingSchedule(null); }} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 950, fontSize: '0.8rem', cursor: 'pointer' }}>CANCEL</button>
                            <button onClick={handleSave} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 950, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                                <FaSave /> {editingSchedule ? 'UPDATE TIMELINE' : 'COMMIT TIMELINE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminScheduleManager;
