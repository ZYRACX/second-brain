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
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return { notes, saveNote, deleteNote, loading };
}