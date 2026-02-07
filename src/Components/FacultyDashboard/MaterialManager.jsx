import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt, FaTrash, FaFilter } from 'react-icons/fa';
import { apiUpload, apiPost, apiGet, apiDelete } from '../../utils/apiClient';

import sseClient from '../../utils/sseClient';

/**
 * NEXUS CONTENT DEPLOYMENT HUB
 * Central interface for orchestrating academic resources and tactical broadcasts.
 */
const MaterialManager = ({ selectedSubject, selectedBranch, selectedSections, onUploadSuccess }) => {
    // Proactive hardening
    const subjectContext = selectedSubject || 'General - Year 1';
    const branchContext = selectedBranch || 'All';
    const sectionsContext = selectedSections || [];

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

    // Real-Time Sync
    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'materials') {
                fetchGlobalResources(); // Refresh on any material change
            }
        });
        return unsub;
    }, [subjectContext, branchContext]); // Re-bind if subject or branch changes

    useEffect(() => {
        if (subjectContext && sectionsContext.length > 0) {
            fetchGlobalResources();
        }
    }, [subjectContext, sectionsContext, branchContext]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchGlobalResources = async () => {
        if (!subjectContext) return;
        const { subject, year } = getContext();

        try {
            const data = await apiGet(`/api/materials?year=${year}&subject=${encodeURIComponent(subject)}&branch=${encodeURIComponent(branchContext)}`);
            if (data) {
                setGlobalResources(data.filter(m => {
                    const mYear = String(m.year || '').toUpperCase();
                    const sYear = String(year).toUpperCase();
                    const yearMatch = mYear === sYear || mYear === 'ALL';
                    const mBranch = String(m.branch || 'All').toUpperCase();
                    const sBranch = String(branchContext).toUpperCase();
                    const branchMatch = mBranch === 'ALL' || sBranch === 'ALL' || mBranch === sBranch;
                    return yearMatch && branchMatch;
                }));
            }
        } catch (err) { console.error("Error fetching materials registry:", err); }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) setMaterials(prev => ({ ...prev, [name]: files[0] }));
    };

    const getContext = () => {
        if (!subjectContext) return { subject: 'General', year: '1' };
        const parts = subjectContext.split(' - Year ');
        if (parts.length < 2) return { subject: subjectContext, year: '1' };

        const year = parts[parts.length - 1];
        const subject = parts.slice(0, parts.length - 1).join(' - Year ');
        return { subject, year };
    };

    const handleUpload = async () => {
        if (sectionsContext.length === 0) return alert('Upload Error: Please select at least one section.');
        const { subject, year } = getContext();
        const file = materials[uploadType];
        if (!editId && !file) return alert('Upload Error: Please select a file.');

        try {
            const apiFormData = new FormData();
            if (file) apiFormData.append('file', file);
            apiFormData.append('year', year);
            apiFormData.append('semester', formData.semester || '1');
            apiFormData.append('branch', branchContext);
            apiFormData.append('section', sectionsContext.sort().join(','));
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
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            await apiDelete(`/api/materials/${id}`);
            alert("Success: Material purged.");
        } catch (e) {
            console.error("[Delete Material] Error:", e);
            alert("Delete Failed: " + e.message);
        } finally {
            fetchGlobalResources();
        }
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
            linkForm.append('branch', branchContext);
            linkForm.append('section', sectionsContext.sort().join(','));
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
                            className="nexus-dropzone sentinel-floating"
                            onClick={() => document.getElementById(uploadType).click()}
                            style={{
                                height: '240px',
                                border: '2px dashed ' + (materials[uploadType] ? '#10b981' : '#e2e8f0'),
                                borderRadius: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: materials[uploadType] ? 'rgba(16, 185, 129, 0.02)' : '#f8fafc',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                animationDelay: '0s'
                            }}
                        >
                            <input type="file" id={uploadType} name={uploadType} style={{ display: 'none' }} onChange={handleFileChange} />
                            <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: materials[uploadType] ? '#10b981' : 'var(--accent-primary)', opacity: 0.3 }}></div>
                            <FaCloudUploadAlt style={{ fontSize: '4rem', color: materials[uploadType] ? '#10b981' : 'var(--accent-primary)', marginBottom: '1.5rem', filter: `drop-shadow(0 10px 20px ${materials[uploadType] ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'})` }} />
                            <h3 style={{ margin: 0, fontWeight: 950, color: '#1e293b', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                                {materials[uploadType] ? materials[uploadType].name : 'INITIALIZE TARGET DEPLOYMENT'}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                <span className="f-meta-badge type" style={{ background: '#f1f5f9', color: '#64748b' }}>SUBJECT: {subjectContext.split(' - ')[0]}</span>
                                <span className="f-meta-badge type" style={{ background: '#f1f5f9', color: '#64748b' }}>STATUS: READY</span>
                            </div>
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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            {globalResources.length > 0 ? globalResources.map((res, i) => (
                                <div key={i} className="f-modal-list-item sentinel-floating" style={{ animationDelay: `${i * -0.5}s`, background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', opacity: 0.1 }}></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)', fontWeight: 950, fontSize: '0.8rem' }}>
                                            {res.type?.substring(0, 3).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1.05rem', letterSpacing: '-0.01em' }}>{res.title || res.topic}</div>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                MODULE {res.module} • UNIT {res.unit} • {res.type}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="f-quick-btn shadow" style={{ width: '36px', height: '36px', borderRadius: '10px' }} onClick={() => handleEdit(res)} title="Refine Node"><FaCloudUploadAlt /></button>
                                        <button className="f-quick-btn shadow delete" style={{ width: '36px', height: '36px', borderRadius: '10px' }} onClick={() => handleDelete(res._id || res.id)} title="Purge Node"><FaTrash /></button>
                                    </div>
                                </div>
                            )) : (
                                <div className="f-node-card f-center-empty" style={{ gridColumn: '1 / -1', padding: '6rem' }}>
                                    <div style={{ fontSize: '4rem', marginBottom: '2rem', opacity: 0.2 }}>📦</div>
                                    <p style={{ fontWeight: 950, color: '#94a3b8', letterSpacing: '0.15em', fontSize: '0.8rem' }}>REGISTRY REPOSITORY EMPTY</p>
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
                                await apiPost('/api/faculty/messages', { message: broadcastMsg, type: broadcastType, year, sections: sectionsContext, subject, branch: branchContext });
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
