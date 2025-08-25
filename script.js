// ====== Codex Jinx — Cyber Playbook Workspace ======
(function(){
  const STORAGE_KEY = 'codexJinxWorkspace';
  const ACTIVE_KEY  = 'codexJinxActiveId';

  // DOM references
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
  const uid = () => 'id_' + Math.random().toString(36).slice(2,10);
  const now = () => new Date().toLocaleString();
  const setStatus = msg => statusEl.textContent = msg + ' • ' + now();

  function saveWorkspace(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    setStatus('Workspace saved');
  }
  function loadWorkspace(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ console.warn(e); return null; }
  }
  function createDefaultWorkspace(){
    return {
      id: uid(), type:'folder', name:'Playbook', children:[
        { id: uid(), type:'folder', name:'Recon', children:[] },
        { id: uid(), type:'folder', name:'Exploitation', children:[] },
        { id: uid(), type:'file', name:'README.md', title:'Codex Jinx', tags:'intro,playbook',
          content:`# Codex Jinx — Cyber Playbook\n\nWelcome! Start building your playbook.\n\n> Tip: Use toolbar for snippets.\n`
        }
      ]
    };
  }
  function findById(node, id){
    if(!node) return null;
    if(node.id===id) return node;
    if(node.type==='folder'){
      for(const c of node.children){ const f=findById(c,id); if(f) return f; }
    }
    return null;
  }
  function findParent(node, targetId, parent=null){
    if(node.id===targetId) return parent;
    if(node.type==='folder'){
      for(const c of node.children){ const f=findParent(c,targetId,node); if(f) return f; }
    }
    return null;
  }
  function pathOf(id){
    const parts=[];
    (function dfs(n, trail){
      const t=[...trail,n.name];
      if(n.id===id){parts.push(t); return true;}
      if(n.type==='folder'){
        for(const c of n.children){ if(dfs(c,t)) return true; }
      }
      return false;
    })(workspace,[]);
    const p=parts[0]||[workspace.name];
    return '/'+p.join('/');
  }

  // ===== Tree rendering =====
  function renderTree(filter=''){
    treeEl.innerHTML='';
    function renderNode(node, ul){
      const li=document.createElement('li');
      li.dataset.id=node.id;
      if(node.id===activeId) li.classList.add('active');
      const type=document.createElement('div'); type.textContent=node.type==='folder'?'📁':'📄';
      const label=document.createElement('div'); label.className='node-label'; label.textContent=node.name;
      li.appendChild(type); li.appendChild(label);

      li.onclick=()=>{
        activeId=node.id;
        localStorage.setItem(ACTIVE_KEY, activeId);
        openNode(node.id); renderTree(filter);
      };

      if(!filter || node.name.toLowerCase().includes(filter)) ul.appendChild(li);

      if(node.type==='folder' && node.children.length){
        const sub=document.createElement('ul');
        sub.style.listStyle='none'; sub.style.margin='0 0 0 16px';
        node.children.forEach(c=>renderNode(c,sub));
        ul.appendChild(sub);
      }
    }
    renderNode(workspace,treeEl);
  }

  // ===== Editor / Node handling =====
  function openNode(id){
    const node=findById(workspace,id); if(!node) return;
    if(node.type==='folder'){ pathEl.textContent=pathOf(node.id)+' (folder)'; clearEditor(true); return; }
    pathEl.textContent=pathOf(node.id);
    editorEl.value=node.content||'';
    titleInput.value=node.title||'';
    tagsInput.value=node.tags||'';
    renderUrls(node.urls||[]);
    setStatus('Opened '+node.name);
  }
  function clearEditor(instr=false){
    pathEl.textContent='/ (no file selected)';
    editorEl.value=instr?'Select a file or create a new file.':'';
    titleInput.value=''; tagsInput.value=''; renderUrls([]);
  }
  function saveActiveFile(){
    if(!activeId){ setStatus('No file selected'); return; }
    const node=findById(workspace,activeId);
    if(!node||node.type!=='file'){ setStatus('Cannot save: not a file'); return; }
    node.content=editorEl.value;
    node.title=titleInput.value.trim();
    node.tags=tagsInput.value.trim();
    saveWorkspace();
    setStatus('Saved '+node.name);
  }
  function downloadActiveFile(){
    if(!activeId) return setStatus('No file selected');
    const node=findById(workspace,activeId);
    if(!node||node.type!=='file') return setStatus('Select a file');
    const blob=new Blob([node.content||''],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=node.name||'notes.txt';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatus('Downloaded '+(node.name||'file'));
  }

  // ===== Node operations =====
  const createFolder=(pid)=>{const p=findById(workspace,pid)||workspace;if(p.type!=='folder')return;
    p.children.push({id:uid(),type:'folder',name:'New Folder',children:[]});
    saveWorkspace(); renderTree(searchInput.value.trim());
  };
  const createFile=(pid)=>{const p=findById(workspace,pid)||workspace;if(p.type!=='folder')return;
    const f={id:uid(),type:'file',name:'untitled.txt',title:'',tags:'',content:'',urls:[]};
    p.children.push(f); activeId=f.id; localStorage.setItem(ACTIVE_KEY,activeId);
    saveWorkspace(); renderTree(searchInput.value.trim()); openNode(f.id);
  };
  const renameNode=(id)=>{const n=findById(workspace,id); if(!n) return; const nm=prompt('Rename:',n.name); if(!nm)return;
    n.name=nm.trim(); saveWorkspace(); renderTree(searchInput.value.trim()); if(id===activeId) openNode(id);
  };
  const deleteNode=(id)=>{if(workspace.id===id) return alert('Cannot delete root');
    const par=findParent(workspace,id); if(!par) return;
    if(!confirm('Delete this item?')) return;
    par.children=par.children.filter(c=>c.id!==id);
    if(activeId===id){activeId=null; localStorage.removeItem(ACTIVE_KEY); clearEditor();}
    saveWorkspace(); renderTree(searchInput.value.trim());
  };

  // URLs
  function renderUrls(urls){
    urlList.innerHTML='';
    (urls||[]).forEach((u,i)=>{
      const li=document.createElement('li');
      const a=document.createElement('a'); a.href=u; a.target='_blank'; a.textContent=u;
      const del=document.createElement('button'); del.textContent='Remove';
      del.onclick=()=>{const f=findById(workspace,activeId); if(!f)return;
        f.urls.splice(i,1); saveWorkspace(); renderUrls(f.urls);};
      li.appendChild(a); li.appendChild(del); urlList.appendChild(li);
    });
  }
  const addUrl=()=>{if(!activeId) return alert('Open a file first');
    const f=findById(workspace,activeId); if(!f||f.type!=='file') return alert('Open a file to attach URLs');
    const u=urlInput.value.trim(); if(!u) return;
    try{new URL(u);}catch(e){return alert('Invalid URL');}
    f.urls=f.urls||[]; f.urls.push(u); urlInput.value=''; saveWorkspace(); renderUrls(f.urls);
  };

  // Import/export workspace
  const exportWorkspace=()=>{
    const blob=new Blob([JSON.stringify(workspace,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='codex-jinx-workspace.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatus('Exported workspace');
  };
  const importWorkspace=(file)=>{
    const r=new FileReader();
    r.onload=e=>{
      try{const data=JSON.parse(e.target.result);
        if(!data||!data.id||!data.type) throw new Error('Invalid format');
        workspace=data; activeId=null; localStorage.removeItem(ACTIVE_KEY);
        saveWorkspace(); renderTree(''); clearEditor(); setStatus('Imported workspace');
      }catch(err){alert('Failed to import: '+err.message);}
    };
    r.readAsText(file);
  };

  // File import
  const importTextFileToTree=(file,pid)=>{
    const parent=findById(workspace,pid)||workspace; if(parent.type!=='folder')return;
    const r=new FileReader();
    r.onload=e=>{
      const name=file.name||'imported.txt';
      const node={id:uid(),type:'file',name,title:'',tags:'',content:e.target.result,urls:[]};
      parent.children.push(node); activeId=node.id; localStorage.setItem(ACTIVE_KEY,activeId);
      saveWorkspace(); renderTree(searchInput.value.trim()); openNode(node.id);
    };
    r.readAsText(file);
  };

  // Search
  searchInput.addEventListener('input',()=>{renderTree(searchInput.value.trim().toLowerCase());});

  // Toolbar snippet insertion
  document.querySelectorAll('.btn-compact[data-snippet]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const snip=btn.dataset.snippet;
      const start=editorEl.selectionStart; const end=editorEl.selectionEnd;
      const val=editorEl.value;
      editorEl.value=val.slice(0,start)+snip+val.slice(end);
      editorEl.selectionStart=editorEl.selectionEnd=start+snip.length;
      editorEl.focus();
    });
  });

  // Event bindings
  newFolderBtn.onclick=()=>createFolder(activeId||workspace.id);
  newFileBtn.onclick=()=>createFile(activeId||workspace.id);
  renameBtn.onclick=()=>{if(!activeId) return alert('Select item'); renameNode(activeId);};
  deleteBtn.onclick=()=>{if(!activeId) return alert('Select item'); deleteNode(activeId);};
  saveBtn.onclick=saveActiveFile;
  downloadBtn.onclick=downloadActiveFile;
  addUrlBtn.onclick=addUrl;

  // File input: allow multiple
  fileInput.onchange=(e)=>{
    const files=[...e.target.files];
    files.forEach(f=>importTextFileToTree(f,activeId||workspace.id));
    e.target.value='';
  };
  importWorkspaceInput.onchange=(e)=>{
    const f=e.target.files&&e.target.files[0]; if(!f)return;
    importWorkspace(f); e.target.value='';
  };
  exportWorkspaceBtn.onclick=exportWorkspace;

  // Drag & drop
  sidebar.addEventListener('dragover',e=>{e.preventDefault(); sidebar.classList.add('drag-over');});
  sidebar.addEventListener('dragleave',()=>sidebar.classList.remove('drag-over'));
  sidebar.addEventListener('drop',e=>{
    e.preventDefault(); sidebar.classList.remove('drag-over');
    const files=[...e.dataTransfer.files].filter(f=>f.type.startsWith('text')||/\.(txt|md|adoc|log|cfg|conf|ini|ps1|bat|sh|py|rb|go|js|json|ya?ml)$/i.test(f.name));
    files.forEach(f=>importTextFileToTree(f,activeId||workspace.id));
  });

  // Keyboard shortcuts
  window.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault(); saveActiveFile();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault(); createFile(activeId||workspace.id);}
  });

  // Init
  renderTree('');
  if(activeId){ openNode(activeId); } else { clearEditor(true); }

})();
