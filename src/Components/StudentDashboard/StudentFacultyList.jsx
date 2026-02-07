import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaPhone, FaBook, FaUserTie, FaFilter, FaLinkedin, FaGithub, FaSync } from 'react-icons/fa';
import { apiGet } from '../../utils/apiClient';
import ProfessionalEmptyState from './Sections/ProfessionalEmptyState';
import './StudentFacultyList.css';

/**
 * FACULTY DIRECTORY
 * An interface for students to connect with their academic faculty and mentors.
 */
const StudentFacultyList = ({ studentData, preloadedFaculty, getFileUrl, onRefresh }) => {
    // Safety check
    studentData = studentData || {};
    // If preloadedFaculty is null/undefined, we wait/fetch. If it's an array (even empty), we use it.
    const [facultyList, setFacultyList] = useState(Array.isArray(preloadedFaculty) ? preloadedFaculty : []);
    const [loading, setLoading] = useState(preloadedFaculty === null || preloadedFaculty === undefined);
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    useEffect(() => {
        console.log('[StudentFacultyList] useEffect triggered', {
            hasPreloadedFaculty: !!preloadedFaculty,
            preloadedIsArray: Array.isArray(preloadedFaculty),
            preloadedLength: Array.isArray(preloadedFaculty) ? preloadedFaculty.length : 'N/A',
            studentSid: studentData?.sid
        });

        // Only skip fetch if we actually have data OR if it was explicitly passed as an empty array (meaning fetched but empty)
        if (Array.isArray(preloadedFaculty)) {
            console.log('[StudentFacultyList] Using preloaded faculty:', preloadedFaculty.length);
            setFacultyList(preloadedFaculty);
            setLoading(false);
            return;
        }

        const fetchFacultyList = async () => {
            setLoading(true);
            console.log('[StudentFacultyList] Starting fetch...');

            if (!studentData || !studentData.sid) {
                console.warn('[StudentFacultyList] ⚠️  No student data, cannot fetch faculty');
                setFacultyList([]);
                setLoading(false);
                return;
            }

            const params = {
                year: String(studentData.year || 1).replace(/[^0-9]/g, ''),
                section: String(studentData.section || 'A').replace(/Section\s*/i, '').trim(),
                branch: String(studentData.branch || 'CSE').trim()
            };

            console.log('[StudentFacultyList] Fetching faculty with params:', params);
            const url = `/api/faculty/teaching?year=${params.year}&section=${params.section}&branch=${params.branch}`;
            console.log('[StudentFacultyList] API URL:', url);

            try {
                const response = await apiGet(url);
                console.log('[StudentFacultyList] ✅ API Response:', {
                    isArray: Array.isArray(response),
                    length: Array.isArray(response) ? response.length : 'N/A',
                    sample: Array.isArray(response) && response.length > 0 ? {
                        name: response[0].name,
                        email: response[0].email,
                        assignmentCount: (response[0].assignments || []).length
                    } : 'No data'
                });
                setFacultyList(response || []);
            } catch (error) {
                console.error('[StudentFacultyList] ❌ Fetch failed:', error);
                console.error('[StudentFacultyList] Error details:', {
                    message: error.message,
                    status: error.status,
                    url
                });
                setFacultyList([]);
            } finally {
                setLoading(false);
                console.log('[StudentFaculty List] Fetch complete');
            }
        };

        fetchFacultyList();
    }, [studentData, studentData.sid, studentData.year, studentData.section, studentData.branch, preloadedFaculty]);

    // Helper: Check if a comma-separated value matches
    const matchesField = (fieldValue, targetValue) => {
        if (!fieldValue) return false;
        const values = String(fieldValue).toUpperCase().split(/[,\s]+/).map(v => v.trim());
        const target = String(targetValue).toUpperCase().trim();
        return values.includes('ALL') || values.includes(target) || values.some(v => v === target);
    };

    const list = facultyList.map(f => {
        // Find relevant assignment for this student to show correct subject
        const sYearDigit = String(studentData.year || '').replace(/[^0-9]/g, '');
        const sSec = String(studentData.section || 'A').toUpperCase().replace(/SECTION\s*/i, '').trim();
        const sBranch = String(studentData.branch || 'CSE').toUpperCase();

        const assignment = (f.assignments || []).find(a => {
            const aYearRaw = String(a.year || '').toUpperCase();
            const aYearDigit = aYearRaw.replace(/[^0-9]/g, '');
            const yearMatch = aYearRaw === 'ALL' || aYearDigit === sYearDigit || aYearRaw.includes(sYearDigit);

            const sectionMatch = matchesField(a.section, sSec);
            const branchMatch = matchesField(a.branch, sBranch);

            return yearMatch && sectionMatch && branchMatch;
        });

        return {
            id: f._id || f.facultyId,
            name: f.name || f.facultyName || 'Unknown Instructor',
            subject: assignment?.subject || f.subject || 'Specialized Topic',
            email: f.email || 'mentor@vignan.edu',
            phone: f.phone || f.contact || 'No contact sync',
            semester: assignment?.semester || f.semester || 'Current Semester',
            branch: f.department || f.branch || assignment?.branch || 'Core Engineering',
            image: f.image || f.profilePic || null,
            qualification: f.qualification || 'PhD Scholar',
            experience: f.experience || '8+ Academic Years',
            specialization: f.specialization || 'Distributed Systems',
            isAvailable: Math.random() > 0.3 // Mock availability
        };
    });

    const getFilteredFaculty = () => {
        if (selectedDepartment === 'all') return list;
        return list.filter(f => matchesField(f.branch, selectedDepartment));
    };

    if (loading) {
        return (
            <div className="nexus-schedule-loading">
                <div className="nexus-loading-ring"></div>
                <div className="loading-text">LOADING FACULTY LIST...</div>
            </div>
        );
    }

    const sectors = ['all', ...new Set(list.flatMap(f => {
        // Extract all branches from comma-separated values
        const branches = String(f.branch || '').split(/[,\s]+/).map(b => b.trim()).filter(b => b && b !== 'All');
        return branches;
    }))];
    const filtered = getFilteredFaculty();

    return (
        <div className="nexus-page-container">
            {/* Header Area */}
            <div className="nexus-page-header">
                <div>
                    <div className="nexus-page-subtitle"><FaUserTie /> Academic Faculty</div>
                    <h1 className="nexus-page-title">FACULTY <span>DIRECTORY</span></h1>
                </div>
                <div className="hub-stats" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {onRefresh && (
                        <button onClick={onRefresh} className="nexus-icon-btn" title="Sync Faculty List" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#64748b', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                            <FaSync />
                        </button>
                    )}
                    <div className="nexus-intel-badge">
                        TOTAL FACULTY: {filtered.length}
                    </div>
                </div>
            </div>

            {/* Department Navigation */}
            <div className="sector-nav">
                <div className="sector-label">
                    <FaFilter /> DEPARTMENT FILTER
                </div>
                <div className="nexus-glass-pills">
                    {sectors.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDepartment(dept)}
                            className={`nexus-pill ${selectedDepartment === dept ? 'active' : ''}`}
                        >
                            {dept === 'all' ? 'ALL DEPARTMENTS' : dept.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mentor Grid */}
            <div className="mentor-quantum-grid">
                {filtered.map((mentor, index) => (
                    <div key={index} className="quantum-mentor-card sentinel-floating" style={{ animationDelay: `${index * 0.2}s` }}>
                        <div className="sentinel-scanner"></div>
                        <div className="card-top">
                            <div className="mentor-portrait" style={{ border: `2px solid ${mentor.isAvailable ? '#10b981' : '#f59e0b'}` }}>
                                {mentor.image ? (
                                    <img src={getFileUrl(mentor.image)} alt={mentor.name} />
                                ) : (
                                    <div className="portrait-fallback" style={{ background: mentor.isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: mentor.isAvailable ? '#10b981' : '#f59e0b' }}>
                                        {mentor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                )}
                                <div className={`status-dot ${mentor.isAvailable ? 'online' : 'busy'}`}></div>
                            </div>
                            <div className="mentor-bio">
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.01em' }}>{mentor.name.toUpperCase()}</h3>
                                <div className="mentor-role" style={{ letterSpacing: '0.05em', fontWeight: 850 }}>{mentor.qualification}</div>
                                <div className={`status-tag ${mentor.isAvailable ? 'available' : 'busy'}`} style={{ fontWeight: 950, fontSize: '0.6rem', letterSpacing: '0.08em' }}>
                                    {mentor.isAvailable ? 'OPERATIONAL: ONLINE' : 'OPERATIONAL: BUSY'}
                                </div>
                            </div>
                        </div>

                        <div className="mentor-subject-box" style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                            <FaBook style={{ color: 'var(--v-primary)' }} />
                            <div className="subject-info">
                                <span className="active-module-label" style={{ fontWeight: 950, fontSize: '0.6rem' }}>
                                    PRIMARY MODULE
                                </span>
                                <span className="active-module-val" style={{ fontWeight: 950, fontSize: '0.9rem' }}>{mentor.subject}</span>
                            </div>
                        </div>

                        <div className="mentor-attributes">
                            <div className="attr">
                                <span className="label" style={{ fontWeight: 950, fontSize: '0.55rem' }}>DOMAIN SECTOR</span>
                                <span className="val" style={{ fontWeight: 950, fontSize: '0.8rem' }}>{mentor.specialization}</span>
                            </div>
                            <div className="attr">
                                <span className="label" style={{ fontWeight: 950, fontSize: '0.55rem' }}>EXPERIENCE LOG</span>
                                <span className="val" style={{ fontWeight: 950, fontSize: '0.8rem' }}>{mentor.experience}</span>
                            </div>
                        </div>

                        <div className="mentor-channels">
                            <div className="channel-group">
                                <a href={`mailto:${mentor.email}`} title="Send Email" className="channel-link" style={{ background: '#f1f5f9' }}><FaEnvelope /></a>
                                <a href={`tel:${mentor.phone}`} title="Call Faculty" className="channel-link" style={{ background: '#f1f5f9' }}><FaPhone /></a>
                                <div className="channel-link" style={{ background: '#f1f5f9' }}><FaLinkedin /></div>
                                <div className="channel-link" style={{ background: '#f1f5f9' }}><FaGithub /></div>
                            </div>
                            <button className="counsel-btn" style={{ fontWeight: 950, letterSpacing: '0.05em', height: '44px', borderRadius: '12px' }}>
                                VIEW PROFILE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {
                filtered.length === 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <ProfessionalEmptyState
                            title="NO FACULTY DETECTED"
                            description={`No assigned faculty members found for ${selectedDepartment === 'all' ? 'your current profile' : selectedDepartment.toUpperCase()}. Contact department admin if this registry is incorrect.`}
                            icon={<FaUserTie />}
                            theme="sentinel"
                        />
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                Sync parameters: Year {String(studentData.year || 1).replace(/[^0-9]/g, '')} • Section {String(studentData.section || 'A').replace(/Section\s*/i, '').trim()} • {studentData.branch}
                            </div>
                            <button onClick={() => setSelectedDepartment('all')} className="nexus-btn-pri-mini">ALL DEPARTMENTS</button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default StudentFacultyList;
