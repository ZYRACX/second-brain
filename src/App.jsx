import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useNotes } from './hooks/useNotes';
import NoteEditor from './components/NoteEditor';
import Auth from './components/Auth';
import FileTree from './components/FileTree';
import { FolderPlus, FilePlus, Menu, X } from 'lucide-react'; // Added Menu & X icons

export default function App() {
  const [session, setSession] = useState(null);
  const { notes, saveNote, deleteNote } = useNotes(session);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state to control sidebar on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleCreateItem = async (category, parentId = null, isFolder = false) => {
    let title = isFolder ? prompt('Enter folder name:') : 'Untitled Note';
    if (isFolder && !title) return; 

    const newItem = await saveNote({ 
      title, 
      content: '', 
      category,
      parent_id: parentId,
      is_folder: isFolder
    });
    
    if (newItem && !isFolder) {
      setActiveNoteId(newItem.id);
      setIsSidebarOpen(false); // Close sidebar on mobile after creating a note
    }
  };

  const navigateToLink = (titleToFind) => {
    const target = notes.find(n => n.title.toLowerCase() === titleToFind.toLowerCase() && !n.is_folder);
    if (target) setActiveNoteId(target.id);
    else alert("Note not found.");
  };

  return (
    <div className="flex h-screen w-full bg-black text-gray-100 font-sans overflow-hidden">
      
      {/* Mobile Overlay Background */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Fixed on mobile, relative on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col select-none 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Mobile Sidebar Header with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 md:hidden">
          <span className="font-bold text-gray-300">My Brain</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

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
                  <button onClick={() => handleCreateItem(category, null, false)} className="hover:text-white" title="New Root File"><FilePlus size={14}/></button>
                  <button onClick={() => handleCreateItem(category, null, true)} className="hover:text-white" title="New Root Folder"><FolderPlus size={14}/></button>
                </div>
              </div>
              
              <FileTree 
                items={filteredNotes.filter(n => n.category === category)} 
                category={category}
                activeNoteId={activeNoteId} 
                onSelect={(id) => {
                  setActiveNoteId(id);
                  setIsSidebarOpen(false); // Close sidebar on mobile when note is selected
                }}
                onCreate={handleCreateItem}
              />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800 text-center">
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-gray-500 hover:text-white">Sign Out</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="flex items-center p-4 border-b border-gray-800 bg-surface md:hidden shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="mr-3 text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="font-bold truncate text-gray-200">
            {activeNote ? activeNote.title : 'Second Brain'}
          </span>
        </div>

        {/* Editor Area */}
        <NoteEditor 
          activeNote={activeNote} 
          onSave={saveNote} 
          onDelete={deleteNote}
          onLinkClick={navigateToLink}
        />
      </div>
    </div>
  );
}