import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Calendar, Image } from 'lucide-react';

const Dashboard = () => {
    const [activeProjects, setActiveProjects] = useState([]);

    useEffect(() => {
        loadActiveProjects();
    }, []);

    const loadActiveProjects = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const allProjects = dbService.getAll('프로젝트관리');
        const active = allProjects.filter(project => {
            const start = new Date(project.startDate);
            const end = new Date(project.endDate);
            return today >= start && today <= end;
        });

        setActiveProjects(active);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const getDaysRemaining = (endDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="dashboard-container">
            {/* Active Projects Card */}
            <div className="dashboard-card projects-card">
                <div className="card-header">
                    <Calendar size={24} className="header-icon" />
                    <h2>진행 중인 프로젝트</h2>
                    <span className="project-count">{activeProjects.length}</span>
                </div>

                <div className="card-content">
                    {activeProjects.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} className="empty-icon" />
                            <p className="empty-title">진행 중인 프로젝트가 없습니다</p>
                            <p className="empty-subtitle">프로젝트 관리 메뉴에서 새 프로젝트를 추가해 보세요</p>
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {activeProjects.map(project => {
                                const daysLeft = getDaysRemaining(project.endDate);
                                const isUrgent = daysLeft <= 7;

                                return (
                                    <div key={project.id} className="project-item">
                                        <div className="project-header">
                                            <h3 className="project-title">{project.title}</h3>
                                            {isUrgent && (
                                                <span className="urgent-badge">마감임박</span>
                                            )}
                                        </div>
                                        <div className="project-meta">
                                            <div className="meta-row">
                                                <span className="meta-label">기간</span>
                                                <span className="meta-value">
                                                    {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
                                                </span>
                                            </div>
                                            <div className="meta-row">
                                                <span className="meta-label">남은 기간</span>
                                                <span className={`meta-value ${isUrgent ? 'urgent' : ''}`}>
                                                    {daysLeft > 0 ? `${daysLeft}일` : '오늘 마감'}
                                                </span>
                                            </div>
                                            {project.completionPercentage !== undefined && (
                                                <div className="meta-row">
                                                    <span className="meta-label">진행률</span>
                                                    <div className="progress-container">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{ width: `${project.completionPercentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="progress-text">{project.completionPercentage}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Gallery Placeholder */}
            <div className="dashboard-card gallery-card">
                <div className="card-header">
                    <Image size={24} className="header-icon" />
                    <h2>사진 갤러리</h2>
                </div>

                <div className="card-content">
                    <div className="empty-state">
                        <Image size={48} className="empty-icon" />
                        <p className="empty-title">갤러리가 준비중입니다</p>
                        <p className="empty-subtitle">곧 사진 갤러리 기능이 추가될 예정입니다</p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .dashboard-container {
                    max-width: 650px;
                    width: 100%;
                    margin: 0 auto;
                    padding: 40px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    box-sizing: border-box;
                }

                .dashboard-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 24px 28px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }

                .header-icon {
                    flex-shrink: 0;
                }

                .card-header h2 {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0;
                    flex: 1;
                }

                .project-count {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .card-content {
                    padding: 28px;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                }

                .empty-icon {
                    color: #cbd5e1;
                    margin-bottom: 16px;
                }

                .empty-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #334155;
                    margin: 0 0 8px 0;
                }

                .empty-subtitle {
                    font-size: 14px;
                    color: #64748b;
                    margin: 0;
                }

                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                }

                .project-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.2s;
                }

                .project-item:hover {
                    border-color: #667eea;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
                }

                .project-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .project-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                    flex: 1;
                }

                .urgent-badge {
                    background: #ef4444;
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 6px;
                    white-space: nowrap;
                }

                .project-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .meta-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .meta-label {
                    font-size: 13px;
                    color: #64748b;
                    font-weight: 500;
                }

                .meta-value {
                    font-size: 13px;
                    color: #334155;
                    font-weight: 600;
                }

                .meta-value.urgent {
                    color: #ef4444;
                }

                .progress-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .progress-bar {
                    flex: 1;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    border-radius: 4px;
                    transition: width 0.3s ease;
                }

                .progress-text {
                    font-size: 13px;
                    color: #334155;
                    font-weight: 600;
                    min-width: 40px;
                    text-align: right;
                }

                .gallery-card .card-header {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
