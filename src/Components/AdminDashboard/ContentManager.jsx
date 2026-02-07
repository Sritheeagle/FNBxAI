import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTrash, FaUpload, FaLink, FaFileAlt, FaVideo, FaBook,
  FaRegFileAlt, FaBullhorn, FaPlus, FaFilter, FaSearch
} from 'react-icons/fa';
import api from '../../utils/apiClient';

/**
 * CONTENT MASTER COMMAND
 * Tactical management of educational assets and administrative broadcasts.
 */
const ContentManager = () => {
  const [activeYear, setActiveYear] = useState('1');
  const [activeBranch, setActiveBranch] = useState('CSE');
  const [selectedSections, setSelectedSections] = useState([]);
  const [activeContentType, setActiveContentType] = useState('notes');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    semester: '1',
    url: '',
    description: '',
    examYear: '',
    examType: '',
    questionFile: null,
    message: '',
    module: '',
    unit: '',
    topic: ''
  });

  const years = ['1', '2', '3', '4'];
  const branches = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML'];
  const sections = Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i)); // A-P

  const contentTypes = [
    { id: 'notes', label: 'NOTES', icon: <FaFileAlt /> },
    { id: 'videos', label: 'VIDEOS', icon: <FaVideo /> },
    { id: 'subjects', label: 'SUBJECTS', icon: <FaBook /> },
    { id: 'syllabus', label: 'SYLLABUS', icon: <FaRegFileAlt /> },
    { id: 'previousQuestions', label: 'PREV PAPERS', icon: <FaRegFileAlt /> },
    { id: 'modelPapers', label: 'MODEL PAPERS', icon: <FaRegFileAlt /> },
    { id: 'announcements', label: 'SIGNALS', icon: <FaBullhorn /> },
  ];

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.apiGet(`/api/materials?year=${activeYear}&branch=${activeBranch}`);
      setMaterials(res || []);
    } catch (err) {
      console.error('Failed to load materials', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [activeYear, activeBranch]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files?.[0]) {
      const file = files[0];
      if (file.size > 50 * 1024 * 1024) return alert('File size must be less than 50MB.');
      setFormData(prev => ({ ...prev, [name]: file }));
    }
  };

  const toggleSection = (sec) => {
    setSelectedSections(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isAnnouncement = activeContentType === 'announcements';

    if (!formData.title.trim() || (!isAnnouncement && !formData.subject.trim())) {
      return alert('Critical Data Missing: Title and Subject required.');
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('year', activeYear);
      data.append('section', selectedSections.join(','));
      data.append('subject', formData.subject.trim());
      data.append('type', activeContentType);
      data.append('title', formData.title.trim());
      data.append('branch', activeBranch);

      if (formData.url) data.append('link', formData.url);
      if (formData.message) data.append('message', formData.message);
      if (formData.examYear) data.append('dueDate', formData.examYear);
      if (formData.examType) data.append('message', formData.examType);
      if (formData.questionFile) data.append('file', formData.questionFile);

      if (formData.module) data.append('module', formData.module);
      if (formData.unit) data.append('unit', formData.unit);
      if (formData.topic) data.append('topic', formData.topic);
      if (formData.semester) data.append('semester', formData.semester);

      await api.apiPost('/api/materials', data);
      alert(`Protocol Committed: ${activeContentType} added.`);
      resetForm();
      loadMaterials();
    } catch (err) {
      console.error(err);
      alert('Protocol Failed: Uplink error.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', subject: '', semester: '1', url: '', description: '',
      examYear: '', examType: '', questionFile: null, message: '',
      module: '', unit: '', topic: ''
    });
    setSelectedSections([]);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Confirm Deletion Protocol: Evict this asset from registry?')) return;
    try {
      await api.apiDelete(`/api/materials/${itemId}`);
      loadMaterials();
    } catch (err) {
      alert('Purge Failed.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header className="admin-page-header">
        <div className="admin-page-title">
          <h1>CONTENT <span>MASTER</span></h1>
          <p>Strategic asset management and administrative broadcast control</p>
        </div>
      </header>

      <div className="admin-grid-3 mb-lg">
        <div className="admin-card sentinel-floating" style={{ animationDelay: '0s' }}>
          <div className="sentinel-scanner"></div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 950, color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>1. SECTOR PARAMETERS</h3>
          <div className="admin-form-group">
            <label className="admin-form-label">ACADEMIC YEAR</label>
            <select className="admin-form-input" value={activeYear} onChange={e => setActiveYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">BRANCH DOMAIN</label>
            <select className="admin-form-input" value={activeBranch} onChange={e => setActiveBranch(e.target.value)}>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="admin-card sentinel-floating" style={{ gridColumn: 'span 2', animationDelay: '-1s' }}>
          <div className="sentinel-scanner"></div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 950, color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>2. ASSET CLASSIFICATION</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {contentTypes.map(type => (
              <button
                key={type.id}
                className={`admin-btn ${activeContentType === type.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                onClick={() => setActiveContentType(type.id)}
                style={{ height: '44px', fontSize: '0.7rem', fontWeight: 950 }}
              >
                {type.icon} <span style={{ marginLeft: '0.5rem' }}>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-grid-3">
        <div className="admin-card sentinel-floating" style={{ gridColumn: 'span 1', animationDelay: '-2s' }}>
          <div className="sentinel-scanner"></div>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 950, color: '#94a3b8', marginBottom: '2rem' }}>3. INITIALIZE NEW ASSET</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label className="admin-form-label">ASSET TITLE</label>
              <input className="admin-form-input" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Quantum Computing v1.2" required />
            </div>

            {activeContentType !== 'announcements' && (
              <div className="admin-form-group">
                <label className="admin-form-label">SUBJECT MODULE</label>
                <input className="admin-form-input" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Subject Identifier" required />
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">TARGET SECTORS (SECTIONS)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', maxHeight: '120px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                {sections.map(sec => (
                  <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 850, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedSections.includes(sec)} onChange={() => toggleSection(sec)} /> {sec}
                  </label>
                ))}
              </div>
            </div>

            {activeContentType === 'announcements' ? (
              <div className="admin-form-group">
                <label className="admin-form-label">SIGNAL MESSAGE</label>
                <textarea className="admin-form-input" name="message" value={formData.message} onChange={handleInputChange} rows="4" placeholder="Transmit your message..."></textarea>
              </div>
            ) : (
              <>
                <div className="admin-grid-2">
                  <div className="admin-form-group">
                    <label className="admin-form-label">SEMESTER</label>
                    <select className="admin-form-input" name="semester" value={formData.semester} onChange={handleInputChange}>
                      <option value="1">SEM 1</option><option value="2">SEM 2</option>
                    </select>
                  </div>
                  {activeContentType === 'notes' && (
                    <div className="admin-form-group">
                      <label className="admin-form-label">MODULE</label>
                      <select className="admin-form-input" name="module" value={formData.module} onChange={handleInputChange}>
                        <option value="">N/A</option>{[1, 2, 3, 4, 5].map(m => <option key={m} value={m}>M-{m}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">EXTERNAL UPLINK (URL)</label>
                  <input className="admin-form-input" name="url" value={formData.url} onChange={handleInputChange} placeholder="https://..." />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">LOCAL ASSET (UPLOAD)</label>
                  <div style={{ position: 'relative' }}>
                    <input type="file" id="asset-upload" hidden onChange={handleFileChange} name="questionFile" />
                    <button type="button" onClick={() => document.getElementById('asset-upload').click()} className="admin-btn admin-btn-outline" style={{ width: '100%', height: '48px', justifyContent: 'center' }}>
                      <FaUpload /> {formData.questionFile ? formData.questionFile.name.substring(0, 15) + '...' : 'UPLOAD FILE'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1, height: '48px' }} disabled={loading}>
                {loading ? 'COMMITTING...' : 'COMMIT ASSET'}
              </button>
              <button type="button" onClick={resetForm} className="admin-btn admin-btn-outline" style={{ height: '48px' }}>RESET</button>
            </div>
          </form>
        </div>

        <div className="admin-card sentinel-floating" style={{ gridColumn: 'span 2', animationDelay: '-3s' }}>
          <div className="sentinel-scanner"></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 950, color: '#94a3b8' }}>4. REGISTRY: {activeContentType.toUpperCase()}</h3>
            <div className="admin-badge primary" style={{ fontWeight: 950 }}>{materials.filter(m => m.type === activeContentType).length} ACTIVE NODES</div>
          </div>

          <div className="admin-table-wrap" style={{ maxHeight: '720px' }}>
            <table className="admin-grid-table">
              <thead>
                <tr>
                  <th>IDENTIFIER</th>
                  <th>MODULE / SECTOR</th>
                  <th>DATA NODE</th>
                  <th>PURGE</th>
                </tr>
              </thead>
              <tbody>
                {materials.filter(m => m.type === activeContentType).map((item, idx) => (
                  <tr key={item._id || idx}>
                    <td>
                      <div style={{ fontWeight: 950, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 850, color: '#94a3b8' }}>Type: {item.type.toUpperCase()}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 850, fontSize: '0.8rem' }}>{item.subject}</div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                        <span className="admin-badge secondary" style={{ fontSize: '0.55rem', fontWeight: 950, padding: '2px 6px' }}>SEC: {item.section}</span>
                        {item.module && <span className="admin-badge primary" style={{ fontSize: '0.55rem', fontWeight: 950, padding: '2px 6px' }}>MOD: {item.module}</span>}
                      </div>
                    </td>
                    <td>
                      {item.link || item.url ? (
                        <a href={item.link || item.url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.6rem', border: '1px solid #e2e8f0' }}>
                          <FaLink /> VIEW
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 850 }}>OFFLINE</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleDelete(item._id || item.id)} className="admin-action-btn danger" style={{ background: '#fff1f2', border: 'none', width: '32px', height: '32px', borderRadius: '8px' }}>
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
                {materials.filter(m => m.type === activeContentType).length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '6rem', color: '#94a3b8', fontWeight: 850 }}>NO ACTIVE DATA NODES FOUND IN SELECTED SECTOR</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentManager;
