
import { getFiles, getFileContent } from './driveService';
import { dbService } from './dbService';
import { fetchTableLogs, getSystemFolderIds } from './dataService';

/**
 * 중앙 동기화 프로시저 (Sync Procedure)
 * 구글 드라이브의 ACTION 로그를 읽어 로컬 DB를 최신화합니다.
 */
export const syncAllData = async () => {
    try {
        const lastSync = dbService.getLastSync();
        const isFirstSync = lastSync === '1970-01-01T00:00:00Z';
        const { jsonFolderId } = getSystemFolderIds();

        if (!jsonFolderId) {
            console.warn('Sync skipped: Storage not initialized.');
            return;
        }

        console.log(`Starting sync (FirstSync: ${isFirstSync}, LastSync: ${lastSync})`);

        // 1. 전체 파일 목록 가져오기
        const allFiles = await fetchTableLogs('');

        // 2. 부트스트랩 (첫 동기화) 처리
        if (isFirstSync) {
            console.log('Performing initial bootstrap sync...');

            // 파일명에서 테이블 이름 추출 (예: "전체게시판_..." -> "전체게시판")
            const tableNames = new Set();
            allFiles.forEach(f => {
                if (!f.name.startsWith('ACTION_')) {
                    const parts = f.name.split('_');
                    if (parts.length > 1) tableNames.add(parts[0]);
                }
            });

            for (const tableName of tableNames) {
                console.log(`Bootstrapping table: ${tableName}`);
                const tableLogs = allFiles.filter(f => f.name.startsWith(`${tableName}_`));

                if (tableName === '회원관리') {
                    const latest = tableLogs.sort((a, b) => b.name.localeCompare(a.name))[0];
                    if (latest) {
                        const content = await getFileContent(latest.id);
                        dbService.setTable(tableName, content);
                    }
                } else {
                    // 게시판 데이터들은 모두 병합
                    for (const file of tableLogs) {
                        const post = await getFileContent(file.id);
                        post.fileId = file.id;
                        dbService.save(tableName, post);
                    }
                }
            }
        }

        // 3. ACTION 로그 기반 증분 동기화
        const actionLogs = allFiles
            .filter(f => f.name.startsWith('ACTION_'))
            .filter(f => new Date(f.modifiedTime) > new Date(lastSync))
            .sort((a, b) => a.modifiedTime.localeCompare(b.modifiedTime));

        if (actionLogs.length > 0) {
            console.log(`Processing ${actionLogs.length} incremental actions...`);
            const tablesToUpdate = new Set();

            for (const logFile of actionLogs) {
                try {
                    const action = await getFileContent(logFile.id);
                    const { op, tableName, id } = action;

                    if (op === 'DELETE') {
                        dbService.remove(tableName, id);
                    } else {
                        tablesToUpdate.add(tableName);
                    }
                } catch (e) {
                    console.error(`Failed to process action log ${logFile.name}:`, e);
                }
            }

            // 변경된 테이블 최신화
            for (const tableName of tablesToUpdate) {
                const logs = await fetchTableLogs(tableName);
                if (tableName === '회원관리') {
                    const latest = logs.sort((a, b) => b.name.localeCompare(a.name))[0];
                    if (latest) {
                        const content = await getFileContent(latest.id);
                        dbService.setTable(tableName, content);
                    }
                } else {
                    // CRITICAL FIX: Load ALL files for this table to ensure complete state
                    // This prevents data loss when records are updated between syncs
                    // Clear existing data first to avoid duplicates
                    dbService.setTable(tableName, []);

                    // Load all files and merge by ID (latest wins)
                    const dataMap = new Map();
                    for (const file of logs) {
                        const record = await getFileContent(file.id);
                        record.fileId = file.id;
                        // Use the record's ID as the key, keeping the latest version
                        dataMap.set(record.id, record);
                    }

                    // Save all records to DB
                    for (const record of dataMap.values()) {
                        dbService.save(tableName, record);
                    }
                }
            }
        }

        // 4. 마지막 동기화 시각 업데이트
        dbService.setLastSync(new Date().toISOString());
        console.log('Sync completed successfully.');
    } catch (err) {
        console.error('Sync failed:', err);
        throw err;
    }
};

/**
 * 특정 메뉴(테이블) 진입 시 실행되는 빠른 동기화
 * (App.jsx의 onMenuSelect 등에서 호출)
 */
export const syncMenuData = async (activeMenu) => {
    // 특정 테이블만 동기화하더라도 전체 ACTION 로그를 체크하는 것이 안전함
    // 하지만 우선은 전체 싱크 프로시저를 호출하는 것으로 구현
    await syncAllData();
};
