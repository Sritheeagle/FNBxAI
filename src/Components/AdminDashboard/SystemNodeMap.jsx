import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaUsers, FaChalkboardTeacher, FaFileUpload, FaServer, FaShieldAlt } from 'react-icons/fa';

/**
 * System Node Map
 * A interactive visual representation of system infrastructure and entity status.
 */
const SystemNodeMap = ({ studentsCount = 0, facultyCount = 0, materialsCount = 0, status = 'ACTIVE' }) => {
    // Define nodes
    const nodes = useMemo(() => [
        { id: 'core', label: 'SENTINEL CORE', icon: <FaServer />, x: 0, y: 0, size: 80, color: '#4f46e5' },
        { id: 'db', label: 'DATABASE', icon: <FaDatabase />, x: -120, y: -80, size: 60, color: '#10b981' },
        { id: 'students', label: `STUDENTS (${studentsCount})`, icon: <FaUsers />, x: 140, y: -60, size: 65, color: '#0ea5e9' },
        { id: 'faculty', label: `FACULTY (${facultyCount})`, icon: <FaChalkboardTeacher />, x: 120, y: 100, size: 65, color: '#8b5cf6' },
        { id: 'storage', label: `STORAGE (${materialsCount})`, icon: <FaFileUpload />, x: -140, y: 70, size: 60, color: '#f59e0b' },
        { id: 'security', label: 'SECURITY', icon: <FaShieldAlt />, x: 0, y: -160, size: 55, color: '#f43f5e' },
    ], [studentsCount, facultyCount, materialsCount]);

    // Define connections
    const connections = [
        { from: 'core', to: 'db' },
        { from: 'core', to: 'students' },
        { from: 'core', to: 'faculty' },
        { from: 'core', to: 'storage' },
        { from: 'core', to: 'security' },
        { from: 'students', to: 'db' },
        { from: 'faculty', to: 'db' },
        { from: 'storage', to: 'core' }
    ];

    return (
        <div className="node-map-container sentinel-floating" style={{
            height: '400px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '24px',
            border: '1px solid var(--admin-border)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '2rem'
        }}>
            <div className="sentinel-scanner"></div>
            {/* Grid Pattern Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(circle, var(--admin-border) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                opacity: 0.5
            }} />


            <div style={{ position: 'relative', width: '500px', height: '400px' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--admin-primary)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--admin-primary)" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    {connections.map((conn, idx) => {
                        const from = nodes.find(n => n.id === conn.from);
                        const to = nodes.find(n => n.id === conn.to);
                        if (!from || !to) return null;

                        // Center offsets
                        const fx = 250 + from.x;
                        const fy = 200 + from.y;
                        const tx = 250 + to.x;
                        const ty = 200 + to.y;

                        return (
                            <React.Fragment key={idx}>
                                <motion.line
                                    x1={fx} y1={fy} x2={tx} y2={ty}
                                    stroke="var(--admin-primary)"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    initial={{ opacity: 0, pathLength: 0 }}
                                    animate={{ opacity: 0.3, pathLength: 1 }}
                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                />
                                {/* Dynamic Data Packet */}
                                <motion.circle
                                    r="3"
                                    fill={from.color}
                                    initial={{ cx: fx, cy: fy, opacity: 0 }}
                                    animate={{
                                        cx: [fx, tx],
                                        cy: [fy, ty],
                                        opacity: [0, 1, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: Math.random() * 3
                                    }}
                                />
                            </React.Fragment>
                        );
                    })}
                </svg>

                {nodes.map((node, idx) => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 20,
                            delay: idx * 0.1
                        }}
                        className="sentinel-floating"
                        style={{
                            position: 'absolute',
                            left: `calc(50% + ${node.x}px - ${node.size / 2}px)`,
                            top: `calc(50% + ${node.y}px - ${node.size / 2}px)`,
                            width: `${node.size}px`,
                            height: `${node.size}px`,
                            borderRadius: '50%',
                            background: 'white',
                            border: `2px solid ${node.color}`,
                            boxShadow: `0 0 20px ${node.color}20`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            animationDelay: `${idx * -1.5}s`
                        }}
                        whileHover={{ scale: 1.1, boxShadow: `0 0 25px ${node.color}40` }}
                    >
                        <div style={{ color: node.color, fontSize: `${node.size * 0.35}px` }}>{node.icon}</div>
                        <div style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            color: 'var(--admin-text-muted)',
                            marginTop: '4px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                        }}>
                            {node.label}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--admin-text-muted)' }}>SYSTEM STATUS: {status}</span>
            </div>
        </div>
    );
};

export default SystemNodeMap;
