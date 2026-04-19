import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Trash2, MapPin } from 'lucide-react';

const Dates = () => {
  const { user } = useAuth();
  const [dates, setDates] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (user) loadDates();
  }, [user]);

  const loadDates = async () => {
    const { data } = await supabase.from('dates').select('*').order('date', { ascending: true });
    if (data) {
      // filter out past dates roughly
      const upcoming = data.filter(d => new Date(d.date) >= new Date().setHours(0,0,0,0));
      setDates(upcoming);
    }
  };

  const addDate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    
    // Ensuring datetime format for timezone roughly
    const dateObj = new Date(newDate);

    const { data, error } = await supabase.from('dates').insert({
      title: newTitle.trim(),
      date: dateObj.toISOString(),
      location: newLocation.trim() || null,
      creator_id: user.id
    }).select().single();

    if (!error && data) {
      const refreshed = [...dates, data].sort((a,b) => new Date(a.date) - new Date(b.date));
      setDates(refreshed);
      setNewTitle('');
      setNewDate('');
      setNewLocation('');
    }
  };

  const deleteDate = async (id) => {
    setDates(dates.filter(d => d.id !== id));
    await supabase.from('dates').delete().eq('id', id);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-title">
        <h2 style={{ fontSize: 24 }}>Upcoming Dates</h2>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <form onSubmit={addDate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              className="input" 
              style={{ marginBottom: 0, flex: 2 }}
              placeholder="What are we doing?" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input 
              type="datetime-local" 
              className="input bg-input" 
              style={{ marginBottom: 0, flex: 1, paddingLeft: 12 }} 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <input 
              type="text" 
              className="input bg-input" 
              style={{ marginBottom: 0, flex: 1 }}
              placeholder="Location (Optional)" 
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} /> Add Date
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dates.map(d => {
          const dateObj = new Date(d.date);
          const month = dateObj.toLocaleString('en-US', { month: 'short' });
          const day = dateObj.getDate();
          const time = dateObj.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });

          return (
            <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-card-highlight)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 100 }}>
                <span style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '1px' }}>{month}</span>
                <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, marginTop: 4 }}>{day}</span>
              </div>
              <div style={{ padding: '24px', flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{d.title}</div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                     <Calendar size={14} color="var(--color-primary)" /> {time}
                  </div>
                  {d.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                       <MapPin size={14} color="var(--color-primary)" /> {d.location}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => deleteDate(d.id)} style={{ padding: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
        {dates.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
            No upcoming dates planned!
          </div>
        )}
      </div>
    </div>
  );
};

export default Dates;
