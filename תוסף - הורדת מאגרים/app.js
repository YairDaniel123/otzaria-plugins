const GITHUB_REPO = 'YairDaniel123/Otzarya-Library';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const MIN_NETWORK_VERSION = '0.9.92';

let manifest = [];
let expandedPaths = new Set();
let fullLibraryUrl = null;

Otzaria.on('plugin.boot', async (payload) => {
    const appVersion = payload?.appVersion || '0.0.0';
    const hasNetwork = compareVersions(appVersion, MIN_NETWORK_VERSION) >= 0;

    if (!hasNetwork) {
        showNotice(`התוסף יעבוד במלואו החל מגרסה ${MIN_NETWORK_VERSION}.`);
        hideLoading();
        return;
    }

    try {
        const releaseRes = await fetch(API_URL, {
            headers: { 'Accept': 'application/vnd.github+json' }
        });
        if (!releaseRes.ok) throw new Error('GitHub API: ' + releaseRes.status);
        const release = await releaseRes.json();

        const urlMap = {};
        release.assets.forEach(a => { urlMap[a.name] = a.browser_download_url; });

        fullLibraryUrl = urlMap['full-library.zip'] || null;

        if (!urlMap['manifest.json']) throw new Error('manifest.json לא נמצא ב-Release');
        const manifestRes = await fetch(urlMap['manifest.json']);
        if (!manifestRes.ok) throw new Error('שגיאה בטעינת manifest');
        manifest = await manifestRes.json();

        manifest.forEach(item => { item.downloadUrl = urlMap[item.zip] || null; });

        hideLoading();
        renderFullLibraryBtn();
        renderTree();

    } catch (err) {
        hideLoading();
        showNotice('שגיאה בטעינה: ' + err.message);
    }
});

function buildTree(parentPath) {
    return manifest
        .filter(item => item.parent === parentPath)
        .map(item => ({ ...item, children: buildTree(item.path) }));
}

function renderFullLibraryBtn() {
    const btn = document.getElementById('full-library-btn');
    if (!btn) return;
    if (fullLibraryUrl) {
        btn.addEventListener('click', () => window.open(fullLibraryUrl, '_blank'));
        btn.style.display = 'inline-flex';
    }
}

function renderTree() {
    const roots = buildTree('');
    const container = document.getElementById('tree');
    container.innerHTML = '';
    if (roots.length === 0) {
        container.innerHTML = '<div class="empty">אין נתונים להצגה</div>';
        return;
    }
    roots.forEach(node => container.appendChild(createNode(node, 0)));
}

function createNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);

    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingRight = (16 + depth * 28) + 'px';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    if (hasChildren) {
        toggle.textContent = isExpanded ? '▼' : '▶';
        toggle.addEventListener('click', () => toggleNode(node.path));
    } else {
        toggle.textContent = '•';
        toggle.style.cursor = 'default';
        toggle.style.opacity = '0.3';
    }
    row.appendChild(toggle);

    const name = document.createElement('span');
    name.className = 'node-name' + (hasChildren ? ' clickable' : '');
    name.textContent = node.name;
    if (hasChildren) name.addEventListener('click', () => toggleNode(node.path));
    row.appendChild(name);

    if (node.size) {
        const size = document.createElement('span');
        size.className = 'node-size';
        size.textContent = node.size;
        row.appendChild(size);
    }

    const btn = document.createElement('button');
    btn.className = 'dl-btn';
    btn.textContent = 'הורד';
    if (node.downloadUrl) {
        btn.addEventListener('click', () => window.open(node.downloadUrl, '_blank'));
    } else {
        btn.disabled = true;
    }
    row.appendChild(btn);

    wrapper.appendChild(row);

    if (hasChildren && isExpanded) {
        const childContainer = document.createElement('div');
        childContainer.className = 'tree-children';
        node.children.forEach(child => childContainer.appendChild(createNode(child, depth + 1)));
        wrapper.appendChild(childContainer);
    }

    return wrapper;
}

function toggleNode(path) {
    if (expandedPaths.has(path)) {
        expandedPaths.delete(path);
    } else {
        expandedPaths.add(path);
    }
    renderTree();
}

function hideLoading() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
}

function showNotice(msg) {
    const el = document.getElementById('version-notice');
    el.textContent = msg;
    el.classList.add('visible');
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
