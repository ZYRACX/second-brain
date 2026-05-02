import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FilePlus, FolderPlus, FileText, Trash2 } from 'lucide-react';

export default function FileTree({ items, category, activeNoteId, onSelect, onCreate, isArchive, onDelete }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggleFolder = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const renderNode = (node, level = 0) => {
    const children = items.filter(i => i.parent_id === node.id);
    const isExpanded = expanded.has(node.id);
    const isActive = activeNoteId === node.id;

    if (node.is_folder) {
      return (
        <div key={node.id} className="select-none">
          <div className={`group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer text-gray-300`}>
            
            <div className="flex items-center gap-1.5 flex-1 overflow-hidden" onClick={() => toggleFolder(node.id)} style={{ paddingLeft: `${level * 12}px` }}>
              {isExpanded ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
              <Folder size={14} className={`shrink-0 ${isArchive ? "text-gray-500" : "text-blue-400"}`} />
              <span className="truncate text-sm">{node.title}</span>
            </div>
            
            {/* MOBILE FIX: Always flex on mobile, hover-only on medium+ screens */}
            <div className="flex md:hidden md:group-hover:flex items-center gap-1 shrink-0 pl-2">
              {!isArchive && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onCreate(category, node.id, false); }} className="p-1 hover:text-white" title="New Note">
                    <FilePlus size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onCreate(category, node.id, true); }} className="p-1 hover:text-white" title="New Folder">
                    <FolderPlus size={14} />
                  </button>
                </>
              )}
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if(confirm(`Are you sure you want to ${isArchive ? 'permanently delete' : 'archive'} this folder and everything inside it?`)) {
                    onDelete(node.id); 
                  }
                }} 
                className="p-1 text-gray-500 hover:text-red-400 transition-colors" 
                title={isArchive ? "Delete Forever" : "Archive Folder"}
              >
                <Trash2 size={14} />
              </button>
            </div>

          </div>
          
          {isExpanded && (
            <div>
              {children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        key={node.id} 
        onClick={() => onSelect(node.id)}
        className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${isActive ? 'bg-blue-900/50 text-blue-200' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden" style={{ paddingLeft: `${(level * 12) + 20}px` }}>
          <FileText size={14} className={`shrink-0 ${isArchive ? "text-gray-500" : ""}`} />
          <span className="truncate text-sm">{node.title}</span>
        </div>

        {/* MOBILE FIX: Always flex on mobile, hover-only on medium+ screens */}
        <div className="flex md:hidden md:group-hover:flex items-center pr-1 shrink-0 pl-2">
           <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onDelete(node.id); 
              }} 
              className="p-1 text-gray-500 hover:text-red-400 transition-colors" 
              title={isArchive ? "Delete Forever" : "Archive File"}
            >
              <Trash2 size={14} />
            </button>
        </div>

      </div>
    );
  };

  const rootItems = items.filter(i => !i.parent_id);

  return (
    <div className="mt-1">
      {rootItems.map(node => renderNode(node, 0))}
    </div>
  );
}