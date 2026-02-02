import React, { useState, useEffect } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import './StudentHeader.css';

/**
 * STUDENT HEADER
 * Top bar with breadcrumbs and time, matching the Sentinel theme.
 */
const StudentHeader = ({ view }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="nexus-glass-header">
            <div className="header-left">
                <div className="breadcrumb-box">
                    <span className="bc-main">DASHBOARD</span>
                    <FaChevronRight className="bc-sep" />
                    <span className="bc-active">{view ? view.toUpperCase() : 'OVERVIEW'}</span>
                </div>
            </div>
            <div className="header-right">
                <div className="header-time-box">
                    <span className="time-val">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="date-val">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default StudentHeader;
