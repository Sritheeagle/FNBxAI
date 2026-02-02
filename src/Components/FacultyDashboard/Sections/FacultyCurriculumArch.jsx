import React, { useState, useEffect } from 'react';
import { FaEdit, FaLayerGroup, FaClock, FaCheckCircle, FaBookOpen, FaTimes, FaFilter, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../FacultyDashboard.css';

/**
 * FACULTY CURRICULUM MANAGEMENT SECTION
 * Updated to be Subject-Centric based on teaching assignments
 */
const FacultyCurriculumArch = ({ myClasses = [], materialsList = [], currentFaculty = {}, getFileUrl = (url) => url }) => {
  // Use first assigned subject or fallback to 'General'
  const initialSubject = myClasses.length > 0 ? myClasses[0].subject : 'General';
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [activeSection, setActiveSection] = useState('UNIT 1');
  const [editMode, setEditMode] = useState(false);

  // Initialize data structure from localStorage or defaults
  const [curriculumData, setCurriculumData] = useState(() => {
    const stored = localStorage.getItem('curriculumArch_v2');
    if (stored) return JSON.parse(stored);
    return {}; // Start with empty, will populate on demand
  });

  // Ensure current subject exists in data
  useEffect(() => {
    if (!curriculumData[activeSubject]) {
      const initial = {};
      const units = ['UNIT 1', 'UNIT 2', 'UNIT 3', 'UNIT 4', 'UNIT 5'];
      units.forEach(unit => {
        initial[unit] = {
          name: `${unit}`,
          description: `Educational modules for ${activeSubject} - ${unit}`,
          subsections: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: `Topic ${i + 1}`,
            content: '',
            credits: 2,
            duration: '1 week'
          }))
        };
      });
      setCurriculumData(prev => ({ ...prev, [activeSubject]: initial }));
    }
  }, [activeSubject, curriculumData]);

  const updateSubsection = (subj, unit, subsectionId, field, value) => {
    setCurriculumData(prev => ({
      ...prev,
      [subj]: {
        ...prev[subj],
        [unit]: {
          ...prev[subj][unit],
          subsections: prev[subj][unit].subsections.map(sub =>
            sub.id === subsectionId ? { ...sub, [field]: value } : sub
          )
        }
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem('curriculumArch_v2', JSON.stringify(curriculumData));
    setEditMode(false);
  };

  const currentSubjectData = curriculumData[activeSubject] || {};
  const units = Object.keys(currentSubjectData).sort();

  return (
    <div className="animate-fade-in">
      <header className="f-view-header">
        <div>
          <h2>CURRICULUM <span>PLANNER</span></h2>
          <p className="nexus-subtitle">Managing syllabus for: <strong>{activeSubject}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="f-pill-control" style={{ minWidth: '200px' }}>
            <FaFilter style={{ color: 'var(--nexus-primary)' }} />
            <select
              value={activeSubject}
              onChange={(e) => {
                setActiveSubject(e.target.value);
                setActiveSection('UNIT 1');
                setEditMode(false);
              }}
              style={{ padding: '0.4rem', fontWeight: 900 }}
            >
              {myClasses.length > 0 ? (
                myClasses.map(c => (
                  <option key={`${c.subject}-${c.year}`} value={c.subject}>
                    {c.subject} (YR {c.year})
                  </option>
                ))
              ) : (
                <option value="General">General Curriculum</option>
              )}
            </select>
          </div>

          <div className="f-node-actions">
            {editMode ? (
              <>
                <button className="f-logout-btn" style={{ background: '#fef2f2', color: '#dc2626' }} onClick={() => setEditMode(false)}>
                  <FaTimes /> CANCEL
                </button>
                <button className="f-logout-btn" style={{ background: '#ecfdf5', color: '#059669' }} onClick={handleSave}>
                  <FaCheckCircle /> SAVE
                </button>
              </>
            ) : (
              <button className="f-logout-btn" style={{ background: 'white', color: 'var(--nexus-primary)' }} onClick={() => setEditMode(true)}>
                <FaEdit /> MODIFY
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
        <div className="f-node-card" style={{ padding: '1.5rem', height: 'fit-content' }}>
          <div className="f-node-head" style={{ marginBottom: '1.5rem' }}>
            <h4 className="f-node-title" style={{ fontSize: '0.9rem' }}><FaLayerGroup /> CHAPTERS</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {units.map(unit => (
              <button
                key={unit}
                onClick={() => setActiveSection(unit)}
                className={`f-segment-btn ${activeSection === unit ? 'active' : ''}`}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid ' + (activeSection === unit ? 'var(--nexus-primary)' : '#e2e8f0'),
                  background: activeSection === unit ? 'var(--nexus-primary)' : 'white',
                  color: activeSection === unit ? 'white' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-slide-up">
          <div className="f-node-card" style={{ padding: '2rem', minHeight: '500px' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
                {activeSection} - Details
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
                {currentSubjectData[activeSection]?.description}
              </p>
            </div>

            <div className="f-roster-wrap">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead className="f-roster-head">
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>TOPIC</th>
                    <th style={{ textAlign: 'left', padding: '1rem' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', padding: '1rem' }}>CREDITS</th>
                    <th style={{ textAlign: 'right', padding: '1rem' }}>DURATION</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubjectData[activeSection]?.subsections.map((topic, index) => (
                    <tr key={topic.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <span className="f-student-index" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>{topic.id}</span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800 }}>
                        {editMode ? (
                          <input
                            className="f-form-select"
                            style={{ padding: '0.5rem', marginBottom: 0 }}
                            value={topic.title}
                            onChange={(e) => updateSubsection(activeSubject, activeSection, topic.id, 'title', e.target.value)}
                          />
                        ) : topic.title}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                        {editMode ? (
                          <input
                            className="f-form-select"
                            style={{ padding: '0.5rem', marginBottom: 0 }}
                            value={topic.content}
                            onChange={(e) => updateSubsection(activeSubject, activeSection, topic.id, 'content', e.target.value)}
                          />
                        ) : (topic.content || 'N/A')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {editMode ? (
                          <input
                            type="number"
                            className="f-form-select"
                            style={{ padding: '0.5rem', marginBottom: 0, width: '60px' }}
                            value={topic.credits}
                            onChange={(e) => updateSubsection(activeSubject, activeSection, topic.id, 'credits', e.target.value)}
                          />
                        ) : <span className="f-meta-badge unit">{topic.credits} CR</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {editMode ? (
                          <input
                            className="f-form-select"
                            style={{ padding: '0.5rem', marginBottom: 0, width: '100px' }}
                            value={topic.duration}
                            onChange={(e) => updateSubsection(activeSubject, activeSection, topic.id, 'duration', e.target.value)}
                          />
                        ) : topic.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Live Resources from Database matching this Subject/Unit */}
            <div style={{ marginTop: '3rem', borderTop: '2px dashed #e2e8f0', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, color: 'var(--nexus-primary)', letterSpacing: '0.05em' }}>LIVE RESOURCES FOR THIS UNIT</h4>
                <span className="f-meta-badge unit" style={{ fontSize: '0.65rem' }}>MATCHED FROM SYSTEM</span>
              </div>

              {(() => {
                const unitNum = activeSection.replace(/\D/g, '');
                const filtered = materialsList.filter(m => {
                  const subMatch = (m.subject || '').toLowerCase() === activeSubject.toLowerCase();
                  const unitMatch = String(m.unit) === String(unitNum);
                  return subMatch && unitMatch;
                });

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>No live materials found for {activeSubject} {activeSection}</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {filtered.map((m, i) => (
                      <div key={i} className="f-roster-item" style={{ padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ padding: '0.6rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--nexus-primary)', borderRadius: '10px' }}>
                            <FaBookOpen />
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 850, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{m.type?.toUpperCase()} • By {m.uploadedBy?.name || m.uploadedBy || 'Instructor'}</div>
                          </div>
                          <button
                            onClick={() => window.open(getFileUrl(m), '_blank')}
                            className="f-node-btn view"
                            style={{ width: '32px', height: '32px' }}
                            title="Quick View"
                          >
                            <FaEye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyCurriculumArch;
