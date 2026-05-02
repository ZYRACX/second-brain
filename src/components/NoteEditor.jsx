import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function NoteEditor({ activeNote, onSave, onDelete, onLinkClick }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [backlinks, setBacklinks] = useState([]);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content || '');
      fetchBacklinks(activeNote.title);
    }
  }, [activeNote]);

  useEffect(() => {
    if (!activeNote) return;
    const timeoutId = setTimeout(() => {
      if (title !== activeNote.title || content !== activeNote.content) {
        onSave({ ...activeNote, title, content });
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, content, activeNote, onSave]);

  const fetchBacklinks = async (noteTitle) => {
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .ilike('content', `%[[${noteTitle}]]%`)
      .neq('id', activeNote.id);
    setBacklinks(data || []);
  };

  // 🪄 THE MAGIC: Detect clicks inside [[links]] within a plain text area
  const handleTextareaClick = (e) => {
    // 1. Find exactly where the user clicked inside the string
    const cursorPosition = e.target.selectionStart;
    const text = e.target.value;

    // 2. Find every [[link]] in the document
    const regex = /\[\[(.*?)\]\]/g;
    let match;
    
    // 3. Loop through them and check if the cursor is currently inside one
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      if (cursorPosition >= start && cursorPosition <= end) {
        // We found a match! Navigate to the title inside the brackets
        const linkedTitle = match[1];
        onLinkClick(linkedTitle);
        break; // Stop looking once we found it
      }
    }
  };

  if (!activeNote) return <div className="hidden md:flex p-8 text-gray-500 items-center justify-center h-full w-full">Select or create a note from the sidebar.</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-base p-4 md:p-8 md:max-w-4xl md:mx-auto w-full overflow-hidden">
      
      {/* Title Header */}
      <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0 gap-4">
        <input 
          className="text-3xl md:text-4xl font-bold bg-transparent border-none outline-none w-full text-gray-100 placeholder-gray-600 focus:border-b border-gray-700 transition-all pb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button onClick={() => onDelete(activeNote.id)} className="text-red-500 hover:text-red-400 text-sm md:text-base font-medium transition-colors">
          Delete
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <textarea
          className="flex-1 w-full bg-transparent border-none outline-none resize-none font-mono text-base text-gray-300 leading-relaxed cursor-text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={handleTextareaClick} // <-- Attached our custom click listener here
          placeholder="Start typing... Use [[Title]] to link notes. Click directly on a [[link]] to open it."
        />

        {/* Backlinks Section */}
        {backlinks.length > 0 && (
          <div className="mt-12 pt-6 border-t border-gray-800 shrink-0">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Linked Mentions</h4>
            <ul className="space-y-2">
              {backlinks.map(bl => (
                <li key={bl.id}>
                  <button onClick={() => onLinkClick(bl.title)} className="text-blue-400 hover:text-blue-300 hover:underline text-left w-full transition-colors">
                    {bl.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}