import React, { useState, useMemo } from 'react';
import { FaDownload, FaArrowLeft, FaChevronRight, FaRegFolder, FaRegFileAlt, FaVideo, FaLightbulb, FaFileAlt, FaCube, FaSync, FaFolderOpen } from 'react-icons/fa';
import './AcademicBrowser.css';
import { apiPost, apiGet } from '../../../utils/apiClient';
import sseClient from '../../../utils/sseClient';
import ProfessionalEmptyState from './ProfessionalEmptyState';

/**
 * PREMIUM NEXUS ACADEMIC BROWSER
 * A high-end, multi-level file browser experience for educational content.
 */
const AcademicBrowser = ({ yearData, selectedYear, serverMaterials, userData, setView, branch, onRefresh, assignedFaculty = [], openAiWithDoc }) => {
    const [navPath, setNavPath] = useState([]);
    const [serverCurriculum, setServerCurriculum] = useState(null);

    // Fetch dynamic curriculum on subject view
    React.useEffect(() => {
        const current = navPath.length > 0 ? navPath[navPath.length - 1] : null;
        if (current && current.type === 'subject') {
            setServerCurriculum(null); // Reset
            apiGet(`/api/curriculum?subject=${encodeURIComponent(current.name)}`)
                .then(data => {
                    if (data && data.units && data.units.length > 0) {
                        // Transform to match browswer structure
                        // Browser expects: { id, name, units: [] } (Modules)
                        // Server provides: { name: 'UNIT 1', subsections: [] }

                        // We map Server Units -> Browser Modules (or Units)
                        // Let's assume Server Units ARE the top level containers inside a subject
                        const mapped = data.units.map((u, i) => ({
                            id: `server-${i}`,
                            name: u.name,
                            units: u.subsections ? u.subsections.map(sub => ({
                                id: sub.id,
                                title: sub.title,
                                content: sub.content
                            })) : []
                        }));
                        setServerCurriculum(mapped);
                    }
                })
                .catch(e => console.error(e));
        } else {
            setServerCurriculum(null);
        }
    }, [navPath]);

    // Real-time updates
    React.useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            const current = navPath.length > 0 ? navPath[navPath.length - 1] : null;
            if (ev && ev.resource === 'curriculum' && current && current.type === 'subject') {
                apiGet(`/api/curriculum?subject=${encodeURIComponent(current.name)}`)
                    .then(data => {
                        if (data && data.units && data.units.length > 0) {
                            const mapped = data.units.map((u, i) => ({
                                id: `server-${i}`,
                                name: u.name,
                                units: u.subsections ? u.subsections.map(sub => ({
                                    id: sub.id,
                                    title: sub.title,
                                    content: sub.content
                                })) : []
                            }));
                            setServerCurriculum(mapped);
                        }
                    })
                    .catch(e => console.error(e));
            }
        });
        return unsub;
    }, [navPath]);

    // Debug: Log yearData changes to track subject updates
    React.useEffect(() => {
        const totalSubjects = (yearData.semesters || []).reduce((sum, sem) =>
            sum + (sem.subjects || []).length, 0
        );
        console.log('[AcademicBrowser] YearData updated:', {
            year: selectedYear,
            semesters: (yearData.semesters || []).length,
            totalSubjects,
            subjects: (yearData.semesters || []).flatMap(s => s.subjects || []).map(sub => sub.name)
        });
    }, [yearData, selectedYear]);

    // Debug: Log assignedFaculty changes
    React.useEffect(() => {
        console.log('[AcademicBrowser] assignedFaculty prop received:', {
            isArray: Array.isArray(assignedFaculty),
            length: (assignedFaculty || []).length,
            faculty: (assignedFaculty || []).map(f => ({
                name: f.name,
                assignmentCount: (f.assignments || []).length,
                sampleAssignment: f.assignments?.[0] ? {
                    subject: f.assignments[0].subject,
                    year: f.assignments[0].year,
                    section: f.assignments[0].section
                } : null
            }))
        });
    }, [assignedFaculty]);

    const currentViewData = useMemo(() => {
        if (navPath.length === 0) {
            const yearToUse = selectedYear || 1;
            return { type: 'year', id: yearToUse, name: `Academic Year ${yearToUse}`, data: yearData.semesters };
        }
        return navPath[navPath.length - 1];
    }, [navPath, selectedYear, yearData]);

    // ... (rest of code) ...

    // Inside renderContent for 'subject'
    // const modulesToShow = serverCurriculum || current.data || [];


    const handleNavigateTo = (item, type, data) => {
        setNavPath([...navPath, { type, id: item.id || item, name: item.name || `Semester ${item}`, data }]);
    };

    const handleBreadcrumbClick = (index) => {
        setNavPath(navPath.slice(0, index + 1));
    };

    const handleBack = () => {
        setNavPath(parent => parent.slice(0, -1));
    };

    const resetNavigation = () => {
        setNavPath([]);
    };

    const renderEmpty = (title, msg, theme = "info") => (
        <div style={{ marginTop: '2rem', width: '100%' }}>
            <ProfessionalEmptyState
                title={title.toUpperCase()}
                description={msg}
                icon={<FaFolderOpen />}
                theme={theme}
            />
        </div>
    );

    const renderContent = () => {
        const current = currentViewData;

        // Level: Year (Semesters)
        if (current.type === 'year') {
            return (
                <div className="nexus-grid-layout">
                    {(current.data || []).map(sem => (
                        <div key={sem.sem} className="nexus-node-card sem-node" onClick={() => handleNavigateTo({ id: sem.sem, name: `Semester ${selectedYear}.${sem.sem % 2 === 0 ? 2 : 1}` }, 'semester', sem.subjects)}>
                            <div className="nexus-node-icon">📚</div>
                            <div className="nexus-node-info">
                                <h3>Semester {selectedYear}.{sem.sem % 2 === 0 ? 2 : 1}</h3>
                                <span>{(sem.subjects || []).length} Specialized Subjects</span>
                            </div>
                            <FaChevronRight className="node-arrow" />
                        </div>
                    ))}
                    {(!current.data || current.data.length === 0) && renderEmpty("Academic Repository Empty", "No semesters configured for this year.", "sentinel")}
                </div>
            );
        }

        // Level: Semester (Subjects)
        if (current.type === 'semester') {
            // Helper function to get faculty for a subject
            const getFacultyForSubject = (subject) => {
                if (!assignedFaculty || assignedFaculty.length === 0) {
                    console.log(`[AcademicBrowser] No faculty available for matching`);
                    return null;
                }

                const subjectName = String(subject.name || '').trim().toUpperCase();
                const subjectCode = String(subject.code || '').trim().toUpperCase();

                console.log(`[AcademicBrowser] Looking for faculty for subject:`, {
                    subjectName,
                    subjectCode,
                    availableFaculty: assignedFaculty.length
                });

                // Find faculty with matching assignment
                for (const faculty of assignedFaculty) {
                    const matchingAssignment = (faculty.assignments || []).find(assignment => {
                        const assSubject = String(assignment.subject || '').trim().toUpperCase();
                        const matches = assSubject === subjectName ||
                            assSubject === subjectCode ||
                            subjectName.includes(assSubject) ||
                            assSubject.includes(subjectName);

                        if (matches) {
                            console.log(`[AcademicBrowser] ✅ MATCH FOUND for "${subject.name}":`, {
                                facultyName: faculty.name,
                                assignmentSubject: assignment.subject,
                                matchType: assSubject === subjectName ? 'exact name' :
                                    assSubject === subjectCode ? 'exact code' :
                                        subjectName.includes(assSubject) ? 'name includes assignment' :
                                            'assignment includes name'
                            });
                        }

                        return matches;
                    });

                    if (matchingAssignment) {
                        return {
                            name: faculty.name || faculty.facultyName || 'Faculty',
                            email: faculty.email,
                            id: faculty._id || faculty.facultyId
                        };
                    }
                }

                console.log(`[AcademicBrowser] ❌ No faculty match for "${subject.name}"`);
                return null;
            };

            return (
                <div className="nexus-grid-layout">
                    {(current.data || []).map(sub => {
                        const faculty = getFacultyForSubject(sub);

                        return (
                            <div key={sub.id} className="nexus-node-card subject-node" onClick={() => handleNavigateTo(sub, 'subject', sub.modules)}>
                                <div className="nexus-node-icon">📘</div>
                                <div className="nexus-node-info">
                                    <h3>{sub.name}</h3>
                                    <code className="code-badge">{sub.code}</code>
                                    {faculty && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            fontSize: '0.85rem',
                                            color: '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            <span style={{ color: '#10b981' }}>👤</span>
                                            <span style={{ fontWeight: 600 }}>Prof. {faculty.name}</span>
                                        </div>
                                    )}
                                </div>
                                <FaChevronRight className="node-arrow" />
                            </div>
                        );
                    })}
                    {(!current.data || current.data.length === 0) && renderEmpty("No Subjects Found", "No subjects found in this semester.", "info")}
                </div>
            );
        }

        // Level: Subject (Modules)
        if (current.type === 'subject') {
            const modulesList = serverCurriculum || current.data || [];
            const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
            const apiMaterials = serverMaterials.map(m => {
                const rawUrl = m.fileUrl || m.url || '#';
                return { ...m, finalUrl: rawUrl.startsWith('http') ? rawUrl : `${API_BASE}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}` };
            });

            // Determine current semester from navigation (if available)
            const semesterItem = navPath.find(p => p.type === 'semester');
            const currentSemester = semesterItem ? semesterItem.id : null;

            // Filter materials for this subject (ignoring module/unit strictness)
            const subjectResources = apiMaterials.filter(m => {
                const matchYear = !m.year || String(m.year) === 'All' || String(m.year) === String(selectedYear);
                const matchSemester = !m.semester || String(m.semester) === 'All' || (currentSemester && String(m.semester) === String(currentSemester));

                // Section may be 'All', single value, or comma-separated/array
                const sections = m.section ? (Array.isArray(m.section) ? m.section : String(m.section).split(',').map(s => s.trim())) : [];
                const matchSection = !m.section || sections.length === 0 || sections.includes('All') || sections.includes(userData.section) || sections.includes(String(userData.section));

                // Branch filtering with comma-separated support
                const branches = m.branch ? (Array.isArray(m.branch) ? m.branch : String(m.branch).split(/[,\s]+/).map(b => b.trim().toUpperCase())) : [];
                const matchBranch = !m.branch || branches.length === 0 || branches.includes('ALL') || branches.includes(String(userData.branch || branch).toUpperCase());

                // Flexible subject/course matching: support subject name, subject code, or linked course
                const subj = m.subject ? String(m.subject).trim().toLowerCase() : '';
                const nodeName = String(current.name || '').trim().toLowerCase();
                const courseName = m.course && (m.course.courseName || m.course.name) ? String(m.course.courseName || m.course.name).trim().toLowerCase() : '';
                const courseCode = m.course && (m.course.courseCode || m.course.code) ? String(m.course.courseCode || m.course.code).trim().toLowerCase() : '';

                const matchSubject = (
                    subj && (subj === nodeName || subj === courseCode || subj === courseName || nodeName.includes(subj) || subj.includes(nodeName))
                ) || (
                        courseName && (courseName === nodeName || courseCode === nodeName || nodeName.includes(courseName))
                    ) || (
                        courseCode && (courseCode === nodeName || courseCode === subj)
                    );

                const uploaderName = m.uploadedBy?.name || m.uploadedBy || '';
                const isAdmin = uploaderName.toLowerCase().includes('admin') || m.uploaderRole === 'admin';
                const isAssignedFaculty = (assignedFaculty || []).some(f =>
                    (f.name && uploaderName && f.name.toLowerCase().includes(uploaderName.toLowerCase())) ||
                    (f.facultyId && m.uploadedBy === f.facultyId)
                );

                return matchYear && matchSemester && matchSection && matchBranch && Boolean(matchSubject) && (m.section !== 'All' ? true : (isAssignedFaculty || isAdmin));
            });

            const notes = subjectResources.filter(m => m.type === 'notes');
            const videos = subjectResources.filter(m => m.type === 'videos');
            const papers = subjectResources.filter(m => ['modelPapers', 'previousQuestions'].includes(m.type));

            return (
                <div className="nexus-subject-view">
                    <h3 className="section-title">Course Modules</h3>
                    <div className="nexus-list">
                        {modulesList.map(mod => (
                            <div key={mod.id} className="nexus-list-item" onClick={() => handleNavigateTo(mod, 'module', mod.units)}>
                                <FaRegFolder />
                                <div className="item-label">{mod.name}</div>
                                <span className="item-meta">{(mod.units || []).length} units</span>
                                <FaChevronRight className="node-arrow-static" />
                            </div>
                        ))}
                        {modulesList.length === 0 && <p className="text-muted">No modules defined.</p>}
                    </div>

                    {(notes.length > 0 || videos.length > 0 || papers.length > 0) && (
                        <div className="nexus-resources-preview" style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <h3 className="section-title">Subject Resources</h3>

                            {notes.length > 0 && (
                                <div className="res-section">
                                    <h4>📄 Notes & Documents</h4>
                                    <div className="res-row">
                                        {notes.map((n, i) => (
                                            <div key={i} className="res-card-v2">
                                                <div className="res-info">
                                                    <FaRegFileAlt />
                                                    <span>{n.title}</span>
                                                </div>
                                                <div className="res-actions">
                                                    <a href={n.finalUrl} target="_blank" rel="noreferrer" className="dl-btn"><FaDownload /></a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {videos.length > 0 && (
                                <div className="res-section">
                                    <h4>🎥 Video Lectures</h4>
                                    <div className="res-row">
                                        {videos.map((v, i) => (
                                            <div key={i} className="res-card-v2 vid">
                                                <div className="res-info" style={{ cursor: 'pointer' }} onClick={() => window.open(v.finalUrl, '_blank')}>
                                                    <FaVideo className="text-warning" />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{v.title}</span>
                                                        {v.duration && <small className="res-meta-badge" style={{ fontSize: '0.7rem', color: '#64748b' }}>🕒 {v.duration}</small>}
                                                    </div>
                                                </div>
                                                <div className="res-actions">
                                                    <button
                                                        className="ai-ask-btn"
                                                        style={{ background: 'transparent', color: '#f43f5e', border: 'none', padding: '0 0.5rem' }}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                await apiPost(`/api/materials/${v._id || v.id}/like`);
                                                                if (onRefresh) onRefresh();
                                                                else alert(`Liked ${v.title}!`);
                                                            } catch (err) { console.error(err); }
                                                        }}
                                                    >
                                                        ❤️ {v.likes || 0}
                                                    </button>
                                                    <FaChevronRight className="node-arrow-static" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {papers.length > 0 && (
                                <div className="res-section">
                                    <h4>📝 Model Papers / Exams</h4>
                                    <div className="res-row">
                                        {papers.map((p, i) => (
                                            <div key={i} className="res-card-v2">
                                                <div className="res-info">
                                                    <FaFileAlt className="text-danger" />
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span>{p.title}</span>
                                                        {p.examYear && <small className="res-meta-badge" style={{ fontSize: '0.7rem', color: '#64748b' }}>📅 {p.examYear}</small>}
                                                    </div>
                                                </div>
                                                <div className="res-actions">
                                                    <a href={p.finalUrl} target="_blank" rel="noreferrer" className="dl-btn"><FaDownload /></a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Level: Module (Units)
        if (current.type === 'module') {
            return (
                <div className="nexus-list">
                    {(current.data || []).map(unit => (
                        <div key={unit.id} className="nexus-list-item" onClick={() => handleNavigateTo(unit, 'unit', unit.topics)}>
                            <FaRegFolder className="text-success" />
                            <div className="item-label">{unit.name}</div>
                            <span className="item-meta">{(unit.topics || []).length} topics</span>
                            <FaChevronRight className="node-arrow-static" />
                        </div>
                    ))}
                </div>
            );
        }

        // Level: Unit (Topics)
        if (current.type === 'unit') {
            return (
                <div className="nexus-list">
                    {(current.data || []).map(topic => (
                        <div key={topic.id} className="nexus-list-item" onClick={() => handleNavigateTo(topic, 'topic', topic.resources)}>
                            <FaLightbulb className="text-warning" />
                            <div className="item-label">{topic.name}</div>
                            <span className="item-meta">Ready Resources</span>
                            <FaChevronRight className="node-arrow-static" />
                        </div>
                    ))}
                </div>
            );
        }

        // Level: Resources
        if (current.type === 'topic') {
            const staticResources = current.data || {};
            const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
            const apiMaterials = serverMaterials.map(m => {
                const rawUrl = m.fileUrl || m.url || '#';
                return { ...m, finalUrl: rawUrl.startsWith('http') ? rawUrl : `${API_BASE}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}` };
            });

            const subjectObj = navPath.find(item => item.type === 'subject');
            const moduleObj = navPath.find(item => item.type === 'module');
            const unitObj = navPath.find(item => item.type === 'unit');

            const currentSubject = subjectObj ? subjectObj.name : '';
            const currentModule = moduleObj ? moduleObj.name.replace('Module ', '') : '';
            const currentUnit = unitObj ? unitObj.name.replace('Unit ', '') : '';

            const dynamicResources = apiMaterials.filter(m => {
                const matchYear = !m.year || String(m.year) === 'All' || String(m.year) === String(selectedYear);

                // Semester must match the currently selected semester (from navPath)
                const semesterItem = navPath.find(p => p.type === 'semester');
                const currentSemester = semesterItem ? semesterItem.id : null;
                const matchSemester = !m.semester || String(m.semester) === 'All' || (currentSemester && String(m.semester) === String(currentSemester));

                const sections = m.section ? (Array.isArray(m.section) ? m.section : String(m.section).split(',').map(s => s.trim())) : [];
                const matchSection = !m.section || sections.length === 0 || sections.includes('All') || sections.includes(userData.section) || sections.includes(String(userData.section));

                const subj = m.subject ? String(m.subject).trim().toLowerCase() : '';
                const nodeName = String(currentSubject || '').trim().toLowerCase();
                const courseName = m.course && (m.course.courseName || m.course.name) ? String(m.course.courseName || m.course.name).trim().toLowerCase() : '';
                const courseCode = m.course && (m.course.courseCode || m.course.code) ? String(m.course.courseCode || m.course.code).trim().toLowerCase() : '';

                const matchSubject = (
                    subj && (subj === nodeName || subj === courseCode || subj === courseName || nodeName.includes(subj) || subj.includes(nodeName))
                ) || (
                        courseName && (courseName === nodeName || courseCode === nodeName || nodeName.includes(courseName))
                    ) || (
                        courseCode && (courseCode === nodeName || courseCode === subj)
                    );

                const modStr = m.module ? String(m.module).trim() : '';
                const matchModule = !modStr || modStr === currentModule || modStr === `Module ${currentModule}` || (moduleObj && moduleObj.name && moduleObj.name.includes(modStr));
                const unitStr = m.unit ? String(m.unit).trim() : '';
                const matchUnit = !unitStr || unitStr === currentUnit || unitStr === `Unit ${currentUnit}` || (unitObj && unitObj.name && unitObj.name.includes(unitStr));

                const uploaderName = m.uploadedBy?.name || m.uploadedBy || '';
                const isAssignedFaculty = (assignedFaculty || []).some(f =>
                    (f.name && uploaderName && f.name.toLowerCase().includes(uploaderName.toLowerCase())) ||
                    (f.facultyId && m.uploadedBy === f.facultyId)
                );

                return matchYear && matchSemester && matchSection && Boolean(matchSubject) && matchModule && matchUnit && (m.section !== 'All' ? true : isAssignedFaculty);
            });

            const notes = [...(staticResources.notes || []), ...dynamicResources.filter(m => m.type === 'notes')];
            const videos = [...(staticResources.videos || []), ...dynamicResources.filter(m => m.type === 'videos')];
            const papers = [...(staticResources.modelPapers || []), ...dynamicResources.filter(m => m.type === 'modelPapers' || m.type === 'previousQuestions')];
            const models = dynamicResources.filter(m => m.type === 'models');

            return (
                <div className="nexus-resources">
                    <div className="res-section">
                        <h4>📄 LECTURE NOTES</h4>
                        <div className="res-row">
                            {notes.map((n, i) => (
                                <div key={i} className="res-card-v2 sentinel-floating" style={{ animationDelay: `${i * -0.5}s` }}>
                                    <div className="sentinel-scanner"></div>
                                    <div className="res-info">
                                        <FaRegFileAlt />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{n.name || n.title}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'var(--v-primary)', fontWeight: 700 }}>
                                                BY {n.uploadedBy?.name || n.uploadedBy || 'INSTRUCTOR'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="res-actions">
                                        <a href={n.finalUrl} target="_blank" rel="noreferrer" className="dl-btn"><FaDownload /></a>
                                        <button className="ai-ask-btn" onClick={() => {
                                            if (openAiWithDoc) openAiWithDoc(n.name || n.title, n.finalUrl);
                                            else setView('ai-assistant');
                                        }}>ASK AI</button>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className="res-empty-hint sentinel-glass">
                                    <FaRegFileAlt style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '0.5rem' }} />
                                    <span>No lecture notes are currently deployed for this tactical unit.</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {videos.length > 0 && (
                        <div className="res-section">
                            <h4>🎥 VIDEO CONCEPTS</h4>
                            <div className="res-row">
                                {videos.map((v, i) => (
                                    <div key={i} className="res-card-v2 vid sentinel-floating" style={{ animationDelay: `${i * -0.6}s` }}>
                                        <div className="sentinel-scanner"></div>
                                        <div className="res-info" style={{ cursor: 'pointer' }} onClick={() => window.open(v.finalUrl, '_blank')}>
                                            <FaVideo className="text-warning" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{v.name || v.title}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--v-primary)', fontWeight: 700 }}>
                                                    BY {v.uploadedBy?.name || v.uploadedBy || 'INSTRUCTOR'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="res-actions">
                                            <button
                                                className="like-btn"
                                                style={{ background: 'transparent', color: '#f43f5e', border: 'none', padding: '0 0.5rem', cursor: 'pointer' }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await apiPost(`/api/materials/${v._id || v.id}/like`);
                                                        if (onRefresh) onRefresh();
                                                    } catch (err) { console.error(err); }
                                                }}
                                            >
                                                ❤️ {v.likes || 0}
                                            </button>
                                            <button className="ai-ask-btn vid" onClick={(e) => {
                                                e.stopPropagation();
                                                if (openAiWithDoc) openAiWithDoc(v.name || v.title, v.finalUrl, v.videoAnalysis);
                                                else setView('ai-agent');
                                            }}>ASK AI</button>
                                            <FaChevronRight className="node-arrow-static" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {papers.length > 0 && (
                        <div className="res-section">
                            <h4>📝 MODEL PAPERS / PYQs</h4>
                            <div className="res-row">
                                {papers.map((p, i) => (
                                    <div key={i} className="res-card-v2">
                                        <div className="res-info">
                                            <FaFileAlt className="text-pink" />
                                            <span>{p.name || p.title || p.description}</span>
                                        </div>
                                        <div className="res-actions">
                                            <a href={p.finalUrl} target="_blank" rel="noreferrer" className="dl-btn"><FaDownload /></a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {models.length > 0 && (
                        <div className="res-section">
                            <h4>🤖 AI MODELS / 3D ASSETS</h4>
                            <div className="res-row">
                                {models.map((m, i) => (
                                    <div key={i} className="res-card-v2">
                                        <div className="res-info">
                                            <FaCube className="text-primary" />
                                            <span>{m.title}</span>
                                        </div>
                                        <div className="res-actions">
                                            <a href={m.finalUrl} target="_blank" rel="noreferrer" className="dl-btn"><FaDownload /></a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return renderEmpty("Access Denied", "Layer not found or restricted.", "error");
    };

    return (
        <div className="nexus-browser-container">
            <div className="browser-header">
                <div>
                    <h2 className="browser-title">{currentViewData.name}</h2>
                    <div className="browser-breadcrumbs">
                        <span onClick={resetNavigation}>ROOT</span>
                        {navPath.map((item, i) => (
                            <React.Fragment key={i}>
                                <FaChevronRight className="sep" />
                                <span onClick={() => handleBreadcrumbClick(i)}>{item.name}</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onRefresh && (
                        <button onClick={onRefresh} className="browser-back-btn" style={{ background: 'white', color: '#64748b' }} title="Refresh Content">
                            <FaSync />
                        </button>
                    )}
                    {navPath.length > 0 && (
                        <button onClick={handleBack} className="browser-back-btn">
                            <FaArrowLeft /> BACK
                        </button>
                    )}
                </div>
            </div>

            <div className="nexus-browser-viewport">
                {renderContent()}
            </div>
        </div>
    );
};

export default AcademicBrowser;
