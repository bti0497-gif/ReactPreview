import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { getCurrentUser } from '../services/authService';
import { Calendar, Briefcase, CheckSquare } from 'lucide-react';

const RightSidebar = ({ onMenuSelect, setSelectedProject, setSelectedDate, activeMenu, isSyncing, lastDataUpdate }) => {
    const [activeProjects, setActiveProjects] = useState([]);
    const [activeProcesses, setActiveProcesses] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, [activeMenu, isSyncing, lastDataUpdate]);

    const loadDashboardData = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Load active projects
        const allProjects = dbService.getAll('프로젝트관리');
        const active = allProjects.filter(project => {
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);
            return today >= start && today <= end;
        }).slice(0, 5);
        setActiveProjects(active);

        // Load active processes
        const allProcesses = dbService.getAll('공정관리');
        const activeProc = allProcesses.filter(process => {
            const start = new Date(process.startDate);
            const end = new Date(process.endDate);
            return today >= start && today <= end;
        }).slice(0, 5);
        setActiveProcesses(activeProc);

        // Load upcoming tasks
        const user = getCurrentUser();
        const allTasks = dbService.getAll('할일관리');
        const upcoming = allTasks
            .filter(task => {
                const taskDate = new Date(task.date);
                taskDate.setHours(0, 0, 0, 0);
                if (taskDate < today) return false;
                // Show public tasks + user's private tasks
                if (task.isPublic) return true;
                return task.authorId === user?.person_id;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
        setUpcomingTasks(upcoming);
    };

    const handleProjectClick = (project) => {
        setSelectedProject?.(project);
        onMenuSelect('프로젝트관리');
    };

    const handleProcessClick = (process) => {
        onMenuSelect('공정관리');
    };

    const handleTaskClick = (task) => {
        const taskDate = new Date(task.date);
        setSelectedDate?.(taskDate);
        onMenuSelect('할일관리');
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const formatDateRange = (start, end) => {
        return `${formatDate(start)} ~ ${formatDate(end)}`;
    };

    return (
        <aside className="sidebar-right">
            {/* Active Projects */}
            <div className="dashboard-section">
                <div className="section-header-dash">
                    <Briefcase size={14} />
                    <span>진행 중인 프로젝트</span>
                    {activeProjects.length > 0 && <span className="count-badge">{activeProjects.length}</span>}
                </div>
                <div className="section-list">
                    {activeProjects.length === 0 ? (
                        <div className="empty-state-text">진행 중인 프로젝트가 없습니다</div>
                    ) : (
                        <ul className="dash-list">
                            {activeProjects.map(project => (
                                <li
                                    key={project.id}
                                    className="dash-list-item"
                                    onClick={() => handleProjectClick(project)}
                                >
                                    <span className="dash-item-text">{project.title}</span>
                                    <span className="dash-item-date">{formatDateRange(project.startDate, project.endDate)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Active Processes */}
            <div className="dashboard-section">
                <div className="section-header-dash">
                    <Calendar size={14} />
                    <span>진행 중인 공정</span>
                    {activeProcesses.length > 0 && <span className="count-badge">{activeProcesses.length}</span>}
                </div>
                <div className="section-list">
                    {activeProcesses.length === 0 ? (
                        <div className="empty-state-text">진행 중인 공정이 없습니다</div>
                    ) : (
                        <ul className="dash-list">
                            {activeProcesses.map(process => (
                                <li
                                    key={process.id}
                                    className="dash-list-item"
                                    onClick={() => handleProcessClick(process)}
                                >
                                    <span className="dash-item-text">{process.title}</span>
                                    <span className="dash-item-date">{formatDateRange(process.startDate, process.endDate)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="dashboard-section">
                <div className="section-header-dash">
                    <CheckSquare size={14} />
                    <span>예정된 할일</span>
                    {upcomingTasks.length > 0 && <span className="count-badge">{upcomingTasks.length}</span>}
                </div>
                <div className="section-list">
                    {upcomingTasks.length === 0 ? (
                        <div className="empty-state-text">예정된 할일이 없습니다</div>
                    ) : (
                        <ul className="dash-list">
                            {upcomingTasks.map(task => (
                                <li
                                    key={task.id}
                                    className="dash-list-item"
                                    onClick={() => handleTaskClick(task)}
                                >
                                    <span className="dash-item-text">{task.content || '(내용 없음)'}</span>
                                    <span className="dash-item-date">
                                        {formatDate(task.date)}
                                        {!task.isPublic && <span className="private-badge">🔒</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
