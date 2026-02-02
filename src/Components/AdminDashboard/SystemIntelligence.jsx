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
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/system/intelligence`);
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
                <div key={item.id} className="admin-summary-card animate-slide-up"
                    style={{
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'flex-start',
                        borderLeft: `4px solid var(--admin-${item.type || 'primary'})`,
                        animationDelay: `${idx * 0.1}s`
                    }}>
                    <div className="summary-icon-box" style={{
                        background: `var(--admin-bg-soft)`,
                        color: `var(--admin-${item.type || 'primary'})`,
                        width: '48px',
                        height: '48px',
                        flexShrink: 0
                    }}>
                        {getIcon(item.id)}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 950, color: 'var(--admin-secondary)' }}>{item.title}</h4>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--admin-text-main)', marginBottom: '0.2rem' }}>{item.value}</div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--admin-text-muted)', lineHeight: 1.6, fontWeight: 750 }}>{item.insight}</p>
                    </div>
                    <span className={`admin-badge ${item.type || 'primary'}`} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '0.55rem' }}>INSIGHT</span>
                </div>
            ))}
        </div>
    );
};

export default SystemIntelligence;
