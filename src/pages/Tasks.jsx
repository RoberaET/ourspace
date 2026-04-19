import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

const Tasks = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [assignee, setAssignee] = useState(user?.id);

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // Optimistic add to UI or just fetch after insert, wait for DB
    const { data, error } = await supabase.from('tasks').insert({
      title: newTaskTitle.trim(),
      assigned_to: assignee,
      creator_id: user.id
    }).select().single();

    if (!error && data) {
      setTasks([data, ...tasks]);
      setNewTaskTitle('');
    }
  };

  const toggleTask = async (task) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    
    const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) {
      // revert on error
      loadTasks();
    }
  };

  const deleteTask = async (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-title">
        <h2 style={{ fontSize: 24 }}>Shared Tasks</h2>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <form onSubmit={addTask} style={{ display: 'flex', gap: 12 }}>
          <input 
            type="text" 
            className="input" 
            style={{ marginBottom: 0 }}
            placeholder="Add a new task..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <select 
            className="input bg-input" 
            style={{ width: '150px', marginBottom: 0, paddingLeft: 12 }} 
            value={assignee} 
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value={user?.id}>For Me</option>
            {profile?.partner_id && <option value={profile.partner_id}>For Partner</option>}
          </select>
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} /> Add
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map(t => (
          <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
            <div onClick={() => toggleTask(t)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {t.completed ? <CheckCircle2 color="var(--color-primary)" size={24} /> : <Circle color="var(--text-dim)" size={24} />}
            </div>
            <div style={{ marginLeft: 16, flex: 1, opacity: t.completed ? 0.5 : 1, textDecoration: t.completed ? 'line-through' : 'none' }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{t.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                Assigned to: {t.assigned_to === user?.id ? 'Me' : 'Partner'}
              </div>
            </div>
            <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
            No tasks yet. Add one above!
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
