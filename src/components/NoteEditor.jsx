import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';

export default function NoteEditor({ activeNote, onSave, onDelete, onLinkClick }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [backlinks, setBacklinks] = useState([]);

  // Sync state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content || '');
      fetchBacklinks(activeNote.title);
    }
  }, [activeNote]);

  // Auto-save debounce
  useEffect(() => {
    if (!activeNote) return;
    const timeoutId = setTimeout(() => {
      if (title !== activeNote.title || content !== activeNote.content) {
        onSave({ ...activeNote, title, content });
      }
    }, 1000); // Auto-save after 1s of inactivity
    return () => clearTimeout(timeoutId);
  }, [title, content, activeNote, onSave]);

  const fetchBacklinks = async (noteTitle) => {
    // Search all notes where content includes [[NoteTitle]]
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .ilike('content', `%[[${noteTitle}]]%`)
      .neq('id', activeNote.id);
    setBacklinks(data || []);
  };

  // Process [[Links]] to make them clickable in Markdown preview
  const processedContent = content.replace(
    /\[\[(.*?)\]\]/g, 
    (match, title) => `[${title}](#${title.replace(/\s+/g, '-')})`
  );

  if (!activeNote) return <div className="p-8 text-gray-500">Select or create a note.</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-base p-6">
      <div className="flex justify-between items-center mb-6">
        <input 
          className="text-3xl font-bold bg-transparent border-none outline-none w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button onClick={() => onDelete(activeNote.id)} className="text-red-500">Delete</button>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Editor */}
        <textarea
          className="w-full h-full p-4 rounded-lg bg-surface border border-gray-700 outline-none resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing... Use [[Title]] to link notes."
        />
        
        {/* Preview & Backlinks */}
        <div className="flex flex-col h-full overflow-y-auto p-4 rounded-lg bg-surface border border-gray-700">
          <div className="prose prose-invert flex-1">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <span 
                    className="text-blue-400 cursor-pointer hover:underline"
                    onClick={() => onLinkClick(props.children[0])}
                  >
                    [[{props.children}]]
                  </span>
                )
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
          
          {backlinks.length > 0 && (
            <div className="mt-8 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Backlinks</h4>
              <ul className="text-sm">
                {backlinks.map(bl => (
                  <li key={bl.id}>
                    <button onClick={() => onLinkClick(bl.title)} className="text-blue-400 hover:underline">
                      {bl.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}