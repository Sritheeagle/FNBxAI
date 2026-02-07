import React from 'react';
import { FaGraduationCap, FaUserCheck, FaBookReader } from 'react-icons/fa';
import './FacultyClassPulse.css';

const FacultyClassPulse = ({ studentsCount = 0, materialsCount = 0 }) => {
    return (
        <div className="f-stats-grid">
            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s', background: 'white' }}>
                <div className="summary-icon-box" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--nexus-primary)' }}>
                    <FaGraduationCap />
                </div>
                <div className="value">{studentsCount}</div>
                <div className="label">ASSIGNED STUDENTS</div>
            </div>

            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1.5s', background: 'white' }}>
                <div className="summary-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <FaBookReader />
                </div>
                <div className="value">{materialsCount}</div>
                <div className="label">ACTIVE DEPLOYMENTS</div>
            </div>

            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s', background: 'white' }}>
                <div className="summary-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <FaUserCheck />
                </div>
                <div className="value">94%</div>
                <div className="label">POSITIVE FEEDBACK</div>
            </div>
        </div>
    );
};

export default FacultyClassPulse;
