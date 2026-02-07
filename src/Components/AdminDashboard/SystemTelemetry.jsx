import React, { useState, useEffect } from 'react';
import { FaServer, FaDatabase, FaNetworkWired, FaMemory } from 'react-icons/fa';

/**
 * SYSTEM PERFORMANCE
 * Real-time system health and resource monitoring.
 */
const SystemTelemetry = () => {
    const [stats, setStats] = useState({
        cpu: 0,
        mem: 0,
        db: 0,
        network: 0,
        status: 'CONNECTING'
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}/api/system/stats`);
                const data = await res.json();
                if (data) setStats(data);
            } catch (err) {
                console.error('Telemetry Sync Failed:', err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="admin-stats-grid" style={{ marginBottom: '2.5rem' }}>
            {/* CPU Usage */}
            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                <div className="sentinel-scanner"></div>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', fontWeight: 950, color: '#64748b' }}>
                    <FaServer style={{ color: '#6366f1' }} /> CORE UTILIZATION
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0, fontWeight: 950, fontSize: '2.5rem' }}>{stats.cpu}%</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '36px', paddingBottom: '4px' }}>
                        {[30, 50, 40, 70, 45, 60].map((h, i) => (
                            <div key={i} style={{
                                width: '4px',
                                height: `${h}%`,
                                background: '#6366f1',
                                borderRadius: '4px',
                                opacity: 0.6 + (i * 0.08)
                            }}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Memory Usage */}
            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                <div className="sentinel-scanner"></div>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', fontWeight: 950, color: '#64748b' }}>
                    <FaMemory style={{ color: '#f59e0b' }} /> MEMORY MATRIX
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0, fontWeight: 950, fontSize: '2.5rem' }}>{stats.mem}%</div>
                    <div style={{ width: '100px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.8rem' }}>
                        <div style={{
                            width: `${stats.mem}%`,
                            height: '100%',
                            background: '#f59e0b',
                            transition: 'width 1.5s ease',
                            boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Database Latency */}
            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                <div className="sentinel-scanner"></div>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', fontWeight: 950, color: '#64748b' }}>
                    <FaDatabase style={{ color: '#10b981' }} /> ATLAS LATENCY
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0, fontWeight: 950, fontSize: '2.5rem' }}>{stats.db}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>MS</span></div>
                    <span className={`admin-badge ${stats.status === 'CONNECTED' ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem', fontWeight: 950, borderRadius: '8px', padding: '0.3rem 0.6rem' }}>
                        {stats.status}
                    </span>
                </div>
            </div>

            {/* Network Traffic */}
            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s' }}>
                <div className="sentinel-scanner"></div>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', fontWeight: 950, color: '#64748b' }}>
                    <FaNetworkWired style={{ color: '#f43f5e' }} /> SIGNAL THROUGHPUT
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0, fontWeight: 950, fontSize: '2.5rem' }}>{stats.network}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>MBPS</span></div>
                    <div style={{
                        width: '12px', height: '12px', background: '#f43f5e',
                        borderRadius: '50%', boxShadow: '0 0 15px rgba(244, 63, 94, 0.8)',
                        animation: 'pulse 1.5s infinite',
                        marginBottom: '0.8rem'
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default SystemTelemetry;
