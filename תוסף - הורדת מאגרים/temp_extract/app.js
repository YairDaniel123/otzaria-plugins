function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

const GITHUB_REPO = 'YairDaniel123/Otzarya-Library';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const MIN_NETWORK_VERSION = '0.9.92';

const FALLBACK_ASSETS = [
    { name: "משנה ברורה - PDF.zip",                                              size: "164 MB" },
    { name: "שם וגשל.zip",                                                        size: "476 MB" },
    { name: "תשובות עיון ההלכה.zip",                                              size: "179 KB" },
    { name: "אנציקלופדיה תלמודית.zip",                                            size: "20.9 MB" },
    { name: "חזו''א קובץ אגרות א- ג.zip",                                        size: "696 KB" },
    { name: "חידושי הריטבא.zip",                                                   size: "555 KB" },
    { name: "חידושים וביאורים - על השם, זרעים, או''ח ומועד, טהרות.zip",          size: "10.4 MB" },
    { name: "ספרים - ריבית.zip",                                                   size: "248 KB" },
    { name: "ספרים שאינם מותאמים לאוצריא.zip",                                    size: "83.1 MB" },
    { name: "שונה הלכות.zip",                                                      size: "748 KB" }
];

let allAssets = [];

Otzaria.on('plugin.boot', async (payload) => {
    const container = document.getElementById('assets-list');
    const appVersion = payload?.appVersion || '0.0.0';
    const hasNetwork = compareVersions(appVersion, MIN_NETWORK_VERSION) >= 0;

    if (!hasNetwork) {
        showNotice(
            `התוסף יעבוד במלואו החל מגרסה ${MIN_NETWORK_VERSION} המאפשרת גישה לאינטרנט. ` +
            `כעת מוצגת רשימת הספרים האחרונה הידועה.`
        );
        allAssets = FALLBACK_ASSETS;
        render(allAssets, container);
        return;
    }

    try {
        const res = await fetch(API_URL, {
            headers: { 'Accept': 'application/vnd.github+json' }
        });
        if (!res.ok) throw new Error('status ' + res.status);

        const release = await res.json();
        allAssets = release.assets
            .filter(a => a.name.endsWith('.zip'))
            .map(a => ({
                name: a.name,
                size: formatSize(a.size),
                downloadUrl: a.browser_download_url
            }));

        render(allAssets, container);

    } catch (err) {
        showNotice('לא ניתן להתחבר ל-GitHub. מוצגת רשימת הספרים האחרונה הידועה.');
        allAssets = FALLBACK_ASSETS;
        render(allAssets, container);
    }
});

function render(assets, container) {
    container.innerHTML = '';
    assets.forEach(asset => {
        const displayName = asset.name.replace('.zip', '');
        const card = document.createElement('div');
        card.className = 'card';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'card-title';
        titleDiv.textContent = displayName;
        card.appendChild(titleDiv);
        if (asset.size) {
            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'card-size';
            sizeDiv.textContent = asset.size;
            card.appendChild(sizeDiv);
        }
        const btn = document.createElement('button');
        btn.textContent = 'הורד את הספר';
        btn.addEventListener('click', function() { install(asset.downloadUrl || '', asset.name, btn); });
        card.appendChild(btn);
        container.appendChild(card);
    });
}

function install(url, name, btn) {
    if (!url) {
        Otzaria.call('ui.showSuccess', { message: `הורדה ישירה תתאפשר מגרסה ${MIN_NETWORK_VERSION}` });
        return;
    }
    btn.disabled = true;
    btn.textContent = 'מוריד...';
    window.open(url, '_blank');
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'הורד את הספר';
    }, 1500);
}

function showNotice(msg) {
    const el = document.getElementById('version-notice');
    el.textContent = msg;
    el.classList.add('visible');
}

function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
}

function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) > (pb[i] || 0)) return 1;
        if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
}
