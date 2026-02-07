import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaEdit, FaSave, FaTimes, FaCheck, FaFilter, FaFileDownload, FaFileUpload, FaCalculator, FaUsers } from 'react-icons/fa';
import { apiGet, apiPost } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';
import './FacultyMarks.css';

const FacultyMarks = ({ facultyData }) => {
    const [students, setStudents] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [selectedSection, setSelectedSection] = useState({ year: '', section: '', subject: '' });
    const [availableSections, setAvailableSections] = useState([]);
    const [marksData, setMarksData] = useState({});
    const [originalMarksData, setOriginalMarksData] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });
    const fileInputRef = useRef(null);

    // Assessment structure with max marks
    const assessmentStructure = {
        cla: [
            { id: 'cla1', label: 'CLA 1', max: 20 },
            { id: 'cla2', label: 'CLA 2', max: 20 },
            { id: 'cla3', label: 'CLA 3', max: 20 },
            { id: 'cla4', label: 'CLA 4', max: 20 },
            { id: 'cla5', label: 'CLA 5', max: 20 }
        ],
        module1: [
            { id: 'm1pre', label: '(PRE T1)', max: 10 },
            { id: 'm1t1', label: 'T1', max: 10 },
            { id: 'm1t2', label: 'T2', max: 10 },
            { id: 'm1t3', label: 'T3', max: 10 },
            { id: 'm1t4', label: 'T4', max: 10 }
        ],
        module2: [
            { id: 'm2pre', label: '(PRE T1)', max: 10 },
            { id: 'm2t1', label: 'T1', max: 10 },
            { id: 'm2t2', label: 'T2', max: 10 },
            { id: 'm2t3', label: 'T3', max: 10 },
            { id: 'm2t4', label: 'T4', max: 10 }
        ]
    };

    const fetchStudents = useCallback(async () => {
        if (!facultyData?.facultyId) return;
        try {
            const data = await apiGet(`/api/faculty-stats/${facultyData.facultyId}/students`);
            setAllStudents(data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            setAllStudents([]);
        }
    }, [facultyData?.facultyId]);

    const filterStudentsBySection = (studentList, section) => {
        if (!section.year || !section.section) {
            setStudents([]);
            return;
        }
        const filtered = studentList.filter(student => {
            const studentYear = student.year || student.Year || student.currentYear;
            const studentSection = student.section || student.Section || student.class;
            const studentBranch = String(student.branch || student.Branch || '').toUpperCase().trim();
            const targetBranch = String(section.branch || '').toUpperCase().trim();

            const yearMatch = String(studentYear) === String(section.year);
            const sectionMatch = String(studentSection).toUpperCase().trim() === String(section.section).toUpperCase().trim();
            const branchMatch = !targetBranch || targetBranch === 'ALL' || studentBranch === targetBranch;

            return yearMatch && sectionMatch && branchMatch;
        });

        setStudents(prev => {
            if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev;
            return filtered;
        });
    };

    const initializeData = useCallback(async () => {
        try {
            setLoading(true);
            let sections = extractSectionsFromData(facultyData);

            if (sections.length === 0 && facultyData?.facultyId) {
                try {
                    const response = await apiGet(`/api/faculty/${facultyData.facultyId}`);
                    sections = extractSectionsFromData(response);
                } catch (apiError) {
                    console.error('Failed to fetch faculty from API:', apiError);
                }
            }

            setAvailableSections(sections);
            if (sections.length > 0) {
                setSelectedSection(sections[0]);
            }
            await fetchStudents();
        } catch (error) {
            console.error('Error initializing:', error);
            showMessage('Failed to load initial data', 'error');
        } finally {
            setLoading(false);
        }
    }, [facultyData, fetchStudents]);

    const extractSectionsFromData = (data) => {
        if (!data) return [];
        if (data.assignments && Array.isArray(data.assignments) && data.assignments.length > 0) {
            const sectionsMap = new Map();
            data.assignments.forEach(assignment => {
                const year = String(assignment.year || '');
                const section = String(assignment.section || '').toUpperCase().trim();
                const subject = assignment.subject || data.subject || 'General';
                const branch = assignment.branch || assignment.Branch || data.department || 'CSE';
                if (year && section) {
                    const key = `${year}-${section}-${subject}-${branch}`;
                    if (!sectionsMap.has(key)) {
                        sectionsMap.set(key, { year, section, subject, branch });
                    }
                }
            });
            return Array.from(sectionsMap.values());
        }
        return [];
    };

    // Auto-filter students when registry or section changes
    useEffect(() => {
        if (allStudents.length > 0 && selectedSection.year && selectedSection.section) {
            filterStudentsBySection(allStudents, selectedSection);
        }
    }, [allStudents, selectedSection]);

    const handleSectionChange = (newSection) => {
        setSelectedSection(newSection);
        filterStudentsBySection(allStudents, newSection);
        setEditMode(false);
    };

    const fetchMarks = useCallback(async () => {
        if (!selectedSection.subject || students.length === 0) return;
        try {
            const subject = selectedSection.subject;
            const data = await apiGet(`/api/marks/${encodeURIComponent(subject)}/all`);
            const organized = {};
            students.forEach(student => {
                const sid = student.sid || student.studentId;
                organized[sid] = {};
                [...assessmentStructure.cla, ...assessmentStructure.module1, ...assessmentStructure.module2].forEach(a => {
                    organized[sid][a.id] = '';
                });
            });

            if (Array.isArray(data)) {
                data.forEach(mark => {
                    const sid = mark.studentId || mark.sid;
                    if (organized[sid]) {
                        organized[sid][mark.assessmentType] = mark.marks;
                    }
                });
            }
            setMarksData(organized);
            setOriginalMarksData(JSON.parse(JSON.stringify(organized)));
        } catch (error) {
            console.error('Error fetching marks:', error);
        }
    }, [
        selectedSection.subject,
        students,
        assessmentStructure.cla,
        assessmentStructure.module1,
        assessmentStructure.module2
    ]);

    const handleMarkChange = (studentId, assessmentId, value) => {
        if (value === '') {
            setMarksData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [assessmentId]: '' } }));
            return;
        }
        const val = parseFloat(value);
        const assessment = [...assessmentStructure.cla, ...assessmentStructure.module1, ...assessmentStructure.module2].find(a => a.id === assessmentId);
        if (val < 0 || (assessment && val > assessment.max)) return;

        setMarksData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [assessmentId]: val }
        }));
    };

    const saveMarks = async () => {
        try {
            setSaving(true);
            const marksArray = [];
            Object.keys(marksData).forEach(sid => {
                Object.keys(marksData[sid]).forEach(aid => {
                    const val = marksData[sid][aid];
                    if (val !== '' && val !== null) {
                        marksArray.push({
                            studentId: sid,
                            subject: selectedSection.subject,
                            year: selectedSection.year,
                            section: selectedSection.section,
                            assessmentType: aid,
                            marks: parseFloat(val)
                        });
                    }
                });
            });

            const response = await apiPost('/api/marks/bulk-save', { marks: marksArray });
            if (response.success || response.modified >= 0) {
                showMessage(`✅ Saved marks for ${marksArray.length} entries`, 'success');
                setEditMode(false);
                setOriginalMarksData(JSON.parse(JSON.stringify(marksData)));
            } else {
                showMessage('Failed to save marks', 'error');
            }
        } catch (error) {
            showMessage('Error saving marks', 'error');
        } finally {
            setSaving(false);
        }
    };

    const calculateTotal = (studentId) => {
        const marks = marksData[studentId] || {};
        let total = 0;
        const activeIds = [...assessmentStructure.cla, ...assessmentStructure.module1, ...assessmentStructure.module2].map(a => a.id);

        activeIds.forEach(id => {
            const mark = marks[id];
            if (mark !== '' && mark !== null && !isNaN(mark)) {
                total += parseFloat(mark);
            }
        });
        return { total };
    };

    const showMessage = (text, type) => {
        setSaveMessage({ text, type });
        setTimeout(() => setSaveMessage({ text: '', type: '' }), 4000);
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const rows = text.split('\n').map(r => r.split(','));
            const newMarks = JSON.parse(JSON.stringify(marksData));

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[0]) continue;
                const sid = row[0].trim();
                if (newMarks[sid]) {
                    const allAssessments = [...assessmentStructure.cla, ...assessmentStructure.module1, ...assessmentStructure.module2];
                    allAssessments.forEach((a, idx) => {
                        const val = row[idx + 2];
                        if (val) {
                            const mark = parseFloat(val);
                            if (!isNaN(mark) && mark >= 0 && mark <= a.max) {
                                newMarks[sid][a.id] = mark;
                            }
                        }
                    });
                }
            }
            setMarksData(newMarks);
            setEditMode(true);
            showMessage('Marks imported from CSV. Please review and save.', 'success');
        };
        reader.readAsText(file);
    };

    const handleDownloadCSV = () => {
        const headers = ['Roll No', 'Name', ...assessmentStructure.cla.map(a => a.label), ...assessmentStructure.module1.map(a => a.label), ...assessmentStructure.module2.map(a => a.label), 'Total'];
        let csv = headers.join(',') + '\n';
        students.forEach(s => {
            const sid = s.sid || s.studentId;
            const { total } = calculateTotal(sid);
            const row = [sid, `"${s.studentName || s.name}"`];
            [...assessmentStructure.cla, ...assessmentStructure.module1, ...assessmentStructure.module2].forEach(a => {
                row.push(marksData[sid]?.[a.id] || '');
            });
            row.push(total);
            csv += row.join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Marks_${selectedSection.subject}_${selectedSection.year}${selectedSection.section}.csv`;
        a.click();
    };

    useEffect(() => {
        initializeData();

        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'marks' || ev.resource === 'students') {
                fetchStudents();
            }
        });
        return unsub;
    }, [initializeData, fetchStudents]);

    useEffect(() => {
        if (selectedSection.year && !editMode) {
            fetchMarks();
        }
    }, [selectedSection.year, selectedSection.subject, fetchMarks, editMode]);

    if (loading && allStudents.length === 0) return <div className="faculty-marks-container"><div className="spinner"></div><p>Syncing Registry...</p></div>;

    return (
        <div className="faculty-marks-container animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>ACADEMIC <span>LEDGER</span></h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0' }}>Precision grading for {selectedSection.subject || 'Faculty Courses'}</p>
                </div>
                <div className="f-header-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                    {editMode ? (
                        <>
                            <button className="f-node-btn success" onClick={saveMarks} disabled={saving}>
                                <FaSave /> {saving ? 'SAVING...' : 'FINALIZE MARKS'}
                            </button>
                            <button className="f-node-btn secondary" onClick={() => { setMarksData(originalMarksData); setEditMode(false); }}>
                                <FaTimes /> DISCARD
                            </button>
                        </>
                    ) : (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleBulkUpload} style={{ display: 'none' }} accept=".csv" />
                            <button className="f-node-btn secondary" onClick={() => fileInputRef.current.click()}>
                                <FaFileUpload /> BULK UPLOAD
                            </button>
                            <button className="f-node-btn secondary" onClick={handleDownloadCSV}>
                                <FaFileDownload /> EXPORT EXCEL
                            </button>
                            <button className="f-node-btn primary" onClick={() => setEditMode(true)}>
                                <FaEdit /> ENTER MARKS
                            </button>
                        </>
                    )}
                </div>
            </header>

            {saveMessage.text && <div className={`save-message ${saveMessage.type}`}><FaCheck /> {saveMessage.text}</div>}

            <div className="section-filter-bar" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <FaFilter style={{ color: '#6366f1' }} />
                    <div className="section-buttons">
                        {availableSections.map((sec, idx) => (
                            <button key={idx} className={`section-btn ${selectedSection.year === sec.year && selectedSection.section === sec.section ? 'active' : ''}`} onClick={() => handleSectionChange(sec)}>
                                YR {sec.year} ({sec.section}) - {sec.subject}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Stats Ribbon */}
                <div className="f-stats-ribbon" style={{ display: 'flex', gap: '1.5rem', background: 'transparent', padding: 0 }}>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s', background: 'white', minWidth: '180px', padding: '1rem' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', width: '32px', height: '32px' }}><FaCalculator size={14} /></div>
                        <div className="value" style={{ fontSize: '1.25rem' }}>{(students.length > 0 ? (students.reduce((acc, s) => acc + calculateTotal(s.sid || s.studentId).total, 0) / students.length) : 0).toFixed(1)}</div>
                        <div className="label" style={{ fontSize: '0.6rem' }}>SECTION AVERAGE</div>
                    </div>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1.5s', background: 'white', minWidth: '180px', padding: '1rem' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '32px', height: '32px' }}><FaCheck size={14} /></div>
                        <div className="value" style={{ fontSize: '1.25rem' }}>{students.length > 0 ? Math.max(...students.map(s => calculateTotal(s.sid || s.studentId).total)).toFixed(1) : '0.0'}</div>
                        <div className="label" style={{ fontSize: '0.6rem' }}>HIGHEST PERFORMANCE</div>
                    </div>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s', background: 'white', minWidth: '180px', padding: '1rem' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '32px', height: '32px' }}><FaUsers size={14} /></div>
                        <div className="value" style={{ fontSize: '1.25rem' }}>{students.length}</div>
                        <div className="label" style={{ fontSize: '0.6rem' }}>STUDENT POPULATION</div>
                    </div>
                </div>
            </div>

            <div className="marks-table-wrapper">
                <table className="comprehensive-marks-table">
                    <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                        <tr>
                            <th rowSpan="2" className="sticky-col">ROLL NO</th>
                            <th rowSpan="2" className="sticky-col-2">STUDENT NAME</th>
                            <th colSpan={assessmentStructure.cla.length} className="cla-header">CLA ASSESSMENTS (MAX 20)</th>
                            <th colSpan={assessmentStructure.module1.length} className="module1-header">MODULE 1 • (PRE T1) + TARGETS T1-T4</th>
                            <th colSpan={assessmentStructure.module2.length} className="module2-header">MODULE 2 • (PRE T1) + TARGETS T1-T4</th>
                            <th rowSpan="2" className="total-col" style={{ background: '#f8fafc', borderLeft: '2px solid #e2e8f0' }}>GRAND TOTAL</th>
                        </tr>
                        <tr>
                            {assessmentStructure.cla.map(a => <th key={a.id} className="cla-header" style={{ fontSize: '0.6rem' }}>{a.label}</th>)}
                            {assessmentStructure.module1.map(a => <th key={a.id} className="module1-header" style={{ fontSize: '0.6rem' }}>{a.label}</th>)}
                            {assessmentStructure.module2.map(a => <th key={a.id} className="module2-header" style={{ fontSize: '0.6rem' }}>{a.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => {
                            const sid = student.sid || student.studentId;
                            const { total } = calculateTotal(sid);
                            return (
                                <tr key={sid}>
                                    <td className="sticky-col" style={{ fontWeight: 800 }}>{sid}</td>
                                    <td className="sticky-col-2" style={{ textAlign: 'left', fontWeight: 600 }}>{student.studentName || student.name}</td>
                                    {assessmentStructure.cla.map(a => (
                                        <td key={a.id} className="cla-cell">
                                            <input type="number" step="0.5" disabled={!editMode} value={marksData[sid]?.[a.id] ?? ''} onChange={(e) => handleMarkChange(sid, a.id, e.target.value)} className="mark-input" />
                                        </td>
                                    ))}
                                    {assessmentStructure.module1.map(a => (
                                        <td key={a.id} className="module1-cell">
                                            <input type="number" step="0.5" disabled={!editMode} value={marksData[sid]?.[a.id] ?? ''} onChange={(e) => handleMarkChange(sid, a.id, e.target.value)} className="mark-input" />
                                        </td>
                                    ))}
                                    {assessmentStructure.module2.map(a => (
                                        <td key={a.id} className="module2-cell">
                                            <input type="number" step="0.5" disabled={!editMode} value={marksData[sid]?.[a.id] ?? ''} onChange={(e) => handleMarkChange(sid, a.id, e.target.value)} className="mark-input" />
                                        </td>
                                    ))}
                                    <td className="total-col" style={{ fontWeight: 900, color: '#4f46e5', background: '#f5f3ff', borderLeft: '2px solid #e2e8f0' }}>{total.toFixed(1)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="marks-info-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <FaCalculator /> Total Weightage: <strong>180 Marks</strong> | Students: <strong>{students.length}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Powered by Nexus Intel Engine • Live Sync Enabled
                </div>
            </div>
        </div>
    );
};

export default FacultyMarks;
