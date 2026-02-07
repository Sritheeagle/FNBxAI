import React, { useState, useEffect } from 'react';
import { FaBrain, FaRegLightbulb, FaShieldAlt, FaBolt } from 'react-icons/fa';

/**
 * System Intelligence
 * Analytics and operational insights derived from live data.
 */
const SystemIntelligence = () => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIntelligence = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}/api/system/intelligence`);
                const data = await res.json();
                if (Array.isArray(data)) setInsights(data);
            } catch (err) {
                console.error('Intelligence Sync Failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchIntelligence();
        // Intelligence doesn't need to be as frequent as telemetry
        const interval = setInterval(fetchIntelligence, 30000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (id) => {
        switch (id) {
            case 'engagement': return <FaBrain size={20} />;
            case 'content': return <FaRegLightbulb size={20} />;
            case 'status': return <FaShieldAlt size={20} />;
            case 'activity': return <FaBolt size={20} />;
            default: return <FaBrain size={20} />;
        }
    };

    if (loading && insights.length === 0) {
        return <div className="admin-empty-state">SYNCHRONIZING NEXUS INTELLIGENCE...</div>;
    }

    return (
        <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
            {insights.map((item, idx) => (
                <div key={item.id} className="admin-summary-card sentinel-floating"
                    style={{
                        display: 'flex',
                        padding: '1.75rem',
                        gap: '1.5rem',
                        alignItems: 'flex-start',
                        borderLeft: `4px solid ${item.type === 'warning' ? '#f59e0b' : item.type === 'danger' ? '#ef4444' : '#6366f1'}`,
                        animationDelay: `${idx * 0.15}s`
                    }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{
                        background: '#f8fafc',
                        color: `${item.type === 'warning' ? '#f59e0b' : item.type === 'danger' ? '#ef4444' : '#6366f1'}`,
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        flexShrink: 0
                    }}>
                        {getIcon(item.id)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.02em' }}>{item.title}</h4>
                        <div style={{ fontSize: '1rem', fontWeight: 950, color: '#475569', marginBottom: '0.4rem' }}>{item.value}</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, fontWeight: 700 }}>{item.insight}</p>
                    </div>
                    <span className={`admin-badge ${item.type || 'primary'}`} style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.55rem', fontWeight: 950, letterSpacing: '0.1em' }}>INTEL</span>
                </div>
            ))}
        </div>
    );
};

export default SystemIntelligence;
