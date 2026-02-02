import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaClock, FaChalkboardTeacher, FaMapMarkerAlt, FaSave, FaTimes } from 'react-icons/fa';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

/**
 * SCHEDULE MANAGER
 * Management of academic schedules and resource allocation.
 */
const AdminScheduleManager = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
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
        if (window.confirm('DELETE SCHEDULE ENTRY?\n\nThis action will delete this schedule entry from the database.')) {
            try {
                await apiDelete(`/api/schedule/${id}`);
                fetchSchedules();
            } catch (error) {
                console.error('Failed to delete schedule:', error);
            }
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
                    <h1>SCHEDULE <span>MANAGER</span></h1>
                    <p>Academic schedule and resource management</p>
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
                <div className="admin-filter-bar">
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>ACADEMIC YEAR</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%' }}
                            value={filters.year}
                            onChange={e => setFilters({ ...filters, year: e.target.value })}
                        >
                            <option value="">All Years</option>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>SECTION</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%' }}
                            value={filters.section}
                            onChange={e => setFilters({ ...filters, section: e.target.value })}
                        >
                            <option value="">All Sections</option>
                            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>BRANCH</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%' }}
                            value={filters.branch}
                            onChange={e => setFilters({ ...filters, branch: e.target.value })}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>DAY OF WEEK</label>
                        <select
                            className="admin-filter-select"
                            style={{ width: '100%' }}
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
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p className="admin-text-muted">LOADING SCHEDULES...</p>
                </div>
            ) : Object.keys(groupedSchedules).length > 0 ? (
                Object.entries(groupedSchedules).map(([key, classSchedules]) => {
                    const [year, section, branch] = key.split('-');
                    return (
                        <div key={key} className="admin-card" style={{ marginBottom: '2.5rem', padding: '0' }}>
                            <div className="f-node-head" style={{ padding: '1.5rem', margin: 0 }}>
                                <h2 className="f-node-title" style={{ fontSize: '1.1rem' }}>
                                    YEAR {year} <span>•</span> SECTION {section} <span>•</span> {branch}
                                </h2>
                                <span className="admin-badge primary">{classSchedules.length} ENTRIES</span>
                            </div>

                            <div className="admin-grid" style={{ padding: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {classSchedules.map((schedule, idx) => (
                                    <div key={schedule._id || idx} className="admin-summary-card sentinel-animate" style={{ padding: '1.5rem', animationDelay: `${idx * 0.05}s` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                                            <div className="summary-icon-box" style={{
                                                width: '48px', height: '48px', borderRadius: '12px',
                                                background: schedule.type === 'Lab' ? '#ecfdf5' : '#eff6ff',
                                                color: schedule.type === 'Lab' ? 'var(--admin-success)' : 'var(--admin-primary)',
                                                fontSize: '1.1rem'
                                            }}>
                                                <FaClock />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--admin-text-light)', textTransform: 'uppercase' }}>{schedule.day}</div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-secondary)' }}>{schedule.time}</div>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem', flex: 1 }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-secondary)', marginBottom: '0.8rem', lineHeight: 1.3 }}>
                                                {schedule.subject}
                                            </h3>

                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                                                    <FaChalkboardTeacher style={{ color: 'var(--admin-accent)' }} /> {schedule.faculty}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--admin-text-muted)' }}>
                                                    <FaMapMarkerAlt style={{ color: 'var(--admin-success)' }} /> {schedule.room}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                                <span className={`admin-badge ${schedule.type === 'Lab' ? 'success' : 'primary'}`} style={{ fontSize: '0.65rem' }}>{schedule.type.toUpperCase()}</span>
                                                {schedule.batch && <span className="admin-badge warning" style={{ fontSize: '0.65rem' }}>BATCH {schedule.batch}</span>}
                                                {schedule.courseCode && <span className="admin-badge" style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b' }}>{schedule.courseCode}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--admin-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                                            <button className="admin-action-btn secondary" onClick={() => handleEdit(schedule)} title="Edit"><FaEdit /></button>
                                            <button className="admin-action-btn danger" onClick={() => handleDelete(schedule._id)} title="Delete"><FaTrash /></button>
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
                    <h2 className="admin-empty-title">NO SCHEDULES FOUND</h2>
                    <p className="admin-empty-text">No schedule entries found for current parameters. Create a new schedule entry.</p>
                </div>
            )}

            {/* Schedule Modal Overlay */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="f-node-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1rem' }}>
                            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', margin: 0, color: 'var(--admin-secondary)' }}>
                                {editingSchedule ? 'EDIT SCHEDULE' : 'CREATE SCHEDULE'}
                            </h2>
                            <button onClick={() => { setShowModal(false); setEditingSchedule(null); }} className="admin-btn-close" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--admin-text-muted)' }}><FaTimes /></button>
                        </div>

                        <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                                <label className="admin-form-label">SUBJECT NAME *</label>
                                <input className="admin-form-input" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder="Enter subject name..." required />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">DAY *</label>
                                <select className="admin-form-input" style={{ width: '100%' }} value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">TIME SLOT *</label>
                                <input className="admin-form-input" style={{ width: '100%' }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} placeholder="e.g., 09:00 - 10:00" required />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">FACULTY NAME *</label>
                                <input className="admin-form-input" style={{ width: '100%' }} value={formData.faculty} onChange={e => setFormData({ ...formData, faculty: e.target.value })} placeholder="Enter instructor name..." required />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">ROOM / LOCATION *</label>
                                <input className="admin-form-input" style={{ width: '100%' }} value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., Nexus 301" required />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">TYPE *</label>
                                <select className="admin-form-input" style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">COHORT YEAR *</label>
                                <select className="admin-form-input" style={{ width: '100%' }} value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}>
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">SECTION *</label>
                                <select className="admin-form-input" style={{ width: '100%' }} value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                                    {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-form-label">BRANCH *</label>
                                <select className="admin-form-input" style={{ width: '100%' }} value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })}>
                                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="admin-modal-actions">
                            <button onClick={() => { setShowModal(false); setEditingSchedule(null); }} className="admin-btn admin-btn-outline">CANCEL</button>
                            <button onClick={handleSave} className="admin-btn admin-btn-primary">
                                <FaSave /> SAVE SCHEDULE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminScheduleManager;
