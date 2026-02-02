import React, { useState } from 'react';
import {
    FaPlus, FaBook, FaEdit, FaTrash,
    FaThLarge, FaColumns, FaChartPie, FaListUl,
    FaSearch, FaCheckCircle, FaExclamationCircle, FaUserGraduate, FaFileUpload, FaRobot
} from 'react-icons/fa';
import { getYearData } from '../../StudentDashboard/branchData';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Unified Academic Hub
 * Combines Courses (Syllabus), Sections (Telemetry), and Semester Subjects (Management).
 */
const AcademicHub = ({ courses, students, materials, openModal, handleDeleteCourse, initialSection, onSectionChange, openAiWithPrompt }) => {
    // Core Hub State
    const [hubView, setHubView] = useState('syllabus'); // 'syllabus', 'sections', 'management'

    // Syllabus View State
    const [selectedBranchFilter, setSelectedBranchFilter] = useState('CSE');
    const [selectedSectionFilter, setSelectedSectionFilter] = useState(initialSection || 'All');
    const [activeYearTab, setActiveYearTab] = useState(1);
    const [gridMode, setGridMode] = useState('tabs'); // 'tabs' or 'all-years'

    // Sync from parent
    React.useEffect(() => {
        if (initialSection) setSelectedSectionFilter(initialSection);
    }, [initialSection]);

    const handleSectionChangeInternal = (val) => {
        setSelectedSectionFilter(val);
        if (onSectionChange) onSectionChange(val);
    };

    // Management View State
    const [searchTerm, setSearchTerm] = useState('');

    const alphaSections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i)); // A-P
    const numSections = Array.from({ length: 20 }, (_, i) => String(i + 1)); // 1-20
    const SECTION_OPTIONS = [...alphaSections, ...numSections];

    // Animation Variants
    const hubVariants = {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
    };

    // --- RENDERERS ---

    const renderSyllabusGrid = (year) => {
        const dynamicCourses = courses.filter(c =>
            String(c.year) === String(year) &&
            (selectedBranchFilter === 'All' || c.branch?.toLowerCase() === selectedBranchFilter.toLowerCase() || c.branch === 'All') &&
            (selectedSectionFilter === 'All' || c.section === 'All' || c.section === selectedSectionFilter)
        );

        let allCourses = [...dynamicCourses];
        if (selectedBranchFilter !== 'All') {
            const staticData = getYearData(selectedBranchFilter, String(year));
            staticData?.semesters?.forEach(s => {
                // strict override: if ANY dynamic course exists for this semester, ignore static data completely
                const hasDynamicForSem = dynamicCourses.some(dc => String(dc.semester) === String(s.sem));

                if (!hasDynamicForSem) {
                    s.subjects.forEach(sub => {
                        allCourses.push({ ...sub, year, semester: s.sem, branch: selectedBranchFilter, isStatic: true, section: 'All' });
                    });
                }
            });
        }

        const semesters = Array.from({ length: 2 }, (_, i) => (year - 1) * 2 + i + 1);

        return (
            <React.Fragment key={year}>
                <div className="hub-year-title" style={{ marginTop: '2.5rem', marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 800, color: 'var(--admin-secondary)', borderLeft: '6px solid var(--admin-primary)', paddingLeft: '1rem' }}>
                    {gridMode === 'all-years' && <h3>YEAR {year}</h3>}
                </div>
                <div className="hub-sem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    {semesters.map(sem => {
                        const semCourses = allCourses.filter(c => String(c.semester) === String(sem));
                        return (
                            <div key={sem} className="admin-card hub-sem-card">
                                <div className="hub-sem-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--admin-border)' }}>
                                    <span className="admin-badge primary">SEMESTER {sem}</span>
                                    <button className="admin-btn admin-btn-outline" style={{ padding: '0.4rem 0.8rem', height: 'auto', fontSize: '0.8rem' }} onClick={() => openModal('course', { year, semester: sem, branch: selectedBranchFilter, section: selectedSectionFilter })}>
                                        <FaPlus /> ADD
                                    </button>
                                </div>
                                <div className="hub-subjects-list" style={{ display: 'grid', gap: '1rem' }}>
                                    {semCourses.map(c => {
                                        return (
                                            <div key={c._id || c.id || c.code} className="admin-list-item" style={c.isStatic ? { borderStyle: 'dashed', background: 'white' } : {}}>
                                                <div className="hub-subject-info">
                                                    <span className="admin-badge accent" style={{ fontSize: '0.65rem' }}>{c.code}</span>
                                                    <h4 style={{ margin: '0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-secondary)' }}>{c.name}</h4>
                                                    <div className="hub-subject-meta" style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                                                        <span>{c.branch || 'Common'}</span> • <span>Sec {c.section || 'All'}</span>
                                                    </div>
                                                </div>
                                                <div className="hub-subject-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => openModal('material', { subject: c.name, year: c.year, semester: c.semester, branch: c.branch || selectedBranchFilter })} className="admin-action-btn" title="Upload Resources"><FaFileUpload /></button>
                                                    <button onClick={() => openModal('course', c)} className="admin-action-btn secondary" title="Edit Subject"><FaEdit /></button>
                                                    <button onClick={() => handleDeleteCourse(c)} className="admin-action-btn danger" title="Delete Subject"><FaTrash /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </React.Fragment>
        );
    };

    const renderSectionsAnalytics = () => (
        <div className="hub-sections-analytics animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '1.2rem', fontWeight: 900 }}>SECTION TELEMETRY</h3>
                <button
                    className="admin-btn admin-btn-primary"
                    style={{ gap: '0.75rem', background: 'var(--admin-primary)', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)' }}
                    onClick={() => {
                        const activeSections = SECTION_OPTIONS.filter(sec =>
                            ['A', 'B', 'C', 'D'].includes(sec) ||
                            students.some(s => s.section === sec) ||
                            courses.some(c => c.section === sec)
                        );
                        const prompt = `Can you provide a detailed academic performance and resource allocation report for the following active sections: ${activeSections.join(', ')}? Analyze student distribution (Total: ${students.length}) and subject coverage.`;
                        openAiWithPrompt(prompt);
                    }}
                >
                    <FaRobot /> AI PERFORMANCE REPORT
                </button>
            </div>
            <div className="section-stats-grid">
                {SECTION_OPTIONS.filter(sec =>
                    ['A', 'B', 'C', 'D'].includes(sec) ||
                    students.some(s => s.section === sec) ||
                    courses.some(c => c.section === sec)
                ).map(sec => {
                    const sCount = students.filter(s => s.section === sec).length;
                    const cCount = courses.filter(c => c.section === sec || c.section === 'All').length;
                    return (
                        <div key={sec} className="admin-card hover-effect" onClick={() => { setHubView('management'); setActiveYearTab(1); setSearchTerm(`Sec ${sec}`); }} style={{ cursor: 'pointer', textAlign: 'center' }}>
                            <div className="label" style={{ fontWeight: 800, color: 'var(--admin-text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>SECTION</div>
                            <div className="count" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--admin-secondary)', margin: '0.5rem 0' }}>{sec}</div>
                            <div className="stats-row" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', color: 'var(--admin-primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                                <span title="Students"><FaUserGraduate /> {sCount}</span>
                                <span title="Subjects"><FaBook /> {cCount}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderManagementTable = () => {
        let filtered = courses.filter(c =>
            (selectedBranchFilter === 'All' || c.branch === selectedBranchFilter) &&
            (selectedSectionFilter === 'All' || c.section === selectedSectionFilter)
        );

        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.section && `Sec ${c.section}`.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return (
            <div className="hub-management-view animate-slide-up">
                <div className="admin-card">
                    <div className="admin-table-wrap">
                        <table className="admin-grid-table">
                            <thead>
                                <tr>
                                    <th>SUBJECT & BRANCH</th>
                                    <th>CODE</th>
                                    <th>YEAR/SEM</th>
                                    <th>SECTION</th>
                                    <th>CONTENT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(c => (
                                    <tr key={c._id || c.id || c.code}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{c.branch || 'Common'}</div>
                                        </td>
                                        <td><span className="admin-badge primary">{c.code}</span></td>
                                        <td>Y{c.year} • S{c.semester}</td>
                                        <td><span className="admin-badge accent">SEC {c.section || 'All'}</span></td>
                                        <td>
                                            {materials.some(m => m.subject === c.name) ?
                                                <span style={{ color: 'var(--admin-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaCheckCircle /> READY</span> :
                                                <span style={{ color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaExclamationCircle /> EMPTY</span>
                                            }
                                        </td>
                                        <td>
                                            <div className="hub-table-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openModal('material', { subject: c.name, year: c.year, semester: c.semester, branch: c.branch })} className="admin-action-btn" title="Upload Resources"><FaFileUpload /></button>
                                                <button onClick={() => openModal('course', c)} className="admin-action-btn secondary"><FaEdit /></button>
                                                <button onClick={() => handleDeleteCourse(c._id || c.id)} className="admin-action-btn danger"><FaTrash /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="academic-hub-v2 animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>ACADEMIC <span>HUB</span></h1>
                    <p>Manage curriculum, section analysis, and subject assignments.</p>
                </div>

                <div className="hub-nav-controls" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="admin-segmented-control">
                        <button
                            className={`admin-segment-btn ${hubView === 'syllabus' ? 'active' : ''}`}
                            onClick={() => setHubView('syllabus')}
                        >
                            <FaColumns /> SYLLABUS
                        </button>
                        <button
                            className={`admin-segment-btn ${hubView === 'sections' ? 'active' : ''}`}
                            onClick={() => setHubView('sections')}
                        >
                            <FaChartPie /> ANALYSIS
                        </button>
                        <button
                            className={`admin-segment-btn ${hubView === 'management' ? 'active' : ''}`}
                            onClick={() => setHubView('management')}
                        >
                            <FaListUl /> SUBJECTS
                        </button>
                    </div>
                </div>
            </header>

            <div className="admin-filter-bar">
                <select className="admin-filter-select" value={selectedBranchFilter} onChange={e => setSelectedBranchFilter(e.target.value)}>
                    <option value="All">All Branches</option>
                    {['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'AIML'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select className="admin-filter-select" value={selectedSectionFilter} onChange={e => handleSectionChangeInternal(e.target.value)}>
                    <option value="All">All Sections</option>
                    {SECTION_OPTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
                </select>
                {hubView === 'management' && (
                    <div className="admin-search-wrapper" style={{ flex: 1 }}>
                        <FaSearch className="search-icon" />
                        <input className="admin-search-input" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                )}
                <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => openModal('course')}
                >
                    <FaPlus /> ADD SUBJECT
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={hubView}
                    variants={hubVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="hub-viewport"
                >
                    {hubView === 'syllabus' && (
                        <div className="hub-syllabus-wrap">
                            <div className="admin-tabs">
                                {[1, 2, 3, 4].map(y => (
                                    <button key={y} className={`admin-tab ${activeYearTab === y ? 'active' : ''}`} onClick={() => setActiveYearTab(y)}>
                                        YEAR {y}
                                    </button>
                                ))}
                                <div className="spacer" style={{ flex: 1 }} />
                                <button className="admin-btn admin-btn-outline" style={{ height: 'auto', padding: '0.5rem 1rem' }} onClick={() => setGridMode(gridMode === 'tabs' ? 'all-years' : 'tabs')}>
                                    <FaThLarge /> {gridMode === 'tabs' ? 'SHOW ALL YEARS' : 'SHOW TABS'}
                                </button>
                            </div>
                            {gridMode === 'tabs' ? renderSyllabusGrid(activeYearTab) : [1, 2, 3, 4].map(y => renderSyllabusGrid(y))}
                        </div>
                    )}

                    {hubView === 'sections' && renderSectionsAnalytics()}
                    {hubView === 'management' && renderManagementTable()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AcademicHub;
