// ====== Codex Jinx — Cyber Playbook Workspace ======
// Structure persisted to localStorage:
// { id, type:'folder'|'file', name, children?, content?, title?, tags?, urls?:string[] }
document.addEventListener('DOMContentLoaded', function() {
  const STORAGE_KEY = 'codexJinxWorkspace';
  const ACTIVE_KEY  = 'codexJinxActiveId';

  // DOM
  const treeEl = document.getElementById('tree');
  const editorEl = document.getElementById('editor');
  const pathEl = document.getElementById('currentPath');
  const statusEl = document.getElementById('status');
  const titleInput = document.getElementById('titleInput');
  const tagsInput = document.getElementById('tagsInput');
  const urlInput = document.getElementById('urlInput');
  const urlList = document.getElementById('urlList');

  // Buttons & inputs
  const newFolderBtn = document.getElementById('newFolderBtn');
  const newFileBtn = document.getElementById('newFileBtn');
  const fileInput = document.getElementById('fileInput');
  const importWorkspaceInput = document.getElementById('importWorkspaceInput');
  const exportWorkspaceBtn = document.getElementById('exportWorkspaceBtn');
  const renameBtn = document.getElementById('renameBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const saveBtn = document.getElementById('saveBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const searchInput = document.getElementById('searchInput');
  const sidebar = document.getElementById('sidebar');

  // Workspace state
  let workspace = loadWorkspace() || createDefaultWorkspace();
  let activeId = localStorage.getItem(ACTIVE_KEY) || null;

  // ===== Utilities =====
  function uid(){ return 'id_' + Math.random().toString(36).slice(2,10) }
  function now(){ return new Date().toLocaleString() }
  function saveWorkspace(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    setStatus('Saved workspace');
  }
  function loadWorkspace(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ console.warn(e); return null; }
  }
  function createDefaultWorkspace(){
    return {
      id: uid(),
      type: 'folder',
      name: 'Playbook',
      children: [
        { id: uid(), type: 'folder', name: 'Recon', children: [] },
        { id: uid(), type: 'folder', name: 'Exploitation', children: [] },
        { id: uid(), type: 'file', name: 'README.md', title: 'Codex Jinx', tags: 'intro,playbook',
          content: `# Codex Jinx — Cyber Playbook

Welcome! Start building your playbook.

## Suggested Sections
- Recon
- Enumeration
- Exploitation
- PrivEsc
- Post-Ex
- Notes & Findings

> Tip: Use the toolbar for quick snippets. Add URLs below.

`
        }
      ]
    };
  }
  function findById(node, id){
    if(!node) return null;
    if(node.id === id) return node;
    if(node.type === 'folder'){
      for(const child of node.children){
        const found = findById(child, id);
        if(found) return found;
      }
    }
    return null;
  }
  function findParent(root, targetId, parent=null){
    if(root.id === targetId) return parent;
    if(root.type === 'folder'){
      for(const c of root.children){
        const res = findParent(c, targetId, root);
        if(res) return res;
      }
    }
    return null;
  }
  function pathOf(id){
    const parts = [];
    function dfs(node, trail){
      const t = [...trail, node.name];
      if(node.id === id){ parts.push(t); return true; }
      if(node.type === 'folder'){
        for(const c of node.children){
          if(dfs(c, t)) return true;
        }
      }
      return false;
    }
    dfs(workspace, []);
    const p = parts[0] || [workspace.name];
    return '/' + p.join('/');
  }
  function setStatus(msg){ if(statusEl) statusEl.textContent = msg + ' • ' + now(); }

  // ===== Tree rendering =====
  function renderTree(filter=''){
    if(!treeEl) return;
    treeEl.innerHTML = '';
    function renderNode(node, ul){
      const li = document.createElement('li');
      li.dataset.id = node.id;
      li.className = (node.id === activeId) ? 'active' : '';
      const label = document.createElement('div');
      label.className = 'node-label';
      label.textContent = node.name;

      const type = document.createElement('div');
      type.className = 'node-type';
      type.textContent = node.type === 'folder' ? '📁' : '📄';

      const actions = document.createElement('div');
      actions.className = 'node-actions';
      if(node.type==='folder'){
        const addBtn = document.createElement('button');
        addBtn.textContent = '+';
        addBtn.title = 'Add new file here';
        addBtn.onclick = (e)=>{ e.stopPropagation(); createFile(node.id) };
        actions.appendChild(addBtn);
      }

      li.appendChild(type);
      li.appendChild(label);
      li.appendChild(actions);

      li.onclick = ()=>{
        activeId = node.id;
        localStorage.setItem(ACTIVE_KEY, activeId);
        openNode(node.id);
        renderTree(searchInput && searchInput.value ? searchInput.value.trim() : '');
      };

      if(!filter || node.name.toLowerCase().includes(filter)){
        ul.appendChild(li);
      }

      if(node.type==='folder' && node.children?.length){
        const sub = document.createElement('ul');
        sub.style.listStyle='none';
        sub.style.margin='0 0 0 16px';
        sub.style.padding='0';
        for(const c of node.children){
          renderNode(c, sub);
        }
        ul.appendChild(sub);
      }
    }
    renderNode(workspace, treeEl);
  }

  // ===== Node operations =====
  function createFolder(parentId){
    const parent = findById(workspace, parentId) || workspace;
    if(parent.type !== 'folder') return;
    parent.children.push({ id: uid(), type: 'folder', name: 'New Folder', children: [] });
    saveWorkspace(); renderTree(searchInput && searchInput.value ? searchInput.value.trim() : '');
  }
  function createFile(parentId){
    const parent = findById(workspace, parentId) || workspace;
    if(parent.type !== 'folder') return;
    const file = { id: uid(), type:'file', name:'untitled.txt', title:'', tags:'', content:'', urls:[] };
    parent.children.push(file);
    activeId = file.id;
    localStorage.setItem(ACTIVE_KEY, activeId);
    saveWorkspace(); renderTree(searchInput && searchInput.value ? searchInput.value.trim() : ''); openNode(file.id);
  }
  function renameNode(id){
    const node = findById(workspace, id);
    if(!node) return;
    const name = prompt('Rename to:', node.name);
    if(!name) return;
    node.name = name.trim();
    saveWorkspace(); renderTree(searchInput && searchInput.value ? searchInput.value.trim() : ''); if(id===activeId) refreshEditor(node);
  }
  function deleteNode(id){
    if(workspace.id === id) return alert('Cannot delete root');
    const parent = findParent(workspace, id);
    if(!parent) return;
    if(!confirm('Delete this item?')) return;
    parent.children = parent.children.filter(c=>c.id!==id);
    if(activeId === id){ activeId = null; localStorage.removeItem(ACTIVE_KEY); clearEditor(); }
    saveWorkspace(); renderTree(searchInput && searchInput.value ? searchInput.value.trim() : '');
  }

  // ===== Editor handling =====
  function openNode(id){
    const node = findById(workspace, id);
    if(!node) return;
    if(node.type === 'folder'){
      if(pathEl) pathEl.textContent = pathOf(node.id) + ' (folder)';
      clearEditor(true);
      return;
    }
    refreshEditor(node);
  }
  function refreshEditor(file){
    if(pathEl) pathEl.textContent = pathOf(file.id);
    if(editorEl) editorEl.value = file.content || '';
    if(titleInput) titleInput.value = file.title || '';
    if(tagsInput) tagsInput.value = file.tags || '';
    renderUrls(file.urls||[]);
    setStatus('Opened ' + file.name);
  }
  function clearEditor(showInstr=false){
    if(pathEl) pathEl.textContent = '/ (no file selected)';
    if(editorEl) editorEl.value = showInstr ? 'Select a file to edit, or create a new file.' : '';
    if(titleInput) titleInput.value = '';
    if(tagsInput) tagsInput.value = '';
    renderUrls([]);
  }
  function saveActiveFile(){
    if(!activeId){ setStatus('No file selected'); return; }
    const node = findById(workspace, activeId);
    if(!node || node.type!=='file'){ setStatus('Cannot save: not a file'); return; }
    node.content = editorEl ? editorEl.value : '';
    node.title = titleInput ? titleInput.value.trim() : '';
    node.tags = tagsInput ? tagsInput.value.trim() : '';
    saveWorkspace();
    setStatus('Saved ' + node.name);
  }
  function downloadActiveFile(){
    if(!activeId){ return setStatus('No file selected'); }
    const node = findById(workspace, activeId);
    if(!node || node.type!=='file'){ return setStatus('Select a file'); }
    const blob = new Blob([node.content || ''], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = node.name || 'notes.txt';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Downloaded ' + (node.name||'file'));
  }

  // URLs for a file
  function renderUrls(urls){
    if(!urlList) return;
    urlList.innerHTML = '';
    (urls||[]).forEach((u, idx)=>{
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href=u; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=u;
      const del = document.createElement('button'); del.className='btn'; del.textContent='Remove';
      del.onclick = ()=>{
        const file = findById(workspace, activeId);
        if(!file || file.type!=='file') return;
        file.urls.splice(idx,1);
        saveWorkspace(); renderUrls(file.urls);
      };
      li.appendChild(a); li.appendChild(del);
      urlList.appendChild(li);
    });
  }
  function addUrl(){
    if(!activeId) return alert('Open a file first');
    const file = findById(workspace, activeId);
    if(!file || file.type!=='file') return alert('Open a file to attach URLs');
    const u = urlInput && urlInput.value ? urlInput.value.trim() : '';
    if(!u) return;
    try{ new URL(u); }catch(e){ return alert('Invalid URL'); }
    file.urls = file.urls || [];
    file.urls.push(u);
    if(urlInput) urlInput.value = '';
    saveWorkspace(); renderUrls(file.urls);
  }

  // ===== Import/Export Workspace =====
  function exportWorkspace(){
    const blob = new Blob([JSON.stringify(workspace, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='codex-jinx-workspace.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('Exported workspace JSON');
  }
  function importWorkspace(file){
    const reader = new FileReader();
    reader.onload = e=>{
      try{
        const data = JSON.parse(e.target.result);
        if(!data || !data.id || !data.type){ throw new Error('Invalid format'); }
        workspace = data;
        activeId = null; localStorage.removeItem(ACTIVE_KEY);
        saveWorkspace(); renderTree(''); clearEditor();
        setStatus('Imported workspace');
      }catch(err){
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ===== File input (single file import) =====
  function importTextFileToTree(file, parentId){
    const parent = findById(workspace, parentId) || workspace;
    if(parent.type!=='folder') return;
    const reader = new FileReader();
    reader.onload = e=>{
      const name = file.name || 'imported.txt';
      const node = { id: uid(), type:'file', name, title:'', tags:'', content:e.target.result, urls:[] };
      parent.children.push(node);
      activeId = node.id; localStorage.setItem(ACTIVE_KEY, activeId);
      saveWorkspace(); renderTree(searchInput && searchInput.value ? searchInput.value.trim() : ''); openNode(node.id);
    };
    reader.readAsText(file);
  }

  // ===== Search =====
  if(searchInput) {
    searchInput.addEventListener('input', ()=>{
      const q = searchInput.value.trim().toLowerCase();
      renderTree(q);
    });
  }

  // ===== Toolbar snippets =====
  document.querySelectorAll('.btn-compact[data-snippet]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const snippet = btn.getAttribute('data-snippet');
      if(!editorEl) return;
      const start = editorEl.selectionStart;
      const end = editorEl.selectionEnd;
      const val = editorEl.value;
      editorEl.value = val.slice(0,start) + snippet + val.slice(end);
      editorEl.selectionStart = editorEl.selectionEnd = start + snippet.length;
      editorEl.focus();
    });
  });

  // ===== Event bindings =====
  if(newFolderBtn) newFolderBtn.onclick = ()=> createFolder(activeId || workspace.id);
  if(newFileBtn) newFileBtn.onclick   = ()=> createFile(activeId || workspace.id);

  if(renameBtn) renameBtn.onclick = ()=>{
    if(!activeId) return alert('Select an item');
    renameNode(activeId);
  };
  if(deleteBtn) deleteBtn.onclick = ()=>{
    if(!activeId) return alert('Select an item');
    deleteNode(activeId);
  };

  if(saveBtn) saveBtn.onclick = saveActiveFile;
  if(downloadBtn) downloadBtn.onclick = downloadActiveFile;

  if(addUrlBtn) addUrlBtn.onclick = addUrl;

  if(fileInput) fileInput.onchange = (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    importTextFileToTree(f, activeId || workspace.id);
    e.target.value = '';
  };

  if(importWorkspaceInput) importWorkspaceInput.onchange = (e)=>{
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    importWorkspace(f);
    e.target.value = '';
  };
  if(exportWorkspaceBtn) exportWorkspaceBtn.onclick = exportWorkspace;

  // ===== Drag & drop into sidebar =====
  if(sidebar) {
    sidebar.addEventListener('dragover', (e)=>{ e.preventDefault(); sidebar.classList.add('drag-over'); });
    sidebar.addEventListener('dragleave', ()=> sidebar.classList.remove('drag-over'));
    sidebar.addEventListener('drop', (e)=>{
      e.preventDefault();
      sidebar.classList.remove('drag-over');
      if(!e.dataTransfer?.files?.length) return;
      const files = [...e.dataTransfer.files].filter(f=>f.type.startsWith('text') || /\.(txt|md|adoc|log|cfg|conf|ini|ps1|bat|sh|py|rb|go|js|json|ya?ml)$/i.test(f.name));
      if(!files.length) return;
      files.forEach(f=> importTextFileToTree(f, activeId || workspace.id));
    });
  }

  // ===== Keyboard shortcuts =====
  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's'){
      e.preventDefault(); saveActiveFile();
    }
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n'){
      e.preventDefault(); createFile(activeId || workspace.id);
    }
  });

  // ===== Init =====
  renderTree('');
  if(activeId){ openNode(activeId); } else { clearEditor(true); }

});

