import React, { useState, useEffect } from 'react';
import { FaUserShield, FaKey, FaSave, FaCamera, FaEnvelope, FaIdCard, FaUniversity, FaLayerGroup, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../../../utils/apiClient';
import './StudentSettings.css';

/**
 * STUDENT SETTINGS (Premium)
 * Manage profile details, avatar, and security settings.
 */
const StudentSettings = ({ userData, onProfileUpdate }) => {
    // Hardening against null userData
    userData = userData || {};
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
    const [loading, setLoading] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        studentName: '',
        email: '',
        sid: '',
        year: 1,
        branch: 'CSE',
        section: 'A',
        profilePic: ''
    });

    // Password State
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        if (userData) {
            setProfile({
                studentName: userData.studentName || '',
                email: userData.email || '',
                sid: userData.sid || '',
                year: userData.year || 1,
                branch: userData.branch || 'CSE',
                section: userData.section || 'A',
                profilePic: userData.profilePic || ''
            });
        }
    }, [userData]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarSelect = (url) => {
        setProfile(prev => ({ ...prev, profilePic: url }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, profilePic: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const sid = userData?.sid || profile.sid;
            const response = await api.apiPut(`/api/students/profile/${sid}`, profile);
            const updatedProfile = response.student || response.updatedStudent || response;

            // Update local storage and parent state
            const currentUser = JSON.parse(localStorage.getItem('userData')) || {};
            const mergedUser = { ...currentUser, ...updatedProfile };
            localStorage.setItem('userData', JSON.stringify(mergedUser));

            if (onProfileUpdate) onProfileUpdate(mergedUser);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Profile Save Failed:', error);
            toast.error('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords do not match.");
            return;
        }
        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            await api.apiPut(`/api/students/change-password/${profile.sid}`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            });
            toast.success('Password changed successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (error) {
            console.error('Password Change Failed:', error);
            toast.error(error.response?.data?.error || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    // Avatar Seeds
    const avatarSeeds = [
        'Felix', 'Aneka', 'Bob', 'Caitlyn', 'Dieter', 'Evelyn', 'Flo', 'Gunnar', 'Heidi', 'Ivan'
    ];

    return (
        <div className="nexus-page-container fade-in">
            <header className="page-section-header">
                <div>
                    <h2 className="title-with-icon">
                        <FaUserShield className="header-icon" />
                        SETTINGS & <span>SECURITY</span>
                    </h2>
                    <p className="subtitle">Manage your digital identity and account safety.</p>
                </div>
            </header>

            <div className="settings-layout">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    <div className="settings-user-preview">
                        <div className="settings-avatar-wrapper">
                            <img
                                src={profile.profilePic
                                    ? (profile.profilePic.startsWith('data:') || profile.profilePic.startsWith('http')
                                        ? profile.profilePic
                                        : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}${profile.profilePic.startsWith('/') ? '' : '/'}${profile.profilePic}`)
                                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.studentName || 'Student'}`}
                                alt="Profile"
                                onError={(e) => {
                                    console.warn("Settings profile image load failed, falling back.");
                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.studentName || 'Student'}`;
                                }}
                            />
                        </div>
                        <h3>{profile.studentName}</h3>
                        <span>{profile.sid}</span>
                    </div>

                    <div className="settings-nav">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`s-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        >
                            <FaUserShield /> Profile Details
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`s-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                        >
                            <FaKey /> Security & Login
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="settings-content">
                    <AnimatePresence mode='wait'>
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="settings-section-title">
                                    <FaUserShield style={{ color: 'var(--v-primary)' }} /> Edit Profile
                                </h2>

                                <div className="form-section" style={{ marginBottom: '2rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#475569', marginBottom: '1rem' }}>Profile Avatar</label>
                                    <div className="avatar-selector">
                                        {avatarSeeds.map(seed => {
                                            const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                                            return (
                                                <div
                                                    key={seed}
                                                    onClick={() => handleAvatarSelect(url)}
                                                    className={`avatar-option ${profile.profilePic === url ? 'selected' : ''}`}
                                                >
                                                    <img src={url} alt={seed} />
                                                </div>
                                            );
                                        })}
                                        <label className="avatar-upload-btn">
                                            <FaCamera />
                                            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>

                                <form onSubmit={saveProfile} className="settings-form">
                                    <div className="form-group full-width">
                                        <label>Full Name</label>
                                        <input
                                            type="text"
                                            name="studentName"
                                            value={profile.studentName}
                                            onChange={handleProfileChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaIdCard /> Student ID</label>
                                        <input
                                            type="text"
                                            name="sid"
                                            value={profile.sid}
                                            readOnly
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaEnvelope /> Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleProfileChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label><FaUniversity /> Branch</label>
                                        <select
                                            name="branch"
                                            value={profile.branch}
                                            onChange={handleProfileChange}
                                        >
                                            <option value="CSE">CSE</option>
                                            <option value="IT">IT</option>
                                            <option value="ECE">ECE</option>
                                            <option value="EEE">EEE</option>
                                            <option value="MECH">MECH</option>
                                            <option value="CIVIL">CIVIL</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label><FaLayerGroup /> Year</label>
                                        <select
                                            name="year"
                                            value={profile.year}
                                            onChange={handleProfileChange}
                                        >
                                            <option value="1">Year 1</option>
                                            <option value="2">Year 2</option>
                                            <option value="3">Year 3</option>
                                            <option value="4">Year 4</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label><FaLayerGroup /> Section</label>
                                        <select
                                            name="section"
                                            value={profile.section}
                                            onChange={handleProfileChange}
                                        >
                                            {[...Array(20)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>Section {i + 1}</option>
                                            ))}
                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(char => (
                                                <option key={char} value={char}>Section {char}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="settings-save-btn"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                <h2 className="settings-section-title">
                                    <FaKey style={{ color: '#f59e0b' }} /> Password & Security
                                </h2>

                                <div className="security-alert">
                                    <h4><FaExclamationCircle /> Security Notice</h4>
                                    <p>
                                        To ensure your account remains secure, use a strong password with at least 8 characters, including numbers and symbols.
                                    </p>
                                </div>

                                <form onSubmit={changePassword} style={{ maxWidth: '500px' }}>
                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '0.6rem' }}>Current Password</label>
                                        <input
                                            type="password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '0.6rem' }}>New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                            required
                                            minLength={6}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#64748b', marginBottom: '0.6rem' }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                            required
                                            className="form-input"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="settings-save-btn"
                                        style={{ marginLeft: 0 }}
                                    >
                                        {loading ? 'Processing...' : <><FaCheckCircle /> Update Password</>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default StudentSettings;
