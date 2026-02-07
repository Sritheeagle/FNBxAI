import React from 'react';
import { FaUserCircle, FaIdBadge, FaUniversity, FaLayerGroup, FaPen } from 'react-icons/fa';
import './StudentProfileCard.css';

/**
 * Student Profile Card
 * Clean, professional identity card.
 */
const StudentProfileCard = ({ userData, setShowProfilePhotoModal, setView }) => {
    return (
        <div className="profile-card">
            <div className="profile-avatar-container" onClick={() => setView('settings')}>
                <div className="profile-avatar">
                    {userData?.profilePic ? (
                        <img
                            src={userData.profilePic.startsWith('data:') || userData.profilePic.startsWith('http')
                                ? userData.profilePic
                                : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}${userData.profilePic.startsWith('/') ? '' : '/'}${userData.profilePic}`}
                            alt="Profile"
                            onError={(e) => {
                                console.warn("Profile image load failed, falling back to avatar.");
                                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.studentName || 'Student'}`;
                            }}
                            className="profile-img"
                        />
                    ) : userData?.avatar ? (
                        <img src={userData.avatar.includes('http') ? userData.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.avatar}`} alt="Avatar" />
                    ) : (
                        <div className="profile-avatar-fallback">
                            <FaUserCircle />
                        </div>
                    )}
                </div>
                <div className="profile-status-dot pulse" title="Active"></div>
            </div>

            <div className="profile-info">
                <h3>{userData?.studentName || 'Vignan Student'}</h3>
                <div className="profile-id">
                    <FaIdBadge /> {userData?.sid ? userData.sid.toUpperCase() : 'ID'}
                </div>
            </div>

            <div className="profile-info-grid">
                <div className="nexus-info-pill">
                    <span className="pill-label">BRANCH</span>
                    <span className="pill-value">{userData?.branch || 'General'}</span>
                    <FaUniversity className="pill-icon" />
                </div>
                <div className="nexus-info-pill">
                    <span className="pill-label">YEAR</span>
                    <span className="pill-value">Year {userData?.year || '1'}</span>
                    <FaLayerGroup className="pill-icon" />
                </div>
                <div className="nexus-info-pill">
                    <span className="pill-label">SECTION</span>
                    <span className="pill-value">Sec {userData?.section || 'A'}</span>
                    <FaLayerGroup className="pill-icon" />
                </div>
            </div>

            <button
                className="nexus-logout-btn"
                style={{ width: '100%', justifyContent: 'center', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', marginTop: '1rem' }}
                onClick={() => setView('settings')}
            >
                <FaPen size={12} /> Edit Profile
            </button>
        </div>
    );
};

export default StudentProfileCard;
