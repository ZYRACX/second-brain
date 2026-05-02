import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, CheckSquare, X as CloseIcon, Calendar } from 'lucide-react';

export default function NoteEditor({ activeNote, onSave, onDelete, onLinkClick, allNotes }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [dueDate, setDueDate] = useState(''); // NEW: Due Date state
  const [backlinks, setBacklinks] = useState([]);
  const [titleError, setTitleError] = useState('');
  
  const textareaRef = useRef(null); 
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window;

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content || '');
      setTags(activeNote.tags || []);
      // Set due date, formatting from ISO string to YYYY-MM-DD for HTML input
      setDueDate(activeNote.due_date ? activeNote.due_date.split('T')[0] : '');
      setTitleError('');
      fetchBacklinks(activeNote.title);
    }
  }, [activeNote]);

  useEffect(() => {
    if (!activeNote) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return; 

    const isDuplicate = allNotes.some(
      n => n.id !== activeNote.id && n.title.toLowerCase() === trimmedTitle.toLowerCase()
    );

    if (isDuplicate) {
      setTitleError('A note with this title already exists.');
      return; 
    } else {
      setTitleError('');
    }

    const timeoutId = setTimeout(() => {
      const tagsChanged = JSON.stringify(tags) !== JSON.stringify(activeNote.tags || []);
      const activeNoteDate = activeNote.due_date ? activeNote.due_date.split('T')[0] : '';
      const dateChanged = dueDate !== activeNoteDate;
      
      if (title !== activeNote.title || content !== activeNote.content || tagsChanged || dateChanged) {
        onSave({ 
          ...activeNote, 
          title: trimmedTitle, 
          content, 
          tags,
          due_date: dueDate ? new Date(dueDate).toISOString() : null // Save due date!
        });
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [title, content, tags, dueDate, activeNote, onSave, allNotes]);

  const fetchBacklinks = async (noteTitle) => {
    const { data } = await supabase
      .from('notes')
      .select('id, title')
      .ilike('content', `%[[${noteTitle}]]%`)
      .neq('id', activeNote.id);
    setBacklinks(data || []);
  };

  const handleTextareaClick = (e) => {
    if (e.target.selectionStart !== e.target.selectionEnd) return;

    const cursorPosition = e.target.selectionStart;
    const text = e.target.value;
    const regex = /\[\[(.*?)\]\]/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      const canFollowLink = isTouchDevice ? true : (e.ctrlKey || e.metaKey);

      if (canFollowLink && cursorPosition > start && cursorPosition < end) {
        const linkedTitle = match[1];
        onLinkClick(linkedTitle);
        break; 
      }
    }
  };

  const insertFormatting = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      if (selectedText.length > 0) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); 
      
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const ToolbarButton = ({ icon, onClick, title }) => (
    <button 
      onClick={onClick} 
      title={title}
      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
    >
      {icon}
    </button>
  );

  if (!activeNote) {
    return (
      <div className="hidden md:flex p-8 text-gray-500 items-center justify-center h-full w-full">
        Select or create a note from the sidebar.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-base p-4 md:p-8 md:max-w-4xl md:mx-auto w-full overflow-hidden">
      
      {/* Header */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between items-start gap-4 mb-2">
          <div className="flex-1">
            <input 
              className={`text-3xl md:text-4xl font-bold bg-transparent border-none outline-none w-full text-gray-100 placeholder-gray-600 focus:border-b transition-all pb-2 ${titleError ? 'border-red-500 text-red-400' : 'border-gray-700'}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
            />
            {titleError && <p className="text-red-500 text-sm mt-1">{titleError}</p>}
          </div>
          
          <button 
            onClick={() => {
              onDelete(activeNote.id);
              if (activeNote.category === 'Archive') onLinkClick(null); 
            }} 
            className="text-red-500 hover:text-red-400 text-sm md:text-base font-medium transition-colors whitespace-nowrap mt-2"
          >
            {activeNote.category === 'Archive' ? 'Delete Forever' : 'Archive'}
          </button>
        </div>

        {/* Due Date (ONLY for Projects) */}
        {activeNote.category === 'Project' && !activeNote.is_folder && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Calendar size={14} className="text-gray-500" />
            <span className="text-gray-500 font-medium">Due Date:</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent text-gray-300 outline-none cursor-pointer focus:border-b border-gray-600"
            />
            {dueDate && (
              <button onClick={() => setDueDate('')} className="text-gray-600 hover:text-red-400 ml-1">
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {!activeNote.is_folder && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-blue-900/40 text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-800/50">
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-blue-100 focus:outline-none">
                  <CloseIcon size={12} />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={tags.length === 0 ? "Add tags..." : "+ tag"}
              className="bg-transparent border-none outline-none text-sm text-gray-500 placeholder-gray-600 focus:text-gray-300 w-24"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
        )}
      </div>

      {/* Formatting Toolbar */}
      {!activeNote.is_folder && (
        <div className="flex items-center gap-1 mb-3 p-1.5 bg-gray-900/80 border border-gray-800 rounded-lg shrink-0 w-fit">
          <ToolbarButton icon={<Bold size={16} />} onClick={() => insertFormatting('**', '**')} title="Bold" />
          <ToolbarButton icon={<Italic size={16} />} onClick={() => insertFormatting('*', '*')} title="Italic" />
          
          <div className="w-px h-5 bg-gray-700 mx-1" /> 
          
          <ToolbarButton icon={<Heading1 size={16} />} onClick={() => insertFormatting('# ')} title="Heading 1" />
          <ToolbarButton icon={<Heading2 size={16} />} onClick={() => insertFormatting('## ')} title="Heading 2" />
          
          <div className="w-px h-5 bg-gray-700 mx-1" /> 
          
          <ToolbarButton icon={<List size={16} />} onClick={() => insertFormatting('- ')} title="Bullet List" />
          <ToolbarButton icon={<ListOrdered size={16} />} onClick={() => insertFormatting('1. ')} title="Numbered List" />
          <ToolbarButton icon={<CheckSquare size={16} />} onClick={() => insertFormatting('- [ ] ')} title="Checkbox" />
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {!activeNote.is_folder ? (
          <textarea
            ref={textareaRef} 
            className="flex-1 w-full bg-transparent border-none outline-none resize-none font-mono text-base text-gray-300 leading-relaxed cursor-text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={handleTextareaClick}
            placeholder={
              isTouchDevice 
                ? "Start typing... Tap inside a [[Link]] to open it."
                : "Start typing... Hold Ctrl+Click (or Cmd+Click) on a [[Link]] to open it."
            }
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            This is a folder. You can add notes or sub-folders inside it from the sidebar.
          </div>
        )}

        {backlinks.length > 0 && !activeNote.is_folder && (
          <div className="mt-12 pt-6 border-t border-gray-800 shrink-0">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Linked Mentions</h4>
            <ul className="space-y-2">
              {backlinks.map(bl => (
                <li key={bl.id}>
                  <button 
                    onClick={() => onLinkClick(bl.title)} 
                    className="text-blue-400 hover:text-blue-300 hover:underline text-left w-full transition-colors"
                  >
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