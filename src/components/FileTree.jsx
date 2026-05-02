import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FolderPlus, FilePlus, FileText } from 'lucide-react';

export default function FileTree({ items, category, activeNoteId, onSelect, onCreate }) {
  // Track which folders are open
  const [expanded, setExpanded] = useState(new Set());

  const toggleFolder = (id) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  // The recursive node renderer
  const renderNode = (node, level = 0) => {
    const children = items.filter(i => i.parent_id === node.id);
    const isExpanded = expanded.has(node.id);
    const isActive = activeNoteId === node.id;

    if (node.is_folder) {
      return (
        <div key={node.id} className="select-none">
          <div className={`group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer text-gray-300`}>
            <div className="flex items-center gap-1.5 flex-1 overflow-hidden" onClick={() => toggleFolder(node.id)} style={{ paddingLeft: `${level * 12}px` }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Folder size={14} className="text-blue-400" />
              <span className="truncate text-sm">{node.title}</span>
            </div>
            
            {/* Quick action buttons on hover */}
            <div className="hidden group-hover:flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onCreate(category, node.id, false); }} className="p-1 hover:text-white" title="New Note">
                <FilePlus size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onCreate(category, node.id, true); }} className="p-1 hover:text-white" title="New Folder">
                <FolderPlus size={14} />
              </button>
            </div>
          </div>
          
          {/* Render Children Recursively */}
          {isExpanded && (
            <div>
              {children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Render File
    return (
      <div 
        key={node.id} 
        onClick={() => onSelect(node.id)}
        className={`group flex items-center px-2 py-1.5 rounded cursor-pointer ${isActive ? 'bg-blue-900/50 text-blue-200' : 'hover:bg-gray-800 text-gray-400'}`}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden" style={{ paddingLeft: `${(level * 12) + 20}px` }}>
          <FileText size={14} />
          <span className="truncate text-sm">{node.title}</span>
        </div>
      </div>
    );
  };

  // Find all root-level items for this category (parent_id is null)
  const rootItems = items.filter(i => !i.parent_id);

  return (
    <div className="mt-1">
      {rootItems.map(node => renderNode(node, 0))}
    </div>
  );
}