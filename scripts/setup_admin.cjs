
const fs = require('fs');
const path = require('path');

// 1. .env.local 파일 파싱
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const CLIENT_ID = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || env.VITE_GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN || env.VITE_GOOGLE_REFRESH_TOKEN;
const ROOT_FOLDER_ID = env.GOOGLE_DRIVE_FOLDER_ID || env.VITE_GOOGLE_DRIVE_FOLDER_ID;

async function run() {
    console.log('--- Admin Account Setup Start ---');

    // 2. Access Token 가져오기
    console.log('Refreshing Access Token...');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
        console.error('Failed to get access token:', tokenData);
        process.exit(1);
    }
    console.log('Access Token acquired.');

    // 3. .system 폴더 찾기
    console.log('Locating .system folder...');
    const qSystem = `'${ROOT_FOLDER_ID}' in parents and name = '.system' and trashed = false`;
    const systemRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qSystem)}&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const systemData = await systemRes.json();
    let systemFolderId = systemData.files?.[0]?.id;

    if (!systemFolderId) {
        console.log('.system folder not found. Creating...');
        const createSystemRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: '.system', mimeType: 'application/vnd.google-apps.folder', parents: [ROOT_FOLDER_ID] })
        });
        const newSystem = await createSystemRes.json();
        systemFolderId = newSystem.id;
    }
    console.log('.system folder ID:', systemFolderId);

    // 4. json 폴더 찾기
    console.log('Locating json folder...');
    const qJson = `'${systemFolderId}' in parents and name = 'json' and trashed = false`;
    const jsonRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qJson)}&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const jsonData = await jsonRes.json();
    let jsonFolderId = jsonData.files?.[0]?.id;

    if (!jsonFolderId) {
        console.log('json folder not found. Creating...');
        const createJsonRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'json', mimeType: 'application/vnd.google-apps.folder', parents: [systemFolderId] })
        });
        const newJson = await createJsonRes.json();
        jsonFolderId = newJson.id;
    }
    console.log('json folder ID:', jsonFolderId);

    // 5. 회원관리 JSON 데이터 생성 및 업로드
    const tableName = '회원관리';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${tableName}_${timestamp}.json`;

    const adminData = [
        {
            id: 1,
            person_id: 'admin',
            password: 'admin123!',
            name: '최고관리자',
            position: '관리자'
        }
    ];

    console.log(`Uploading ${fileName}...`);
    const metadata = { name: fileName, parents: [jsonFolderId] };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([JSON.stringify(adminData, null, 2)], { type: 'application/json' }));

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
    });
    const uploadData = await uploadRes.json();

    if (uploadData.id) {
        console.log('Success! File ID:', uploadData.id);
    } else {
        console.error('Upload failed:', uploadData);
    }
    console.log('--- Setup Complete ---');
}

run().catch(console.error);
