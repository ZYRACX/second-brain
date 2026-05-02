import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useNotes(session) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error) setNotes(data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const saveNote = async (note) => {
    const isNew = !note.id;
    const payload = {
      ...note,
      user_id: session.user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notes')
      .upsert(payload)
      .select()
      .single();

    if (!error) {
      setNotes(prev => isNew ? [data, ...prev] : prev.map(n => n.id === data.id ? data : n));
      return data;
    }
  };

  const deleteNote = async (id) => {
    const noteToDelete = notes.find(n => n.id === id);
    if (!noteToDelete) return;

    if (noteToDelete.category === 'Archive') {
      await supabase.from('notes').delete().eq('id', id);
      fetchNotes(); 
    } else {
      const getDescendantIds = (parentId) => {
        const children = notes.filter(n => n.parent_id === parentId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
          ids = [...ids, ...getDescendantIds(c.id)];
        });
        return ids;
      };

      const idsToUpdate = [id, ...getDescendantIds(id)];

      await supabase
        .from('notes')
        .update({ category: 'Archive' })
        .in('id', idsToUpdate);
        
      await supabase
        .from('notes')
        .update({ parent_id: null })
        .eq('id', id);

      fetchNotes(); 
    }
  };

  return { notes, saveNote, deleteNote, loading };
}