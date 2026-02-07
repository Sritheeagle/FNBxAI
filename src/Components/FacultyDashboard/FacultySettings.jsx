import React, { useState, useEffect } from 'react';
import { FaLock, FaUser, FaEnvelope, FaIdCard, FaBuilding, FaShieldAlt, FaSave, FaCheck, FaChalkboardTeacher, FaPlus, FaTrash } from 'react-icons/fa';
import { apiPut } from '../../utils/apiClient';
import './FacultyDashboard.css';

/**
 * FACULTY SETTINGS
 * Manage profile details, security settings, and teaching assignments.
 */
const FacultySettings = ({ facultyData, onProfileUpdate }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        facultyId: '',
        department: 'CSE',
        designation: 'Faculty',
        phone: '',
        assignments: [] // [{ year, section, branch, subject }]
    });

    // Password State
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: ''
    });

    // New Assignment State
    const [newAssign, setNewAssign] = useState({
        year: '1',
        section: 'A',
        branch: 'CSE',
        subject: ''
    });

    useEffect(() => {
        if (facultyData) {
            setProfile({
                name: facultyData.name || '',
                email: facultyData.email || '',
                facultyId: facultyData.facultyId || '',
                department: facultyData.department || 'CSE',
                designation: facultyData.designation || 'Faculty',
                phone: facultyData.phone || '',
                assignments: facultyData.assignments || []
            });
        }
    }, [facultyData]);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleProfileChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handlePassChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const addAssignment = (e) => {
        e.preventDefault();
        if (!newAssign.subject) return showMessage("Please enter a subject name", "error");

        const updatedAssignments = [...profile.assignments, newAssign];
        setProfile({ ...profile, assignments: updatedAssignments });
        setNewAssign({ ...newAssign, subject: '' }); // Reset subject only
    };

    const removeAssignment = (index) => {
        const updatedAssignments = profile.assignments.filter((_, i) => i !== index);
        setProfile({ ...profile, assignments: updatedAssignments });
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Update profile using facultyId
            const response = await apiPut(`/api/faculty/${profile.facultyId}`, profile);
            if (response) {
                if (onProfileUpdate) onProfileUpdate(response);
                showMessage("Profile updated successfully!");
            }
        } catch (error) {
            console.error('Update failed:', error);
            showMessage("Failed to update profile.", "error");
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            showMessage("New passwords do not match.", "error");
            return;
        }
        if (passwords.new.length < 6) {
            showMessage("Password must be at least 6 characters.", "error");
            return;
        }

        setLoading(true);
        try {
            await apiPut(`/api/faculty/${profile.facultyId}`, { password: passwords.new });
            showMessage("Password changed successfully!", "success");
            setPasswords({ new: '', confirm: '' });
        } catch (error) {
            showMessage("Failed to update password.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="command-center animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>ACCOUNT <span>COMMAND</span></h2>
                    <p className="nexus-subtitle">Configure operational parameters and security protocols</p>
                </div>
                {message.text && (
                    <div className="f-sync-badge" style={{ background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: message.type === 'error' ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 850, fontSize: '0.75rem' }}>
                        {message.type === 'error' ? 'SYSTEM ALERT' : 'SIGNAL SUCCESS'}: {message.text.toUpperCase()}
                    </div>
                )}
            </header>

            <div className="f-node-card sentinel-floating" style={{ minHeight: '600px', padding: '2.5rem', animationDelay: '0s', position: 'relative', overflow: 'hidden' }}>
                <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-primary)', opacity: 0.2 }}></div>
                <div className="nexus-glass-pills" style={{ marginBottom: '3.5rem' }}>
                    <button className={`nexus-pill ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <FaUser /> TARGET PROFILE
                    </button>
                    <button className={`nexus-pill ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>
                        <FaChalkboardTeacher /> TEACHING PIPELINE
                    </button>
                    <button className={`nexus-pill ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
                        <FaShieldAlt /> SECURITY CORE
                    </button>
                </div>

                <div className="f-settings-tab-content">
                    {activeTab === 'profile' && (
                        <form onSubmit={saveProfile} className="animate-fade-in">
                            <div className="nexus-form-grid" style={{ marginBottom: '2.5rem' }}>
                                <div className="nexus-group">
                                    <label className="f-form-label"><FaUser /> FULL NAME</label>
                                    <input className="f-form-select" name="name" value={profile.name} onChange={handleProfileChange} disabled={loading} placeholder="Enter operational name..." />
                                </div>
                                <div className="nexus-group">
                                    <label className="f-form-label"><FaIdCard /> IDENTIFIER</label>
                                    <input className="f-form-select" name="facultyId" value={profile.facultyId} disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
                                </div>
                                <div className="nexus-group">
                                    <label className="f-form-label"><FaEnvelope /> COMMUNICATION EMAIL</label>
                                    <input className="f-form-select" name="email" value={profile.email} onChange={handleProfileChange} disabled={loading} placeholder="faculty@nexus.core" />
                                </div>
                                <div className="nexus-group">
                                    <label className="f-form-label"><FaBuilding /> SECTOR / DEPARTMENT</label>
                                    <input className="f-form-select" name="department" value={profile.department} onChange={handleProfileChange} disabled={loading} />
                                </div>
                                <div className="nexus-group">
                                    <label className="f-form-label"><FaShieldAlt /> RANK / DESIGNATION</label>
                                    <input className="f-form-select" name="designation" value={profile.designation} onChange={handleProfileChange} disabled={loading} />
                                </div>
                            </div>
                            <button type="submit" className="nexus-btn-primary" style={{ width: '100%', height: '56px' }} disabled={loading}>
                                {loading ? 'SYNCHRONIZING...' : <><FaSave /> COMMIT PROFILE CHANGES</>}
                            </button>
                        </form>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="animate-fade-in">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                {/* Add New Assignment Form */}
                                <div className="f-node-card shadow-sm" style={{ padding: '2rem', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.4rem', borderRadius: '8px', fontSize: '1rem' }}><FaPlus /></div>
                                        ADD CLASS NODE
                                    </h3>
                                    <div className="nexus-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                                        <div className="nexus-group">
                                            <label className="f-form-label">Academic Year</label>
                                            <select className="f-form-select" value={newAssign.year} onChange={e => setNewAssign({ ...newAssign, year: e.target.value })}>
                                                <option value="1">Year 1</option>
                                                <option value="2">Year 2</option>
                                                <option value="3">Year 3</option>
                                                <option value="4">Year 4</option>
                                            </select>
                                        </div>
                                        <div className="nexus-group">
                                            <label className="f-form-label">Branch Sector</label>
                                            <select className="f-form-select" value={newAssign.branch} onChange={e => setNewAssign({ ...newAssign, branch: e.target.value })}>
                                                <option value="CSE">CSE</option>
                                                <option value="IT">IT</option>
                                                <option value="ECE">ECE</option>
                                                <option value="EEE">EEE</option>
                                            </select>
                                        </div>
                                        <div className="nexus-group">
                                            <label className="f-form-label">Target Section</label>
                                            <select className="f-form-select" value={newAssign.section} onChange={e => setNewAssign({ ...newAssign, section: e.target.value })}>
                                                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(s => <option key={s} value={s}>Section {s}</option>)}
                                                {[...Array(10)].map((_, i) => (
                                                    <option key={i + 1} value={String(i + 1)}>Section {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="nexus-group">
                                            <label className="f-form-label">Subject Designation</label>
                                            <input className="f-form-select" value={newAssign.subject} onChange={e => setNewAssign({ ...newAssign, subject: e.target.value })} placeholder="e.g. Advanced Meta Systems" />
                                        </div>
                                    </div>
                                    <button className="nexus-pill active" onClick={addAssignment} style={{ width: '100%', marginTop: '2rem', height: '50px' }}><FaPlus /> APPEND TO PIPELINE</button>
                                </div>

                                {/* List Existing Assignments */}
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', marginBottom: '2rem' }}>ACTIVE TEACHING LOAD</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        {profile.assignments.length === 0 && (
                                            <div className="f-center-empty" style={{ padding: '4rem' }}>
                                                <p style={{ fontWeight: 850, color: '#cbd5e1' }}>NO ACTIVE PIPELINES</p>
                                            </div>
                                        )}
                                        {profile.assignments.map((assign, i) => (
                                            <div key={i} className="f-node-card sentinel-floating" style={{ padding: '1.25rem', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animationDelay: `${i * -0.5}s`, background: 'white' }}>
                                                <div>
                                                    <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1rem', letterSpacing: '-0.01em' }}>{assign.subject}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 900, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                        {assign.branch} • YEAR {assign.year} • SEC {assign.section}
                                                    </div>
                                                </div>
                                                <button onClick={() => removeAssignment(i)} className="f-quick-btn shadow delete" style={{ width: '36px', height: '36px', borderRadius: '10px' }}>
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '2.5rem', borderTop: '2px solid #f1f5f9', paddingTop: '2rem' }}>
                                        <button className="nexus-btn-primary" style={{ width: '100%', height: '56px' }} onClick={saveProfile} disabled={loading}>
                                            {loading ? 'SYNCHRONIZING...' : <><FaSave /> DEPLOY LOAD UPDATES</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={changePassword} className="animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div className="nexus-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="f-form-label"><FaLock /> NEW SECURITY KEY</label>
                                <input type="password" name="new" className="f-form-select" value={passwords.new} onChange={handlePassChange} placeholder="Define new access key..." disabled={loading} />
                            </div>
                            <div className="nexus-group" style={{ marginBottom: '2.5rem' }}>
                                <label className="f-form-label"><FaCheck /> VALIDATE KEY</label>
                                <input type="password" name="confirm" className="f-form-select" value={passwords.confirm} onChange={handlePassChange} placeholder="Re-enter for validation..." disabled={loading} />
                            </div>
                            <button type="submit" className="nexus-btn-primary" style={{ width: '100%', height: '56px' }} disabled={loading}>
                                {loading ? 'ENCRYPTING...' : 'INITIALIZE KEY ROTATION'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FacultySettings;
