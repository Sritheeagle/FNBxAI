import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRoad, FaCode, FaLaptopCode, FaJava, FaPython, FaServer, FaCheckCircle, FaSpinner,
    FaChevronRight, FaArrowLeft, FaTrophy, FaWindows, FaGoogle, FaShieldAlt, FaGem, FaCogs,
    FaLock, FaAndroid, FaSearch, FaPalette, FaPhp, FaSwift, FaReact, FaVuejs, FaAngular, FaDocker, FaAws, FaDatabase, FaLeaf
} from 'react-icons/fa';
import api from '../../../utils/apiClient';
import './StudentRoadmaps.css';

/**
 * STUDENT ROADMAPS
 * Comprehensive learning paths (Zero to Hero) for various technologies.
 * Features:
 * - Interactive Progress Tracking (Local Storage)
 * - Visual Progress Bar
 * - Level-based filtering
 * - Category Filtering & Search
 */
const StudentRoadmaps = ({ studentData, preloadedData }) => {
    // Proactive hardening against null data
    studentData = studentData || {};
    preloadedData = preloadedData || [];
    const [roadmaps, setRoadmaps] = useState(preloadedData || []);
    const [loading, setLoading] = useState(!preloadedData);
    const [selectedRoadmap, setSelectedRoadmap] = useState(null);

    // Import styles
    // (Note: ensure you have 'import ./StudentRoadmaps.css' at top of file)

    // Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // State for tracking progress (simple local persistence)
    // State for tracking progress. Start with local storage fallback, but will sync with DB.
    const [completedTopics, setCompletedTopics] = useState(studentData?.roadmapProgress || {});

    // Fetch Roadmaps & Progress
    const fetchRoadmaps = async () => {
        setLoading(true);
        try {
            // 1. Fetch available roadmaps
            const maps = await api.apiGet('/api/roadmaps');
            if (Array.isArray(maps)) setRoadmaps(maps);

            // 2. Fetch logged-in user's progress
            const studentId = studentData?.sid || localStorage.getItem('user_id');
            if (studentId) {
                // If progress is already in studentData prop, use it. Otherwise fetch overview.
                if (studentData?.roadmapProgress) {
                    setCompletedTopics(studentData.roadmapProgress);
                } else {
                    const fullData = await api.apiGet(`/api/students/${studentId}/overview`);
                    if (fullData && fullData.roadmapProgress) {
                        setCompletedTopics(fullData.roadmapProgress);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch roadmaps or progress:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (preloadedData) {
            setRoadmaps(preloadedData);
            setLoading(false);
        } else {
            fetchRoadmaps();
        }
    }, [preloadedData]);

    const toggleTopic = async (roadmapSlug, topicName) => {
        // Optimistic Update
        const prevTopics = { ...completedTopics };
        const roadmapProgress = prevTopics[roadmapSlug] || [];
        const isCompleted = roadmapProgress.includes(topicName);

        const newProgress = isCompleted
            ? roadmapProgress.filter(t => t !== topicName)
            : [...roadmapProgress, topicName];

        const newState = { ...prevTopics, [roadmapSlug]: newProgress };
        setCompletedTopics(newState); // Create immediate UI feedback

        // Sync with Backend
        try {
            const studentId = studentData?.sid || localStorage.getItem('user_id');
            if (studentId) {
                await api.apiPost(`/api/students/${studentId}/roadmap-progress`, {
                    roadmapSlug,
                    completedTopics: newProgress
                });
            } else {
                // Fallback to local storage if no user ID (e.g. guest mode)
                localStorage.setItem('roadmap_progress', JSON.stringify(newState));
            }
        } catch (err) {
            console.error('Failed to save progress:', err);
            // Revert on failure (optional, but good practice)
            setCompletedTopics(prevTopics);
        }
    };

    // Helper to get icon component safely
    const getIcon = (iconName) => {
        if (!iconName) return <FaCode />;
        switch (iconName) {
            case 'FaPython': return <FaPython />;
            case 'FaJava': return <FaJava />;
            case 'FaServer': return <FaServer />;
            case 'FaLaptopCode': return <FaLaptopCode />;
            case 'FaRoad': return <FaRoad />;
            case 'FaWindows': return <FaWindows />;
            case 'FaGoogle': return <FaGoogle />;
            case 'FaShieldAlt': return <FaShieldAlt />;
            case 'FaGem': return <FaGem />;
            case 'FaCogs': return <FaCogs />;
            case 'FaLock': return <FaLock />;
            case 'FaAndroid': return <FaAndroid />;
            case 'FaPalette': return <FaPalette />;
            case 'FaPhp': return <FaPhp />;
            case 'FaSwift': return <FaSwift />;
            case 'FaReact': return <FaReact />;
            case 'FaVuejs': return <FaVuejs />;
            case 'FaAngular': return <FaAngular />;
            case 'FaDocker': return <FaDocker />;
            case 'FaAws': return <FaAws />;
            case 'FaDatabase': return <FaDatabase />;
            case 'FaLeaf': return <FaLeaf />;
            default: return <FaCode />;
        }
    };

    // Filter Logic
    const categories = ['All', 'Web Development', 'App Development', 'Systems', 'Mobile', 'AI & Data', 'Security', 'Design'];

    const filteredRoadmaps = roadmaps.filter(map => {
        // robust search normalization
        const query = searchQuery.toLowerCase().trim();
        const matchData = `${map.title} ${map.description} ${map.category} ${map.slug}`.toLowerCase();

        // Split query into significant terms (ignore common noise words)
        const stopWords = ['roadmap', 'roadmaps', 'road', 'map', 'maps', 'learning', 'path', 'paths', 'course', 'courses', 'tutorial', 'tutorials'];
        const terms = query.split(/\s+/).filter(t => t.length > 0 && !stopWords.includes(t));

        const matchesSearch = terms.length === 0 || terms.every(term => matchData.includes(term));

        // If searching (terms exist), ignore category filter to ensure global visibility
        const isSearching = terms.length > 0;
        const matchesCategory = isSearching || activeCategory === 'All' || map.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="nexus-loading-center">
                <FaSpinner className="spinner-icon" />
                <p>Loading Learning Paths...</p>
            </div>
        );
    }

    if (!roadmaps || roadmaps.length === 0) {
        return (
            <div className="nexus-page-container fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <FaSearch size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h3 style={{ color: '#475569' }}>No Learning Paths Found</h3>
                <p style={{ color: '#94a3b8' }}>The roadmap library is currently empty. Please initialize the database.</p>
                <button
                    onClick={fetchRoadmaps}
                    style={{
                        marginTop: '1rem', padding: '10px 20px', borderRadius: '12px',
                        background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer'
                    }}
                >
                    Retry Fetching
                </button>
            </div>
        );
    }

    // LIST VIEW
    if (!selectedRoadmap) {
        return (
            <div className="nexus-page-container fade-in">
                <header className="hub-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h2 className="nexus-page-title">LEARNING <span>ROADMAPS</span></h2>
                        <p className="nexus-page-subtitle">Select a technology stack to master from Zero to Advanced.</p>
                    </div>
                </header>

                {/* Filters & Search */}
                <div className="filters-container">
                    {/* Search Bar */}
                    <div className="search-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search technologies (e.g., Python, C++, Security)..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value) setActiveCategory('All');
                            }}
                            className="roadmap-search-input"
                        />
                    </div>

                    {/* Category Tabs */}
                    <div className="categories-scroll">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="roadmap-grid">
                    <AnimatePresence mode='popLayout'>
                        {filteredRoadmaps.map((map, i) => (
                            <motion.div
                                key={map._id || i}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setSelectedRoadmap(map)}
                                className="roadmap-card"
                            >
                                <div className="roadmap-icon-box" style={{ background: `${map.color}15`, color: map.color }}>
                                    {getIcon(map.icon)}
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <span className="roadmap-category-badge" style={{ color: map.color, background: `${map.color}10` }}>
                                        {map.category || 'Development'}
                                    </span>
                                    <h3>{map.title}</h3>
                                </div>

                                <p className="roadmap-desc">
                                    {map.description}
                                </p>

                                <div className="roadmap-meta">
                                    <span className="level-count">
                                        {map.levels?.length || 0} Levels
                                    </span>
                                    <div className="arrow-circle">
                                        <FaChevronRight size={12} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredRoadmaps.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#cbd5e1' }}>
                        <FaSearch size={48} style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.1rem' }}>No roadmaps found for "{searchQuery}"</p>
                    </div>
                )}
            </div>
        );
    }

    // DETAIL VIEW
    const mapSlug = selectedRoadmap.slug || selectedRoadmap._id;
    // Safely calculate progress
    let totalTopics = 0;
    if (selectedRoadmap.levels && Array.isArray(selectedRoadmap.levels)) {
        selectedRoadmap.levels.forEach(lvl => {
            if (lvl.topics && Array.isArray(lvl.topics)) {
                totalTopics += lvl.topics.length;
            }
        });
    }

    const completedCount = completedTopics[mapSlug]?.length || 0;
    const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

    return (
        <div className="nexus-page-container fade-in">
            {/* Header Area */}
            <header className="detail-header">
                <button
                    onClick={() => setSelectedRoadmap(null)}
                    className="back-btn"
                >
                    <FaArrowLeft />
                </button>
                <div className="header-content">
                    <div className="header-top">
                        <h2>{selectedRoadmap?.title || 'Unknown Roadmap'}</h2>
                        <span className="progress-stat" style={{ color: progressPercent === 100 ? '#10b981' : selectedRoadmap?.color }}>
                            {progressPercent}% Mastered
                        </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="progress-track">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className="progress-bar"
                            style={{ background: progressPercent === 100 ? '#10b981' : (selectedRoadmap?.color || '#4f46e5') }}
                        />
                    </div>
                </div>
            </header>

            <div className="detail-layout">
                {/* Visual / Info Card (Left Column) */}
                <div className="info-sidebar">
                    <div className="roadmap-info-card" style={{ background: selectedRoadmap?.color || '#4f46e5' }}>
                        {/* Background Decoration */}
                        <div style={{
                            position: 'absolute', top: -50, right: -50, width: 200, height: 200,
                            background: 'white', opacity: 0.1, borderRadius: '50%', filter: 'blur(40px)'
                        }} />

                        <div className="info-icon-large">
                            {getIcon(selectedRoadmap?.icon)}
                        </div>

                        <h3 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 800, lineHeight: 1.1 }}>
                            Zero to Hero
                        </h3>
                        <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: '1.6', marginBottom: '2.5rem' }}>
                            {selectedRoadmap?.description || 'Follow this path to achieve mastery.'}
                        </p>

                        <div className="info-rank-box">
                            <div style={{ background: 'white', color: selectedRoadmap?.color, padding: '10px', borderRadius: '12px' }}>
                                <FaTrophy size={20} />
                            </div>
                            <div className="rank-text">
                                <div className="rank-label">Current Rank</div>
                                <div className="rank-value">
                                    {progressPercent < 25 ? 'Novice' :
                                        progressPercent < 50 ? 'Apprentice' :
                                            progressPercent < 75 ? 'Contributor' :
                                                progressPercent < 100 ? 'Expert' : 'Master'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline Content (Right Column) */}
                <div className="timeline-column">
                    {(selectedRoadmap?.levels || []).map((level, lvlIdx) => (
                        <motion.div
                            key={lvlIdx}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: lvlIdx * 0.15 }}
                            className={`level-card ${lvlIdx < (progressPercent / 20) ? 'active' : ''}`}
                            style={{ borderLeftColor: lvlIdx < (progressPercent / 20) ? '#10b981' : undefined }}
                        >
                            {/* Connector Line (Visual only) */}
                            <div className="level-connector" />

                            {/* Level Header */}
                            <div className="level-header">
                                <div>
                                    <div className="phase-tag" style={{ color: selectedRoadmap?.color, background: `${selectedRoadmap?.color}15` }}>
                                        Phase {lvlIdx + 1}
                                    </div>
                                    <h3 className="level-title">
                                        {level?.title}
                                    </h3>
                                    <p className="level-desc">
                                        {level?.description}
                                    </p>
                                </div>
                                <span className="phase-tag" style={{ background: '#f8fafc', color: '#475569' }}>
                                    {level?.subtitle}
                                </span>
                            </div>

                            {/* Topics Grid */}
                            <div className="topics-grid">
                                {(level?.topics || []).map((topicObj, tIdx) => {
                                    const topicName = typeof topicObj === 'string' ? topicObj : topicObj.topic;
                                    const isDone = (completedTopics[mapSlug] || []).includes(topicName);

                                    return (
                                        <div
                                            key={tIdx}
                                            onClick={() => toggleTopic(mapSlug, topicName)}
                                            className={`topic-item ${isDone ? 'done' : ''}`}
                                        >
                                            <div className="topic-check" style={{ borderColor: isDone ? '#10b981' : selectedRoadmap.color }}>
                                                {isDone && <FaCheckCircle />}
                                            </div>
                                            <span className="topic-label">
                                                {topicName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            {(!level?.topics || level.topics.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                    Content for this phase is currently under development.
                                </div>
                            )}
                        </motion.div>
                    ))}

                    <div className="completion-box">
                        <div style={{
                            display: 'inline-flex', padding: '1.5rem', borderRadius: '50%',
                            background: progressPercent === 100 ? '#dcfce7' : '#f1f5f9',
                            marginBottom: '1rem', color: progressPercent === 100 ? '#10b981' : '#cbd5e1'
                        }}>
                            <FaTrophy size={40} />
                        </div>
                        <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>
                            {progressPercent === 100 ? '🎓 Roadmap Completed!' : 'Keep Pushing Forward!'}
                        </h3>
                        <p>{progressPercent}% mastered. Greatness awaits.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentRoadmaps;
