import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTrash, FaFilter } from 'react-icons/fa';
import { apiUpload, apiPost, apiGet, apiDelete } from '../../utils/apiClient';

/**
 * NEXUS CONTENT DEPLOYMENT HUB
 * Central interface for orchestrating academic resources and tactical broadcasts.
 */
const MaterialManager = ({ selectedSubject, selectedSections, onUploadSuccess }) => {
    // Proactive hardening
    selectedSubject = selectedSubject || 'General - Year 1';
    selectedSections = selectedSections || [];
    const [uploadType, setUploadType] = useState('notes');
    const [materials, setMaterials] = useState({
        notes: null, videos: null, modelPapers: null, syllabus: null, assignments: null, interviewQnA: null
    });
    const [formData, setFormData] = useState({ module: '1', unit: '1', topic: '', title: '', semester: '1' });
    const [assignmentDetails] = useState({ dueDate: '', message: '' });
    const [activeTab, setActiveTab] = useState('upload');
    const [globalResources, setGlobalResources] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [broadcastType] = useState('announcement');
    const [editId, setEditId] = useState(null);

    useEffect(() => {
        if (selectedSubject && selectedSections.length > 0) {
            fetchGlobalResources();
        }
    }, [selectedSubject, selectedSections]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchGlobalResources = async () => {
        if (!selectedSubject) return;
        const parts = selectedSubject.split(' - Year ');
        const subject = parts[parts.length - 2] || 'General';
        const year = parts[parts.length - 1] || '1';

        try {
            const data = await apiGet(`/api/materials?year=${year}&subject=${encodeURIComponent(subject)}`);
            if (data) setGlobalResources(data.filter(m => String(m.year) === String(year)));
        } catch (err) { console.error("Error fetching materials registry:", err); }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) setMaterials(prev => ({ ...prev, [name]: files[0] }));
    };

    const getContext = () => {
        const parts = selectedSubject.split(' - Year ');
        const year = parts[parts.length - 1] || '1';
        const subject = parts.slice(0, parts.length - 1).join(' - Year ') || 'General';
        return { subject, year };
    };

    const handleUpload = async () => {
        if (selectedSections.length === 0) return alert('Upload Error: Please select at least one section.');
        const { subject, year } = getContext();
        const file = materials[uploadType];
        if (!editId && !file) return alert('Upload Error: Please select a file.');

        try {
            const apiFormData = new FormData();
            if (file) apiFormData.append('file', file);
            apiFormData.append('year', year);
            apiFormData.append('semester', formData.semester || '1');
            apiFormData.append('section', selectedSections.join(','));
            apiFormData.append('subject', subject);
            apiFormData.append('type', uploadType);
            apiFormData.append('title', file ? file.name : formData.title);
            apiFormData.append('module', formData.module);
            apiFormData.append('unit', formData.unit);
            if (formData.topic) apiFormData.append('topic', formData.topic);
            if (formData.duration) apiFormData.append('duration', formData.duration);
            if (formData.videoAnalysis) apiFormData.append('videoAnalysis', formData.videoAnalysis);
            if (formData.examYear) apiFormData.append('examYear', formData.examYear);
            apiFormData.append('uploadedBy', 'faculty');

            if (uploadType === 'assignments') {
                apiFormData.append('dueDate', assignmentDetails.dueDate);
                apiFormData.append('message', assignmentDetails.message);
            }

            if (editId) await apiUpload(`/api/materials/${editId}`, apiFormData, 'PUT');
            else await apiUpload('/api/materials', apiFormData);

            alert('Success: Material uploaded/updated.');
            setMaterials(prev => ({ ...prev, [uploadType]: null }));
            setFormData({ module: '1', unit: '1', topic: '', title: '', semester: '1' });
            setEditId(null);
            if (onUploadSuccess) onUploadSuccess();
            fetchGlobalResources();
        } catch (error) { alert(`Upload Failed: ${error.message}`); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await apiDelete(`/api/materials/${id}`);
            fetchGlobalResources();
        } catch (e) { alert("Delete Failed: " + e.message); }
    };

    const handleEdit = (res) => {
        setUploadType(res.type);
        setFormData({
            module: res.module || '1',
            unit: res.unit || '1',
            topic: res.topic || '',
            title: res.title || '',
            semester: res.semester || '1',
            duration: res.duration || '',
            videoAnalysis: res.videoAnalysis || ''
        });
        setEditId(res._id || res.id);
        setActiveTab('upload');
    };

    const handleLinkAdd = async () => {
        const title = document.getElementById('link-title').value;
        const url = document.getElementById('link-url').value;
        const type = document.getElementById('link-type').value;
        if (!title || !url) return alert('Error: Title and URL required.');
        const { subject, year } = getContext();
        try {
            const analysis = document.getElementById('link-analysis')?.value;
            const linkForm = new FormData();
            linkForm.append('title', title);
            linkForm.append('year', year);
            linkForm.append('section', selectedSections.join(','));
            linkForm.append('subject', subject);
            linkForm.append('type', type);
            linkForm.append('link', url);
            linkForm.append('uploadedBy', 'faculty');
            if (analysis) linkForm.append('videoAnalysis', analysis);
            await apiUpload('/api/materials', linkForm);
            alert('Success: Link added.');
            if (onUploadSuccess) onUploadSuccess();
            fetchGlobalResources();
        } catch (error) { alert('Error: Failed to add link.'); }
    };

    return (
        <div className="deployment-hub animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>CONTENT <span>DEPLOYMENT</span></h2>
                    <p className="nexus-subtitle">Orchestrate and distribute academic assets across course pipelines</p>
                </div>
                <div className="nexus-glass-pills" style={{ marginBottom: 0 }}>
                    <button className={`nexus-pill ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>FILES</button>
                    <button className={`nexus-pill ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>LINKS</button>
                    <button className={`nexus-pill ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>ALERTS</button>
                    <button className={`nexus-pill ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>REGISTRY</button>
                </div>
            </header>

            <div className="f-node-card animate-slide-up" style={{ minHeight: '550px', padding: '2.5rem' }}>
                {activeTab === 'upload' && (
                    <div className="animate-fade-in">
                        <div className="f-type-selector-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                            {['notes', 'videos', 'assignments', 'modelPapers', 'interviewQnA'].map(t => (
                                <button
                                    key={t}
                                    className={`nexus-pill ${uploadType === t ? 'active' : ''}`}
                                    onClick={() => setUploadType(t)}
                                    style={{ width: '100%', height: '48px', borderRadius: '14px', fontSize: '0.7rem' }}
                                >
                                    {t.replace(/([A-Z])/g, ' $1').toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div
                            className="nexus-dropzone"
                            onClick={() => document.getElementById(uploadType).click()}
                            style={{
                                height: '220px',
                                border: '2px dashed #e2e8f0',
                                borderRadius: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: '#f8fafc',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <input type="file" id={uploadType} name={uploadType} style={{ display: 'none' }} onChange={handleFileChange} />
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--accent-primary)', opacity: 0.1 }}></div>
                            <FaCloudUploadAlt style={{ fontSize: '3.5rem', color: 'var(--accent-primary)', marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2))' }} />
                            <h3 style={{ margin: 0, fontWeight: 950, color: '#1e293b', fontSize: '1.2rem' }}>
                                {materials[uploadType] ? materials[uploadType].name : 'INITIALIZE TARGET UPLOAD'}
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 850, marginTop: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <FaFilter /> {selectedSubject}
                            </p>
                        </div>

                        <div className="nexus-form-grid" style={{ marginTop: '3rem', marginBottom: '3rem' }}>
                            <div className="nexus-group">
                                <label className="f-form-label">OPERATIONAL TOPIC / TITLE</label>
                                <input placeholder="e.g. System Architecture v2.0" value={formData.topic} onChange={e => setFormData({ ...formData, topic: e.target.value })} className="f-form-select" />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label">MODULE DESIGNATION</label>
                                <select className="f-form-select" value={formData.module} onChange={e => setFormData({ ...formData, module: e.target.value })}>
                                    {[1, 2, 3, 4, 5].map(m => <option key={m} value={m}>Module {m}</option>)}
                                </select>
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label">UNIT IDENTIFIER</label>
                                <select className="f-form-select" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                                    {[1, 2, 3, 4, 5].map(u => <option key={u} value={u}>Unit {u}</option>)}
                                </select>
                            </div>
                            {uploadType === 'videos' && (
                                <>
                                    <div className="nexus-group">
                                        <label className="f-form-label">TEMPORAL FOOTPRINT (DURATION)</label>
                                        <input placeholder="e.g. 15:00" value={formData.duration || ''} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="f-form-select" />
                                    </div>
                                    <div className="nexus-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="f-form-label">AI INSIGHTS / VIDEO ANALYSIS (FOR VUAI AGENT)</label>
                                        <textarea
                                            placeholder="Provide key takeaways, timestamps, or academic context for the AI agent..."
                                            value={formData.videoAnalysis || ''}
                                            onChange={e => setFormData({ ...formData, videoAnalysis: e.target.value })}
                                            className="f-form-textarea"
                                            style={{ height: '100px', background: '#f8fafc' }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <button className="nexus-btn-primary" onClick={handleUpload} style={{ width: '100%', height: '64px', borderRadius: '18px', boxShadow: '0 15px 30px -10px rgba(99, 102, 241, 0.4)' }}>
                            {editId ? 'COMMIT ASSET REFINEMENT' : <><FaCloudUploadAlt /> DEPLOY TO ACADEMIC PIPELINE</>}
                        </button>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="registry-nexus animate-fade-in">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {globalResources.length > 0 ? globalResources.map((res, i) => (
                                <div key={i} className="f-modal-list-item animate-slide-up" style={{ animationDelay: `${i * 0.05}s`, background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                        <div style={{ background: 'white', color: 'var(--accent-primary)', width: '52px', height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: 950, fontSize: '0.8rem' }}>
                                            {res.type?.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1rem' }}>{res.title || res.topic}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 850, color: '#94a3b8', marginTop: '0.3rem', textTransform: 'uppercase' }}>
                                                MOD {res.module} • UNIT {res.unit} • {res.type}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="f-quick-btn shadow" onClick={() => handleEdit(res)} title="Refine Node"><FaCloudUploadAlt /></button>
                                        <button className="f-quick-btn shadow delete" onClick={() => handleDelete(res._id || res.id)} title="Purge Node"><FaTrash /></button>
                                    </div>
                                </div>
                            )) : (
                                <div className="f-center-empty" style={{ padding: '5rem' }}>
                                    <p style={{ fontWeight: 850, color: '#cbd5e1', letterSpacing: '0.1em' }}>NO ASSETS DETECTED IN REGISTRY</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'broadcast' && (
                    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <div className="nexus-group" style={{ marginBottom: '2.5rem' }}>
                            <label className="f-form-label">TACTICAL SIGNAL (BROADCAST MESSAGE)</label>
                            <textarea
                                className="f-form-textarea"
                                value={broadcastMsg}
                                onChange={(e) => setBroadcastMsg(e.target.value)}
                                placeholder="Define emergency alert or general broadcast parameters..."
                                style={{ height: '240px', padding: '1.5rem', background: '#f8fafc' }}
                            />
                        </div>
                        <button
                            className="nexus-btn-primary"
                            style={{ width: '100%', height: '60px' }}
                            onClick={async () => {
                                if (!broadcastMsg) return alert('Signal message required.');
                                const { subject, year } = getContext();
                                await apiPost('/api/faculty/messages', { message: broadcastMsg, type: broadcastType, year, sections: selectedSections, subject });
                                alert('Broadcast Signal Transmitted.'); setBroadcastMsg('');
                            }}
                        >
                            INITIALIZE SYSTEM BROADCAST
                        </button>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="nexus-form-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <div className="nexus-group">
                                <label className="f-form-label">REFERENCE NODE TITLE</label>
                                <input id="link-title" placeholder="e.g. External Deep Learning Guide" className="f-form-select" />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label">DIGITAL ACCESS URL</label>
                                <input id="link-url" placeholder="https://resource.nexus.core/..." className="f-form-select" />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label">RESOURCE CLASSIFICATION</label>
                                <select id="link-type" className="f-form-select">
                                    <option value="notes">Digital Documentation</option>
                                    <option value="videos">Video Stream Node</option>
                                </select>
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label">AI INSIGHTS / VIDEO ANALYSIS (FOR VUAI AGENT)</label>
                                <textarea id="link-analysis" placeholder="Synthesize the video content for the AI agent..." className="f-form-textarea" style={{ height: '120px', background: '#f8fafc' }} />
                            </div>
                        </div>
                        <button className="nexus-btn-primary" onClick={handleLinkAdd} style={{ width: '100%', height: '60px' }}>
                            ATTACH DIGITAL ASSET LINK
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaterialManager;
