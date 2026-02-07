import React, { useState } from 'react';
import { FaEdit, FaSave } from 'react-icons/fa';
import '../AdminDashboard.css';

/**
/**
 * Curriculum Designer
 * Design curriculum structure and topics.
 */
const CurriculumArchSection = () => {
  const [curriculumData, setCurriculumData] = useState(() => {
    const stored = localStorage.getItem('curriculumArch');
    if (stored) return JSON.parse(stored);

    const initial = {};
    const alphaSections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i)); // A-P
    const numSections = Array.from({ length: 20 }, (_, i) => String(i + 1)); // 1-20
    const allSections = [...alphaSections, ...numSections];

    allSections.forEach(section => {
      initial[section] = {
        name: `Section ${section}`,
        description: '',
        subsections: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          title: `Topic ${i + 1}`,
          content: '',
          credits: 0,
          duration: '4 weeks'
        }))
      };
    });
    return initial;
  });

  const [activeSection, setActiveSection] = useState('A');

  const saveCurriculum = () => {
    localStorage.setItem('curriculumArch', JSON.stringify(curriculumData));
  };

  const updateSection = (section, field, value) => {
    setCurriculumData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateSubsection = (section, subsectionId, field, value) => {
    setCurriculumData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        subsections: prev[section].subsections.map(sub =>
          sub.id === subsectionId ? { ...sub, [field]: value } : sub
        )
      }
    }));
  };

  const handleSave = () => {
    saveCurriculum();
    alert('✅ Curriculum saved successfully!');
  };

  const sections = Object.keys(curriculumData).sort();

  return (
    <div className="animate-fade-in">
      <header className="admin-page-header">
        <div className="admin-page-title">
          <h1>CURRICULUM <span>DESIGNER</span></h1>
          <p>Structure your academic curriculum.</p>
        </div>
        <div className="admin-action-bar" style={{ margin: 0 }}>
          {/* Actions can go here if needed */}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Section Navigation */}
        <div className="admin-card sentinel-floating" style={{ padding: '1.5rem', height: 'fit-content', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="sentinel-scanner"></div>
          <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--admin-secondary)', fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '4px', height: '16px', background: 'var(--admin-primary)', borderRadius: '4px' }}></div>
            SUBSYSTEMS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {sections.map(section => (
              <button
                key={section}
                className={`admin-btn ${activeSection === section ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                style={{ padding: '0.5rem', minWidth: 'auto', fontWeight: 900, fontSize: '0.75rem' }}
                onClick={() => setActiveSection(section)}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* Section Details */}
        <div className="admin-card sentinel-floating">
          <div className="sentinel-scanner"></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--admin-border)' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Section Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={curriculumData[activeSection]?.name || ''}
                onChange={(e) => updateSection(activeSection, 'name', e.target.value)}
                placeholder="Section name"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                className="admin-form-input"
                value={curriculumData[activeSection]?.description || ''}
                onChange={(e) => updateSection(activeSection, 'description', e.target.value)}
                placeholder="Section description"
                rows="1"
              />
            </div>
          </div>

          {/* Subsections Table */}
          <div>
            <h4 style={{ margin: '0 0 1.5rem 0', color: 'var(--admin-secondary)', fontSize: '1.1rem', fontWeight: 800 }}>Topics (1-20) for Section {activeSection}</h4>
            <div className="admin-table-wrap">
              <table className="admin-grid-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Title</th>
                    <th>Content</th>
                    <th style={{ width: '100px' }}>Credits</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {curriculumData[activeSection]?.subsections.map((subsection) => (
                    <tr key={subsection.id}>
                      <td>
                        <span className="admin-badge primary">{subsection.id}</span>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={subsection.title}
                          onChange={(e) => updateSubsection(activeSection, subsection.id, 'title', e.target.value)}
                          className="admin-form-input"
                          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={subsection.content}
                          onChange={(e) => updateSubsection(activeSection, subsection.id, 'content', e.target.value)}
                          placeholder="Content description"
                          className="admin-form-input"
                          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={subsection.credits}
                          onChange={(e) => updateSubsection(activeSection, subsection.id, 'credits', parseFloat(e.target.value))}
                          className="admin-form-input"
                          style={{ padding: '0.5rem', fontSize: '0.85rem', textAlign: 'center' }}
                          min="0"
                          max="10"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={subsection.duration}
                          onChange={(e) => updateSubsection(activeSection, subsection.id, 'duration', e.target.value)}
                          placeholder="e.g. 4 wks"
                          className="admin-form-input"
                          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td>
                        <button className="admin-action-btn secondary" title="Edit">
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="admin-modal-actions">
        <button className="admin-btn admin-btn-outline" onClick={() => {
          if (window.confirm('Reset to defaults?')) {
            setCurriculumData(prev => {
              const reset = {};
              const alphaSections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i)); // A-P
              const numSections = Array.from({ length: 20 }, (_, i) => String(i + 1)); // 1-20
              const allSections = [...alphaSections, ...numSections];

              allSections.forEach(section => {
                reset[section] = {
                  name: `Section ${section}`,
                  description: '',
                  subsections: Array.from({ length: 20 }, (_, i) => ({
                    id: i + 1,
                    title: `Topic ${i + 1}`,
                    content: '',
                    credits: 0,
                    duration: '4 weeks'
                  }))
                };
              });
              return reset;
            });
          }
        }}>
          RESET DEFAULTS
        </button>
        <button className="admin-btn admin-btn-primary" onClick={handleSave}>
          <FaSave /> SAVE CURRICULUM
        </button>
      </div>
    </div>
  );
};

export default CurriculumArchSection;
