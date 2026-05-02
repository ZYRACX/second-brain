import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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

  const processedContent = content.replace(
    /\[\[(.*?)\]\]/g, 
    (match, title) => `[${title}](#${title.replace(/\s+/g, '-')})`
  );

  if (!activeNote) return <div className="hidden md:flex p-8 text-gray-500 items-center justify-center h-full">Select or create a note from the sidebar.</div>;

  return (
    <div className="flex-1 flex flex-col h-full bg-base p-4 md:p-6 overflow-hidden">
      {/* Note Title Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0 gap-4">
        <input 
          className="text-2xl md:text-3xl font-bold bg-transparent border-none outline-none w-full text-gray-100 placeholder-gray-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button onClick={() => onDelete(activeNote.id)} className="text-red-500 hover:text-red-400 text-sm md:text-base font-medium transition-colors">
          Delete
        </button>
      </div>

      {/* Editor & Preview Area - Stacked on Mobile, Side-by-Side on Large Desktop */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Editor */}
        <textarea
          className="flex-1 lg:w-1/2 p-4 rounded-lg bg-surface border border-gray-700 outline-none resize-none overflow-y-auto font-mono text-sm leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing... Use [[Title]] to link notes."
        />
        
        {/* Preview & Backlinks */}
        <div className="flex-1 lg:w-1/2 flex flex-col overflow-y-auto p-4 rounded-lg bg-surface border border-gray-700">
          <div className="prose prose-invert prose-sm md:prose-base flex-1 min-w-0 max-w-none">
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
            <div className="mt-8 pt-4 border-t border-gray-700 shrink-0">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Backlinks</h4>
              <ul className="text-sm space-y-1">
                {backlinks.map(bl => (
                  <li key={bl.id}>
                    <button onClick={() => onLinkClick(bl.title)} className="text-blue-400 hover:text-blue-300 hover:underline truncate text-left w-full">
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