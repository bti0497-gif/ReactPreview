import { dbService } from './dbService';
import { getFiles, getFileContent } from './driveService';

const TABLE_NAME = '회원관리';

export const login = async (personId, password) => {
    try {
        // 1. 로컬 DB에서 먼저 확인 (오프라인 지원 및 속도 향상)
        const localMembers = dbService.getAll(TABLE_NAME);
        const localUser = localMembers.find(m => m.person_id === personId);

        if (localUser) {
            if (localUser.password === password) {
                const { password: _, ...safeUser } = localUser;
                sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
                return safeUser;
            } else {
                throw new Error('비밀번호가 맞지 않습니다.');
            }
        }

        // 2. 로컬에 없으면 Google Drive 확인 (기존 로직 유지 - 백업/동기화 안된 경우)
        // (주의: 오프라인이면 여기서 에러 발생 가능)
        try {
            const rootFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || import.meta.env.GOOGLE_DRIVE_FOLDER_ID;
            if (!rootFolderId) throw new Error('Root folder ID not found');

            const rootFiles = await getFiles(rootFolderId);
            const systemFolder = rootFiles.find(f => f.name === '.system' && f.mimeType === 'application/vnd.google-apps.folder');
            if (systemFolder) {
                const systemFiles = await getFiles(systemFolder.id);
                const jsonFolder = systemFiles.find(f => f.name === 'json');
                if (jsonFolder) {
                    const jsonFiles = await getFiles(jsonFolder.id);
                    const memberLogs = jsonFiles
                        .filter(f => f.name.startsWith(`${TABLE_NAME}_`))
                        .sort((a, b) => b.name.localeCompare(a.name));

                    if (memberLogs.length > 0) {
                        const members = await getFileContent(memberLogs[0].id);
                        const userById = members.find(m => m.person_id === personId);

                        if (userById && userById.password === password) {
                            // 로컬에 저장 (캐시)
                            dbService.save(TABLE_NAME, userById);

                            const { password: _, ...safeUser } = userById;
                            sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
                            return safeUser;
                        }
                    }
                }
            }
        } catch (driveError) {
            console.warn('Drive login check failed:', driveError);
            // 드라이브 체크 실패 시, 로컬에도 없었으므로 최종 실패 처리
        }

        throw new Error('존재하지 않는 아이디거나 비밀번호가 틀립니다.');

    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const logout = () => {
    sessionStorage.removeItem('currentUser');
};


export const getCurrentUser = () => {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
};
