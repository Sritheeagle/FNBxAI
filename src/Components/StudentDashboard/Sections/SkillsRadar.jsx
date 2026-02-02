import React from 'react';
import './SkillsRadar.css';

const SkillsRadar = ({ studentData }) => {
    // Dynamically derive skills from student performance data if available
    const stats = studentData?.stats || {};

    const skills = [
        { name: 'Algorithms', value: stats.algorithms || 85 },
        { name: 'Sys Design', value: stats.systemDesign || 70 },
        { name: 'AI/ML', value: stats.ai || 90 },
        { name: 'Web Dev', value: stats.webDev || 75 },
        { name: 'Soft Skills', value: stats.communication || 65 },
        { name: 'Cloud', value: stats.cloud || 80 }
    ];

    const numPoints = skills.length;
    const radius = 100;
    const centerX = 150;
    const centerY = 150;
    const angleStep = (Math.PI * 2) / numPoints;

    const getCoordinates = (value, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const r = (value / 100) * radius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        return [x, y];
    };

    const points = skills.map((s, i) => getCoordinates(s.value, i).join(',')).join(' ');

    return (
        <div className="radar-card animate-fade-in">
            <div className="radar-header">
                <h3><span style={{ color: '#4f46e5' }}>COMPETENCY</span> MATRIX</h3>
                <span className="pro-badge">PROFESSIONAL</span>
            </div>

            <div className="radar-body" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 300 300" style={{ maxWidth: '250px', maxHeight: '250px' }}>
                    {/* Background Grid */}
                    {[20, 40, 60, 80, 100].map((level, j) => {
                        const gridPoints = skills.map((_, i) => {
                            const angle = i * angleStep - Math.PI / 2;
                            const r = (level / 100) * radius;
                            return `${centerX + Math.cos(angle) * r},${centerY + Math.sin(angle) * r}`;
                        }).join(' ');
                        return (
                            <polygon
                                key={j}
                                points={gridPoints}
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Axes */}
                    {skills.map((s, i) => {
                        const [x, y] = getCoordinates(100, i);
                        return <line key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                    })}

                    {/* Data Polygon */}
                    <polygon
                        points={points}
                        fill="rgba(79, 70, 229, 0.2)"
                        stroke="#4f46e5"
                        strokeWidth="2"
                    />

                    {/* Points */}
                    {skills.map((s, i) => {
                        const [x, y] = getCoordinates(s.value, i);
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill="#4f46e5" className="radar-point">
                                <title>{s.name}: {s.value}%</title>
                            </circle>
                        );
                    })}

                    {/* Labels */}
                    {skills.map((s, i) => {
                        // Calculate label position (slightly outside radius)
                        const angle = i * angleStep - Math.PI / 2;
                        const labelR = radius + 25;
                        const x = centerX + Math.cos(angle) * labelR;
                        const y = centerY + Math.sin(angle) * labelR;

                        return (
                            <foreignObject key={i} x={x - 40} y={y - 10} width="80" height="20">
                                <div className="radar-label" style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}>
                                    {s.name}
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>
            </div>

            <div className="radar-footer">
                <div className="skill-stat">
                    <span className="val">Top 5%</span>
                    <span className="lbl">CLASS RANK</span>
                </div>
                <div className="skill-stat">
                    <span className="val">A+</span>
                    <span className="lbl">READINESS</span>
                </div>
            </div>
        </div>
    );
};

export default SkillsRadar;
