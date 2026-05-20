const GITHUB_REPO = 'YairDaniel123/Otzarya-Library';
const LATEST_DL   = `https://github.com/${GITHUB_REPO}/releases/latest/download/`;

let expandedPaths = new Set();
let booted = false;

async function boot(payload) {
    if (booted) return;
    booted = true;

    // BOOKS_DATA נטען מ-books_data.js שמגיע עם החבילה
    if (typeof BOOKS_DATA === 'undefined' || !BOOKS_DATA.length) {
        hideLoading();
        showError('books_data.js לא נטען');
        return;
    }

    // הוסף כתובת הורדה לכל תיקייה (נפתחת בדפדפן — לא fetch)
    const manifest = BOOKS_DATA.map(item => ({
        ...item,
        downloadUrl: LATEST_DL + item.zip
    }));

    hideLoading();
    renderFullLibraryBtn();
    renderTree(manifest);
}

if (window.Otzaria) {
    Otzaria.on('plugin.boot', boot);
}
setTimeout(() => boot({}), 500);

// ─── עץ ────────────────────────────────────────────────────────────

function buildTree(manifest, parentPath) {
    return manifest
        .filter(item => item.parent === parentPath)
        .map(item => ({ ...item, children: buildTree(manifest, item.path) }));
}

function renderTree(manifest) {
    const roots = buildTree(manifest, '');
    const container = document.getElementById('tree');
    container.innerHTML = '';
    if (!roots.length) {
        container.innerHTML = '<div class="empty">אין נתונים להצגה</div>';
        return;
    }
    roots.forEach(node => container.appendChild(createNode(node, 0)));
}

function createNode(node, depth) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded  = expandedPaths.has(node.path);

    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingRight = (16 + depth * 24) + 'px';

    const toggle = document.createElement('span');
    toggle.className = 'toggle';
    if (hasChildren) {
        toggle.textContent = isExpanded ? '▾' : '▸';
        toggle.addEventListener('click', () => toggleNode(node.path));
    } else {
        toggle.textContent = '•';
        toggle.style.opacity = '0.25';
        toggle.style.cursor  = 'default';
    }
    row.appendChild(toggle);

    const name = document.createElement('span');
    name.className = 'node-name' + (hasChildren ? ' folder' : '');
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
    btn.onclick = () => openUrl(node.downloadUrl);
    row.appendChild(btn);

    wrapper.appendChild(row);

    if (hasChildren && isExpanded) {
        const sub = document.createElement('div');
        sub.className = 'tree-children';
        node.children.forEach(child => sub.appendChild(createNode(child, depth + 1)));
        wrapper.appendChild(sub);
    }

    return wrapper;
}

function toggleNode(path) {
    expandedPaths.has(path) ? expandedPaths.delete(path) : expandedPaths.add(path);
    // renderTree needs manifest — re-call boot pattern via re-render
    const manifest = BOOKS_DATA.map(item => ({ ...item, downloadUrl: LATEST_DL + item.zip }));
    renderTree(manifest);
}

// ─── פתיחת URL ─────────────────────────────────────────────────────

function openUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showCopied(url);
        }).catch(() => showCopied(url));
    } else {
        showCopied(url);
    }
}

function showCopied(url) {
    const el = document.getElementById('copy-toast');
    if (!el) return;
    el.querySelector('.copy-url').textContent = url;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 8000);
}

// ─── כפתור המאגר המלא ──────────────────────────────────────────────

function renderFullLibraryBtn() {
    const btn = document.getElementById('full-library-btn');
    if (!btn) return;
    btn.onclick = () => openUrl(LATEST_DL + 'full-library.zip');
    btn.style.display = 'inline-flex';
}

// ─── UI ────────────────────────────────────────────────────────────

function hideLoading() {
    const el = document.getElementById('loading');
    if (el) el.style.display = 'none';
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) { el.textContent = 'שגיאה: ' + msg; el.style.display = 'block'; }
}

// ─── ערכת נושא ─────────────────────────────────────────────────────

function applyTheme(theme) {
    if (!theme || !theme.colorScheme) return;
    const cs = theme.colorScheme, r = document.documentElement.style;
    if (cs.primary)    r.setProperty('--primary',           cs.primary);
    if (cs.onPrimary)  r.setProperty('--on-primary',        cs.onPrimary);
    if (cs.surface)    r.setProperty('--surface',           cs.surface);
    if (cs.onSurface)  r.setProperty('--on-surface',        cs.onSurface);
    if (cs.surfaceContainerHighest || cs.surfaceContainer)
                       r.setProperty('--surface-container', cs.surfaceContainerHighest || cs.surfaceContainer);
    if (cs.outline)    r.setProperty('--outline',           cs.outline);
    if (theme.typography) {
        const t = theme.typography;
        if (t.fontFamily) r.setProperty('--font-family', t.fontFamily + ', system-ui, sans-serif');
        if (t.fontSize)   r.setProperty('--font-size',   t.fontSize + 'px');
        if (t.lineHeight) r.setProperty('--line-height', t.lineHeight);
    }
}

if (window.Otzaria) {
    Otzaria.on('plugin.boot',   p => applyTheme(p.theme));
    Otzaria.on('theme.changed', t => applyTheme(t));
}
