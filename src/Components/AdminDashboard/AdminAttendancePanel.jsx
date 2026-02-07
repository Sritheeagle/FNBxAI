import React, { useState, useEffect, useCallback } from 'react';
import api, { apiGet } from '../../utils/apiClient';
import { FaSearch, FaUserCheck, FaUserTimes, FaChartPie, FaUsers, FaClipboardList, FaArrowLeft } from 'react-icons/fa';
import sseClient from '../../utils/sseClient';

/**
 * SENTINEL ATTENDANCE TELEMETRY
 * Strategic monitoring of personnel presence across academic sectors.
 */
const AdminAttendancePanel = () => {
    const [filters, setFilters] = useState({
        year: '1',
        branch: 'CSE',
        section: 'A',
        subject: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, present: 0 });
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [viewMode, setViewMode] = useState('telemetry'); // 'telemetry' or 'master-log'
    const [masterLogData, setMasterLogData] = useState([]);
    const [loadingMaster, setLoadingMaster] = useState(false);
    const [classStudents, setClassStudents] = useState([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await apiGet('/api/courses');
                if (Array.isArray(res)) setAvailableSubjects(res);
            } catch (e) { console.error("Subject fetch error", e); }
        };
        fetchSubjects();
    }, []);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            for (const [key, value] of Object.entries(filters)) {
                if (!value) params.delete(key);
            }

            const data = await apiGet(`/api/attendance/all?${params.toString()}`);

            if (Array.isArray(data)) {
                setAttendanceData(data);
                let total = 0;
                let present = 0;
                data.forEach(record => {
                    const recs = record.records || [];
                    total += recs.length;
                    present += recs.filter(r => r.status === 'Present').length;
                });
                setStats({ total, present });
            } else {
                setAttendanceData([]);
                setStats({ total: 0, present: 0 });
            }

        } catch (error) {
            console.error("Attendance fetch error", error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchMasterLog = useCallback(async () => {
        setLoadingMaster(true);
        try {
            const res = await apiGet(`/api/attendance/daily-report?date=${filters.date}&year=${filters.year}&section=${filters.section}&branch=${filters.branch}`);
            setMasterLogData(res || []);
        } catch (e) {
            console.error("Master log fetch error", e);
        } finally {
            setLoadingMaster(false);
        }
    }, [filters]);

    useEffect(() => {
        if (viewMode === 'telemetry') {
            fetchAttendance();
        } else {
            fetchMasterLog();
        }
    }, [viewMode, fetchAttendance, fetchMasterLog]);

    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'attendance') {
                if (viewMode === 'telemetry') fetchAttendance();
                else fetchMasterLog();
            }
        });
        return unsub;
    }, [viewMode, fetchAttendance, fetchMasterLog]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getPercentage = () => {
        if (stats.total === 0) return 0;
        return Math.round((stats.present / stats.total) * 100);
    };

    const toggleAttendance = async (sid, period, currentStatus, subject) => {
        const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
        try {
            await api.apiPost('/api/attendance', {
                studentId: sid,
                date: filters.date,
                period,
                status: nextStatus,
                subject: subject || filters.subject || 'General',
                recordedBy: 'Admin'
            });
            // Optimized local update
            setMasterLogData(prev => prev.map(s => {
                if (s.sid !== sid) return s;
                const newHourWise = s.hourWise.map(h => {
                    if (h.period !== period) return h;
                    const symbol = nextStatus === 'Present' ? 'P' : 'A';
                    return { ...h, status: nextStatus, symbol };
                });

                // Recalculate stats for this student
                const present = newHourWise.filter(h => h.status === 'Present').length;
                const absent = newHourWise.filter(h => h.status === 'Absent').length;
                const total = present + absent;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                let dailyStatus = 'N/A';
                if (total > 0) {
                    if (percentage >= 75) dailyStatus = 'Regular';
                    else if (percentage >= 40) dailyStatus = 'Irregular';
                    else dailyStatus = 'Absent';
                }

                return {
                    ...s,
                    hourWise: newHourWise,
                    stats: { ...s.stats, present, absent, total, percentage },
                    dailyStatus
                };
            }));
        } catch (e) {
            console.error("Toggle error", e);
            alert("Execution Failed: " + e.message);
        }
    };

    const markColumnAttendance = async (period) => {
        if (!window.confirm(`Mark all ${masterLogData.length} students as PRESENT for Period ${period}?`)) return;

        try {
            // Using the optimized backend batch route
            await api.apiPost('/api/admin/batch-attendance', {
                date: filters.date,
                year: filters.year,
                section: filters.section,
                branch: filters.branch,
                subject: filters.subject || 'General',
                period,
                status: 'Present'
            });

            alert(`Successfully marked Period ${period} PRESENT for the entire section.`);
            fetchMasterLog();
        } catch (e) {
            console.error("Bulk mark error", e);
            alert("Protocol Failed: " + e.message);
        }
    };

    const renderMasterLog = () => (
        <div className={`admin-card sentinel-floating animate-fade-in`} style={{ animationDelay: '0s' }}>
            <div className="sentinel-scanner"></div>
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.4rem', fontWeight: 950 }}>
                    <FaClipboardList style={{ marginRight: '0.75rem', color: 'var(--v-primary)' }} />
                    CHRONOS LOG GRID — {filters.date.split('-').reverse().join('/')}
                </h2>
                <div className="status-tag" style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 950, letterSpacing: '0.05em' }}>
                    OPERATIONAL STATE: ACTIVE
                </div>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-grid-table">
                    <thead>
                        <tr>
                            <th>SECURE STUDENT IDENTITY</th>
                            {[1, 2, 3, 4, 5].map(h => (
                                <th key={h} style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>HOUR {h}</span>
                                        <button
                                            onClick={() => markColumnAttendance(h)}
                                            className="admin-badge-btn"
                                            title={`Mark all as Present for H${h}`}
                                            style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'var(--admin-primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 900 }}
                                        >
                                            BATCH P
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th style={{ textAlign: 'center' }}>NEXUS SCORE %</th>
                            <th style={{ textAlign: 'center' }}>REGISTRY STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingMaster ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '6rem' }}>
                                <div className="f-loader-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div className="sentinel-scanner" style={{ width: '100%', height: '4px' }}></div>
                                    <span style={{ fontWeight: 950, letterSpacing: '0.2em', color: '#94a3b8', fontSize: '0.7rem' }}>DECRYPTING ATTENDANCE MATRIX...</span>
                                </div>
                            </td></tr>
                        ) : masterLogData.map(s => (
                            <tr key={s.sid}>
                                <td>
                                    <div style={{ fontWeight: 850, color: 'var(--admin-secondary)' }}>{s.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>{s.sid}</div>
                                </td>
                                {s.hourWise.map((h, i) => (
                                    <td key={i} style={{ textAlign: 'center' }}>
                                        <span
                                            onClick={() => toggleAttendance(s.sid, h.period, h.status, s.subject)}
                                            style={{
                                                display: 'inline-flex', width: '28px', height: '28px', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease',
                                                background: h.status === 'Present' ? '#dcfce7' : h.status === 'Absent' ? '#fee2e2' : '#f1f5f9',
                                                color: h.status === 'Present' ? '#16a34a' : h.status === 'Absent' ? '#ef4444' : '#cbd5e1',
                                                border: h.status === 'N/A' ? '1px dashed #cbd5e1' : 'none'
                                            }}
                                            title={`Period ${h.period}: ${h.status}. Click to toggle.`}
                                        >
                                            {h.symbol}
                                        </span>
                                    </td>
                                ))}
                                <td style={{ textAlign: 'center', fontWeight: 950, color: s.stats.percentage >= 75 ? '#16a34a' : s.stats.percentage >= 40 ? '#f59e0b' : '#ef4444' }}>
                                    {s.stats.percentage}%
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{
                                        padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase',
                                        background: s.dailyStatus === 'Regular' ? '#dcfce7' : s.dailyStatus === 'Irregular' ? '#fef3c7' : '#fee2e2',
                                        color: s.dailyStatus === 'Regular' ? '#166534' : s.dailyStatus === 'Irregular' ? '#b45309' : '#991b1b'
                                    }}>
                                        {s.dailyStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {!loadingMaster && masterLogData.length === 0 && (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '4rem' }}>NO TELEMETRY LOGS FOR THIS SELECTION.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTelemetry = () => (
        <>
            {/* Real-time Stats */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#dcfce7', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserCheck /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.present}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>PRESENT PERSONNEL</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fee2e2', color: '#ef4444', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserTimes /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.total - stats.present}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ABSENT NODES</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaChartPie /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{getPercentage()}%</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>PRESENCE UPTIME</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#f8fafc', color: '#64748b', width: '50px', height: '50px', borderRadius: '14px' }}><FaUsers /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.total}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL CAPACITY</div>
                </div>
            </div>

            <div className={`admin-card sentinel-floating`} style={{ animationDelay: '0s' }}>
                <div className="sentinel-scanner"></div>
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr>
                                <th style={{ fontWeight: 950 }}>TRANSMISSION DATE</th>
                                <th style={{ fontWeight: 950 }}>KNOWLEDGE MODULE</th>
                                <th style={{ fontWeight: 950 }}>TACTICAL SECTOR</th>
                                <th style={{ fontWeight: 950 }}>PRIMARY FACULTY</th>
                                <th style={{ fontWeight: 950 }}>PRESENCE TELEMETRY</th>
                                <th style={{ fontWeight: 950 }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceData.map((record) => {
                                const recs = record.records || [];
                                const p = recs.filter(r => r.status === 'Present').length;
                                const t = recs.length;
                                return (
                                    <tr key={record._id || record.id}>
                                        <td>
                                            <div style={{ fontWeight: 950, color: 'var(--admin-secondary)' }}>
                                                {new Date(record.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td><span className="admin-badge primary">{record.subject}</span></td>
                                        <td>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 850 }}>
                                                {record.branch} | YEAR {record.year} | SEC {record.section}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 850, color: 'var(--admin-text-muted)' }}>
                                                {record.facultyName || record.facultyId || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <div style={{ width: '40px', height: '4px', background: 'var(--admin-border)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${t > 0 ? (p / t) * 100 : 0}%`, height: '100%', background: (p / t > 0.75) ? 'var(--admin-success)' : 'var(--admin-warning)' }}></div>
                                                </div>
                                                <span style={{ fontWeight: 950, color: (p / t > 0.75) ? 'var(--admin-success)' : 'var(--admin-warning)' }}>{p} / {t}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button className="admin-btn admin-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.65rem' }}>
                                                VIEW DETAILS
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Per-student attendance view (if loaded) */}
            {classStudents.length > 0 && (
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Class Attendance — Student Overview</h3>
                        <button className="admin-action-btn" onClick={() => setClassStudents([])}><FaArrowLeft /> CLOSE</button>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-grid-table">
                            <thead>
                                <tr>
                                    <th>STUDENT ID</th>
                                    <th>NAME</th>
                                    <th>TOTAL CLASSES</th>
                                    <th>PRESENT</th>
                                    <th>OVERALL %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classStudents.map(s => (
                                    <tr key={s.sid}>
                                        <td>{s.sid}</td>
                                        <td>{s.name}</td>
                                        <td>{s.totalClasses}</td>
                                        <td>{s.totalPresent}</td>
                                        <td>{s.overallPercentage}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>ATTENDANCE <span>TELEMETRY</span></h1>
                    <p>Real-time personnel presence state monitoring</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={`admin-btn ${viewMode === 'telemetry' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                        onClick={() => setViewMode('telemetry')}
                    >
                        <FaChartPie /> TELEMETRY
                    </button>
                    <button
                        className={`admin-btn ${viewMode === 'master-log' ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                        onClick={() => setViewMode('master-log')}
                    >
                        <FaClipboardList /> DAILY MASTER LOG
                    </button>
                </div>
            </header>

            {/* Strategic Filters (Persistent) */}
            <div className="admin-card mb-lg">
                <div className="admin-filter-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label block-label">ACADEMIC YEAR</label>
                        <select
                            className="admin-filter-select full-width"
                            value={filters.year}
                            onChange={e => handleFilterChange('year', e.target.value)}
                        >
                            <option value="">All Years</option>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                    </div>

                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label block-label">BRANCH</label>
                        <select
                            className="admin-filter-select full-width"
                            value={filters.branch}
                            onChange={e => handleFilterChange('branch', e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label block-label">SECTION</label>
                        <select
                            className="admin-filter-select full-width"
                            value={filters.section}
                            onChange={e => handleFilterChange('section', e.target.value)}
                        >
                            <option value="">All Sections</option>
                            {(() => {
                                const alphaSections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i));
                                const numSections = Array.from({ length: 20 }, (_, i) => String(i + 1));
                                const SECTION_OPTIONS = [...alphaSections, ...numSections];
                                return SECTION_OPTIONS.map(s => <option key={s} value={s}>Section {s}</option>);
                            })()}
                        </select>
                    </div>

                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label block-label">SUBJECT</label>
                        <select
                            className="admin-filter-select full-width"
                            value={filters.subject}
                            onChange={e => handleFilterChange('subject', e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {availableSubjects.map((sub, idx) => (
                                <option key={idx} value={sub.name}>{sub.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-search-wrapper" style={{ minWidth: 'auto', flex: 1 }}>
                        <label className="admin-detail-label block-label">DATE</label>
                        <input
                            type="date"
                            className="admin-filter-select full-width"
                            value={filters.date}
                            onChange={e => handleFilterChange('date', e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={viewMode === 'telemetry' ? fetchAttendance : fetchMasterLog} className="admin-btn admin-btn-primary" style={{ height: '48px' }}>
                        <FaSearch size={14} /> {viewMode === 'telemetry' ? 'LOAD TELEMETRY' : 'GENERATE MASTER LOG'}
                    </button>
                    {viewMode === 'telemetry' && (
                        <>
                            <button onClick={async () => {
                                try {
                                    const resp = await apiGet(`/api/admin/class-attendance/${filters.year}/${filters.section}/${filters.branch}`);
                                    setClassStudents(Array.isArray(resp.students) ? resp.students : resp.students || []);
                                } catch (e) {
                                    console.error('Failed to fetch class attendance', e);
                                }
                            }} className="admin-btn admin-btn-outline" style={{ height: '48px' }}>
                                <FaUsers size={14} /> CLASS REPORT
                            </button>

                            <button onClick={async () => {
                                const sid = prompt("Enter Student ID to mark Present:");
                                if (!sid) return;
                                const subject = prompt("Enter Subject (e.g. Python):", filters.subject || "Python");
                                if (!subject) return;

                                try {
                                    await api.apiPost('/api/attendance', {
                                        studentId: sid,
                                        date: filters.date,
                                        subject: subject,
                                        status: 'Present',
                                        recordedBy: 'Admin'
                                    });
                                    alert(`Marked ${sid} Present for ${subject}`);
                                    fetchAttendance();
                                } catch (e) { alert("Failed: " + e.message); }
                            }} className="admin-btn admin-btn-secondary" style={{ height: '48px' }}>
                                MARK ATTENDANCE
                            </button>
                        </>
                    )}
                </div>
            </div>

            {viewMode === 'master-log' ? renderMasterLog() : renderTelemetry()}
        </div>
    );
};

export default AdminAttendancePanel;
