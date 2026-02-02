import React from 'react';
import { FaChartLine, FaClock, FaFire, FaRobot, FaGraduationCap, FaShieldAlt, FaWaveSquare } from 'react-icons/fa';
import './AcademicPulse.css';

/**
 * DASHBOARD SUMMARY
 * A premium real-time visualization of student academic progress.
 */
const AcademicPulse = ({ data }) => {
    // Data Extraction & Sanitization
    const attendance = Math.min(100, data?.attendance?.overall ?? 0);
    const marks = Math.min(100, data?.academics?.overallPercentage ?? 0);
    const streak = data?.activity?.streak ?? 0;
    const aiUsage = data?.activity?.aiUsage ?? 0;
    const examsTaken = data?.academics?.totalExamsTaken ?? 0;
    const growth = data?.activity?.advancedLearning ?? 0;

    return (
        <div className="nexus-pulse-v2">
            <div className="pulse-card-header">
                <div className="pulse-brand-box">
                    <div className="pulse-brand-logo">
                        <FaWaveSquare />
                    </div>
                    <div className="pulse-brand-text">
                        <h3 className="pulse-title">FRIENDLY NOTEBOOK</h3>
                        <span className="pulse-subtitle">ACADEMIC SUMMARY</span>
                    </div>
                </div>
                <div className="pulse-badge">
                    <span className="pulse-dot"></span>
                    <span className="pulse-badge-text">LIVE UPDATES</span>
                </div>
            </div>

            <div className="pulse-main-content">
                <div className="pulse-rings-container">
                    <div className="nexus-ring-box">
                        <svg className="nexus-ring-svg" viewBox="0 0 100 100">
                            <circle className="ring-bg" cx="50" cy="50" r="45" />
                            <circle className="ring-progress att" cx="50" cy="50" r="45"
                                style={{ strokeDashoffset: 283 - (283 * attendance) / 100 }}
                            />
                        </svg>
                        <div className="ring-content">
                            <span className="ring-val">{attendance}%</span>
                            <span className="ring-label">ATTENDANCE</span>
                        </div>
                    </div>

                    <div className="nexus-ring-box">
                        <svg className="nexus-ring-svg" viewBox="0 0 100 100">
                            <circle className="ring-bg" cx="50" cy="50" r="45" />
                            <circle className="ring-progress perf" cx="50" cy="50" r="45"
                                style={{ strokeDashoffset: 283 - (283 * marks) / 100 }}
                            />
                        </svg>
                        <div className="ring-content">
                            <span className="ring-val">{marks}%</span>
                            <span className="ring-label">PERFORMANCE</span>
                        </div>
                    </div>
                </div>

                <div className="pulse-nodes-grid">
                    <div className="pulse-node-card streak">
                        <div className="node-icon-box"><FaFire /></div>
                        <div className="node-content">
                            <div className="node-value-box">
                                <span className="node-number">{streak}</span>
                                <span className="node-unit">Days</span>
                            </div>
                            <span className="node-desc">STREAK</span>
                        </div>
                    </div>

                    <div className="pulse-node-card ai">
                        <div className="node-icon-box"><FaRobot /></div>
                        <div className="node-content">
                            <div className="node-value-box">
                                <span className="node-number">{aiUsage}</span>
                                <span className="node-unit">%</span>
                            </div>
                            <span className="node-desc">AI USAGE</span>
                        </div>
                    </div>

                    <div className="pulse-node-card exams">
                        <div className="node-icon-box"><FaGraduationCap /></div>
                        <div className="node-content">
                            <div className="node-value-box">
                                <span className="node-number">{examsTaken}</span>
                            </div>
                            <span className="node-desc">EXAMS DONE</span>
                        </div>
                    </div>

                    <div className="pulse-node-card growth">
                        <div className="node-icon-box"><FaChartLine /></div>
                        <div className="node-content">
                            <div className="node-value-box">
                                <span className="node-number">{growth}</span>
                                <span className="node-unit">%</span>
                            </div>
                            <span className="node-desc">GROWTH</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Strip */}
            {data?.academics?.details && Object.keys(data.academics.details).length > 0 && (
                <div className="pulse-matrix-strip">
                    <div className="strip-label">SUBJECT PERFORMANCE MATRIX</div>
                    <div className="strip-grid">
                        {Object.entries(data.academics.details).slice(0, 4).map(([subject, stats]) => (
                            <div key={subject} className="strip-item">
                                <div className="strip-item-header">
                                    <span className="s-name">{subject}</span>
                                    <span className="s-val">{stats.percentage}%</span>
                                </div>
                                <div className="s-bar-container">
                                    <div className="s-bar-glow" style={{ width: `${stats.percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pulse-footer-status">
                <span><FaShieldAlt /> SYSTEM READY</span>
                <span><FaClock /> LAST UPDATED: {new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    );
};

export default AcademicPulse;
