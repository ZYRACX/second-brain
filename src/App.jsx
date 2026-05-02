import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useNotes } from './hooks/useNotes';
import NoteEditor from './components/NoteEditor';
import Auth from './components/Auth';
import FileTree from './components/FileTree'; // <-- Import the new component
import { FolderPlus, FilePlus } from 'lucide-react'; // <-- Import icons

export default function App() {
  const [session, setSession] = useState(null);
  const { notes, saveNote, deleteNote } = useNotes(session);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (!session) return <Auth />;

  const activeNote = notes.find(n => n.id === activeNoteId);
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Updated creation function handles folders and parent_ids
  const handleCreateItem = async (category, parentId = null, isFolder = false) => {
    let title = isFolder ? prompt('Enter folder name:') : 'Untitled Note';
    if (isFolder && !title) return; // Cancel if user clicked folder but provided no name

    const newItem = await saveNote({ 
      title, 
      content: '', 
      category,
      parent_id: parentId,
      is_folder: isFolder
    });
    
    // Only set as active if it's a file, we don't "open" folders in the editor
    if (newItem && !isFolder) setActiveNoteId(newItem.id);
  };

  const navigateToLink = (titleToFind) => {
    const target = notes.find(n => n.title.toLowerCase() === titleToFind.toLowerCase() && !n.is_folder);
    if (target) setActiveNoteId(target.id);
    else alert("Note not found.");
  };

  return (
    <div className="flex h-screen bg-black text-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col select-none">
        <div className="p-4 border-b border-gray-800">
          <input 
            className="w-full bg-gray-800 rounded p-2 text-sm outline-none border border-gray-700 focus:border-blue-500 transition-colors"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {['Project', 'Area', 'Resource', 'Archive'].map(category => (
            <div key={category} className="mb-4">
              <div className="flex justify-between items-center px-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                {category}s
                <div className="flex gap-2">
                  {/* Create root-level items for this category */}
                  <button onClick={() => handleCreateItem(category, null, false)} className="hover:text-white" title="New Root File"><FilePlus size={14}/></button>
                  <button onClick={() => handleCreateItem(category, null, true)} className="hover:text-white" title="New Root Folder"><FolderPlus size={14}/></button>
                </div>
              </div>
              
              {/* Insert our new recursive tree here */}
              <FileTree 
                items={filteredNotes.filter(n => n.category === category)} 
                category={category}
                activeNoteId={activeNoteId} 
                onSelect={setActiveNoteId}
                onCreate={handleCreateItem}
              />

            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800 text-center">
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-500 hover:text-white">Sign Out</button>
        </div>
      </div>

      {/* Editor Area */}
      <NoteEditor 
        activeNote={activeNote} 
        onSave={saveNote} 
        onDelete={deleteNote}
        onLinkClick={navigateToLink}
      />
    </div>
  );
}