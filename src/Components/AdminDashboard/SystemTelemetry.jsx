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
                const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/system/stats`);
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
            <div className="admin-summary-card" style={{ borderLeft: '4px solid var(--admin-primary)' }}>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaServer /> CPU USAGE
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0 }}>{stats.cpu}%</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '32px' }}>
                        {[30, 50, 40, 70, 45].map((h, i) => (
                            <div key={i} style={{
                                width: '5px',
                                height: `${h}%`,
                                background: 'var(--admin-primary)',
                                borderRadius: '10px'
                            }}></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Memory Usage */}
            <div className="admin-summary-card" style={{ borderLeft: '4px solid var(--admin-warning)' }}>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaMemory /> MEMORY USAGE
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0 }}>{stats.mem}%</div>
                    <div style={{ width: '80px', height: '4px', background: 'var(--admin-border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${stats.mem}%`,
                            height: '100%',
                            background: 'var(--admin-warning)',
                            transition: 'width 1.5s ease'
                        }}></div>
                    </div>
                </div>
            </div>

            {/* Database Latency */}
            <div className="admin-summary-card" style={{ borderLeft: '4px solid var(--admin-success)' }}>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaDatabase /> DB LATENCY
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0 }}>{stats.db}ms</div>
                    <span className={`admin-badge ${stats.status === 'CONNECTED' ? 'success' : 'danger'}`} style={{ fontSize: '0.6rem' }}>
                        {stats.status}
                    </span>
                </div>
            </div>

            {/* Network Traffic */}
            <div className="admin-summary-card" style={{ borderLeft: '4px solid #f43f5e' }}>
                <div className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    <FaNetworkWired /> NETWORK TRAFFIC
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div className="value" style={{ margin: 0 }}>{stats.network}<span style={{ fontSize: '0.7rem', fontWeight: 850 }}>MBPS</span></div>
                    <div style={{
                        width: '10px', height: '10px', background: '#f43f5e',
                        borderRadius: '50%', boxShadow: '0 0 12px rgba(244, 63, 94, 0.6)',
                        animation: 'pulse 1s infinite'
                    }}></div>
                </div>
            </div>
        </div>
    );
};

export default SystemTelemetry;
