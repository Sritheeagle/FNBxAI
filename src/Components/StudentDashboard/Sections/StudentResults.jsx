import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaClipboardCheck, FaBook, FaAward, FaBolt } from 'react-icons/fa';
import { apiGet } from '../../../utils/apiClient';
import './StudentResults.css';

const StudentResults = ({ studentData, preloadedData }) => {
    const [resultsBySubject, setResultsBySubject] = useState(preloadedData || []);
    const [loading, setLoading] = useState(!preloadedData);
    const [overallStats, setOverallStats] = useState({ total: 0, max: 0, percentage: 0 });

    useEffect(() => {
        if (preloadedData && Array.isArray(preloadedData)) {
            setResultsBySubject(preloadedData);
            calculateStats(preloadedData);
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
            if (!studentData?.sid) return;
            try {
                setLoading(true);
                const data = await apiGet(`/api/students/${studentData.sid}/marks-by-subject`);
                if (Array.isArray(data)) {
                    setResultsBySubject(data);
                    calculateStats(data);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
                setResultsBySubject([]);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [studentData?.sid, preloadedData]);

    const calculateStats = (data) => {
        let totalScored = 0;
        let totalMax = 0;
        data.forEach(subject => {
            if (subject.overall) {
                totalScored += subject.overall.total || 0;
                totalMax += subject.overall.max || 0;
            }
        });

        setOverallStats({
            total: totalScored,
            max: totalMax,
            percentage: totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0
        });
    };

    const getGrade = (percentage) => {
        if (percentage >= 90) return { grade: 'O', color: '#10b981', label: 'Outstanding' };
        if (percentage >= 80) return { grade: 'A+', color: '#3b82f6', label: 'Excellent' };
        if (percentage >= 70) return { grade: 'A', color: '#6366f1', label: 'Very Good' };
        if (percentage >= 60) return { grade: 'B+', color: '#8b5cf6', label: 'Good' };
        if (percentage >= 50) return { grade: 'B', color: '#ec4899', label: 'Average' };
        if (percentage >= 40) return { grade: 'C', color: '#f59e0b', label: 'Pass' };
        return { grade: 'F', color: '#ef4444', label: 'Fail' };
    };

    const overallGrade = getGrade(overallStats.percentage);

    if (loading) {
        return (
            <div className="results-loading">
                <div className="neural-spinner"></div>
                <p>Decoding Academic Records...</p>
            </div>
        );
    }

    return (
        <div className="premium-results-viewport fade-in">
            <header className="results-hero">
                <div className="hero-text">
                    <div className="nexus-tag"><FaBolt /> NEURAL GRADE LEDGER</div>
                    <h1>MASTERY <span>INDEX</span></h1>
                    <p>Granular performance breakdown and academic trajectories.</p>
                </div>

                <div className="overall-summary-bento">
                    <div className="grade-display" style={{ '--accent': overallGrade.color }}>
                        <div className="g-circle">
                            <span className="g-val">{overallGrade.grade}</span>
                        </div>
                        <div className="g-txt">
                            <label>STANDING</label>
                            <span>{overallGrade.label}</span>
                        </div>
                    </div>
                    <div className="metrics-row">
                        <div className="m-block">
                            <label>TOTAL SCORE</label>
                            <span>{overallStats.total} / {overallStats.max}</span>
                        </div>
                        <div className="m-block">
                            <label>PERCENTILE</label>
                            <span>{overallStats.percentage}%</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="results-subjects-grid">
                {resultsBySubject.map((subject, idx) => {
                    const grade = getGrade(subject.overall.percentage);
                    return (
                        <motion.div
                            key={idx}
                            className="performance-divcard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <div className="card-header-v4">
                                <div className="sub-branding">
                                    <div className="sub-icon"><FaBook /></div>
                                    <div>
                                        <h3>{subject.subject}</h3>
                                        <span className="sub-code-tag">{subject.subject.substring(0, 7).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="card-grade" style={{ background: grade.color }}>
                                    {grade.grade}
                                </div>
                            </div>

                            <div className="card-marks-body">
                                {/* CLA Section */}
                                <div className="marker-section">
                                    <div className="marker-head"><FaClipboardCheck /> CLA PERFORMANCE (1-5)</div>
                                    <div className="marker-pills">
                                        {[1, 2, 3, 4, 5].map(n => {
                                            const match = subject.cla.find(c => c.test === n.toString());
                                            return (
                                                <div key={n} className={`marker-pill ${match ? 'high' : 'off'}`}>
                                                    <label>CLA{n}</label>
                                                    <span>{match ? match.scored : '-'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* MODULES Section */}
                                <div className="modules-split">
                                    <div className="marker-section">
                                        <div className="marker-head"><FaChartLine /> MODULE 1</div>
                                        <div className="marker-targets">
                                            {[1, 2, 3, 4].map(n => {
                                                const match = subject.module1.find(m => m.test === `t${n}`);
                                                return (
                                                    <div key={n} className="target-node">
                                                        <span className="t-label">T{n}</span>
                                                        <span className="t-val">{match ? match.scored : '-'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="marker-section">
                                        <div className="marker-head"><FaAward /> MODULE 2</div>
                                        <div className="marker-targets">
                                            {[1, 2, 3, 4].map(n => {
                                                const match = subject.module2.find(m => m.test === `t${n}`);
                                                return (
                                                    <div key={n} className="target-node">
                                                        <span className="t-label">T{n}</span>
                                                        <span className="t-val">{match ? match.scored : '-'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card-footer-v4">
                                <div className="f-metric">
                                    <label>AVERAGE</label>
                                    <span>{subject.overall.percentage}%</span>
                                </div>
                                <div className="f-metric text-right">
                                    <label>STATUS</label>
                                    <span className={subject.overall.percentage >= 40 ? 'pass' : 'fail'}>
                                        {subject.overall.percentage >= 40 ? 'QUALIFIED' : 'BELOW PAR'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentResults;

