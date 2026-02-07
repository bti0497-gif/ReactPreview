
import React, { useState, useEffect } from 'react';
import { fetchTableLogs } from '../services/dataService';
import { dbService } from '../services/dbService';
import { FileText, User, Clock, Plus, RefreshCw, ChevronRight, Search, ChevronLeft, MessageSquare } from 'lucide-react';

const BoardList = ({ menuName, onWriteNew, onViewPost }) => {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            // 로컬 DB에서 데이터 가져오기 (이미 App.jsx에서 싱크가 맞춰진 상태)
            const localPosts = dbService.getAll(menuName);

            const validPosts = [...localPosts]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setPosts(validPosts);
            setFilteredPosts(validPosts);
        } catch (err) {
            setError(`데이터 로드 실패: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [menuName]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredPosts(posts);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = posts.filter(p =>
                p.title?.toLowerCase().includes(lowerSearch) ||
                p.author?.toLowerCase().includes(lowerSearch)
            );
            setFilteredPosts(filtered);
        }
    }, [searchTerm, posts]);

    const clearSearch = () => {
        setSearchInputValue('');
        setSearchTerm('');
    };

    const handleSearch = () => {
        setSearchTerm(searchInputValue);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="board-list-container">
            {/* Header: Title & Refresh */}
            <div className="board-header">
                <div>
                    <h1 className="board-title">{menuName}</h1>
                    <p className="post-count">총 {filteredPosts.length}개의 게시글</p>
                </div>
                <button className="refresh-btn" onClick={fetchPosts} disabled={loading}>
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-section">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="제목 또는 작성자로 검색"
                        value={searchInputValue}
                        onChange={(e) => setSearchInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="search-btn-inner" onClick={handleSearch}>
                        검색
                    </button>
                </div>
            </div>

            {/* Body: List */}
            <div className="board-body">
                {loading ? (
                    <div className="status-container font-loading">
                        <RefreshCw size={32} className="spin text-blue-500" />
                        <p>데이터 동기화 중...</p>
                    </div>
                ) : error ? (
                    <div className="status-container error">
                        <p>{error}</p>
                        <button onClick={fetchPosts}>다시 시도</button>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="status-container empty">
                        <FileText size={48} className="text-slate-200" />
                        <p>{searchTerm ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}</p>
                        {searchTerm && (
                            <button className="return-list-btn" onClick={clearSearch}>
                                <RefreshCw size={14} /> 목록으로 돌아가기
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="post-list">
                        {filteredPosts.map((post) => (
                            <div key={post.id} className="post-item" onClick={() => onViewPost(post)}>
                                <div className="post-info-top">
                                    <span className="post-title-text">{post.title}</span>
                                    {post.attachments?.length > 0 && (
                                        <span className="attach-badge">+{post.attachments.length}</span>
                                    )}
                                    {post.comments?.length > 0 && (
                                        <span className="comment-badge">
                                            <MessageSquare size={11} /> {post.comments.length}
                                        </span>
                                    )}
                                </div>
                                <div className="post-info-bottom">
                                    <span className="post-meta">
                                        <User size={12} /> {post.author}
                                    </span>
                                    <span className="post-meta">
                                        <Clock size={12} /> {new Date(post.createdAt || '').toLocaleDateString('ko-KR')}
                                    </span>
                                </div>
                                <ChevronRight className="item-arrow" size={18} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer: Pagination & Write */}
            <div className="board-footer">
                <div className="pagination">
                    <button className="page-btn disabled"><ChevronLeft size={16} /></button>
                    <button className="page-btn active">1</button>
                    <button className="page-btn">2</button>
                    <button className="page-btn">3</button>
                    <button className="page-btn"><ChevronRight size={16} /></button>
                </div>
                <button className="write-btn-float" onClick={onWriteNew}>
                    <Plus size={20} />
                    <span>글쓰기</span>
                </button>
            </div>

        </div>
    );
};

export default BoardList;
