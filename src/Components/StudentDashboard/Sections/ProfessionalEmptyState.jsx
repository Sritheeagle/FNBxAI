import React from 'react';
import { motion } from 'framer-motion';
import { FaInbox, FaCube, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

/**
 * Professional Empty State Component
 * @param {Object} props
 * @param {string} props.title - Main title
 * @param {string} props.description - Subtext description
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {string} props.theme - 'info', 'success', 'warning', 'sentinel'
 */
const ProfessionalEmptyState = ({
    title = "NO DATA DETECTED",
    description = "The neural pipeline is currently clear. No active records found in this sector.",
    icon = <FaCube />,
    theme = 'sentinel'
}) => {
    const getThemeColor = () => {
        switch (theme) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return '#6366f1'; // Sentinel indigo
        }
    };

    const color = getThemeColor();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pro-empty-state"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '32px',
                border: `1px dashed ${color}30`,
                marginTop: '1rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Decorative Rings */}
            <div style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: `1px solid ${color}05`,
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: `1px solid ${color}10`,
                zIndex: 0
            }}></div>

            <motion.div
                animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                style={{
                    fontSize: '4rem',
                    color: color,
                    marginBottom: '1.5rem',
                    filter: `drop-shadow(0 0 20px ${color}40)`,
                    zIndex: 1
                }}
            >
                {icon}
            </motion.div>

            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 950,
                color: '#1e293b',
                margin: '0 0 0.5rem',
                letterSpacing: '0.05em',
                zIndex: 1
            }}>
                {title.toUpperCase()}
            </h3>

            <p style={{
                fontSize: '0.85rem',
                fontWeight: 850,
                color: '#64748b',
                maxWidth: '320px',
                lineHeight: '1.6',
                margin: 0,
                zIndex: 1
            }}>
                {description}
            </p>

            <div style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                zIndex: 1
            }}>
                <div style={{
                    padding: '0.3rem 0.8rem',
                    background: `${color}10`,
                    color: color,
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 950,
                    letterSpacing: '1px'
                }}>
                    SYSTEM STABLE
                </div>
            </div>
        </motion.div>
    );
};

export default ProfessionalEmptyState;
