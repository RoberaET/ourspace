import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, MessageSquare, CheckCircle2, Circle, Trash2 } from 'lucide-react';

const ActivityChart = ({ disagreements }) => {
  // Generate last 182 days (26 weeks)
  const days = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }

  const counts = {};
  disagreements.forEach(d => {
    const dateStr = d.date.split('T')[0];
    counts[dateStr] = (counts[dateStr] || 0) + 1;
  });

  const getDayColor = (count) => {
    if (count === 0) return 'var(--bg-card-highlight)';
    if (count === 1) return 'rgba(242, 60, 111, 0.4)';
    if (count === 2) return 'rgba(242, 60, 111, 0.7)';
    return 'var(--color-primary)';
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: 16, marginBottom: 16, fontWeight: 600 }}>Conflict Heatmap</h3>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {Array.from({ length: 26 }).map((_, weekIdx) => (
          <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const dayIndex = weekIdx * 7 + dayIdx;
              if (dayIndex >= days.length) return null;
              
              const dateObj = days[dayIndex];
              const dateStr = dateObj.toISOString().split('T')[0];
              const count = counts[dateStr] || 0;
              
              return (
                <div 
                  key={dayIndex}
                  title={`${dateStr}: ${count} disagreements`}
                  style={{
                    width: 12, 
                    height: 12, 
                    borderRadius: 2, 
                    background: getDayColor(count),
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
         Less 
         <div style={{width: 10, height: 10, borderRadius: 2, background: getDayColor(0)}} />
         <div style={{width: 10, height: 10, borderRadius: 2, background: getDayColor(1)}} />
         <div style={{width: 10, height: 10, borderRadius: 2, background: getDayColor(2)}} />
         <div style={{width: 10, height: 10, borderRadius: 2, background: getDayColor(3)}} />
         More
      </div>
    </div>
  );
};

const Disagreements = () => {
  const { user, profile } = useAuth();
  const [disagreements, setDisagreements] = useState([]);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [myStory, setMyStory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Partner reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyStory, setReplyStory] = useState('');

  useEffect(() => {
    if (user) loadDisagreements();
  }, [user]);

  const loadDisagreements = async () => {
    const { data } = await supabase
      .from('disagreements')
      .select('*')
      .order('date', { ascending: false });
    if (data) setDisagreements(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!topic || !myStory) return;

    const newObj = {
      topic,
      date,
      user1_id: user.id,
      user1_story: myStory,
    };

    const { data, error } = await supabase.from('disagreements').insert(newObj).select().single();
    if (!error && data) {
      setDisagreements([data, ...disagreements]);
      setIsAdding(false);
      setTopic('');
      setMyStory('');
    }
  };

  const submitReply = async (id) => {
    const isUser1 = disagreements.find(d => d.id === id).user1_id === user.id;
    const updateObj = isUser1 ? { user1_story: replyStory } : { user2_id: user.id, user2_story: replyStory };
    
    // Optimistic UI Update
    setDisagreements(disagreements.map(d => d.id === id ? { ...d, ...updateObj } : d));
    
    const { error } = await supabase.from('disagreements').update(updateObj).eq('id', id);
    if (!error) {
       setReplyingTo(null);
       setReplyStory('');
    } else {
       loadDisagreements(); // revert
    }
  };

  const toggleResolve = async (id, currentStatus) => {
    setDisagreements(disagreements.map(d => d.id === id ? { ...d, resolved: !currentStatus } : d));
    await supabase.from('disagreements').update({ resolved: !currentStatus }).eq('id', id);
  };

  const deleteDisagreement = async (id) => {
    setDisagreements(disagreements.filter(d => d.id !== id));
    await supabase.from('disagreements').delete().eq('id', id);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="section-title">
        <h2 style={{ fontSize: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          Reflections
        </h2>
        <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> New Entry
        </button>
      </div>

      <ActivityChart disagreements={disagreements} />

      <div style={{ marginTop: 32 }}>
        {isAdding && (
          <div className="card" style={{ marginBottom: 24, border: '1px solid var(--color-primary)' }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Log a Disagreement</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex-responsive">
                <input 
                  type="text" className="input bg-input" placeholder="What was it about? (e.g. Dishes)" 
                  value={topic} onChange={(e) => setTopic(e.target.value)} required style={{ flex: 2, marginBottom: 0 }}
                />
                <input 
                  type="date" className="input bg-input" 
                  value={date} onChange={(e) => setDate(e.target.value)} required style={{ flex: 1, marginBottom: 0 }}
                />
              </div>
              <textarea 
                 className="input bg-input" 
                 placeholder="Your side of the story... (Be honest, but kind!)"
                 value={myStory} onChange={(e) => setMyStory(e.target.value)} required
                 style={{ minHeight: 100, marginBottom: 0, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setIsAdding(false)} className="btn" style={{ width: 'auto' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>Save Entry</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disagreements.map((d) => {
            const hasMySide = d.user1_id === user.id ? !!d.user1_story : d.user2_id === user.id ? !!d.user2_story : false;
            const hasPartnerSide = d.user1_id !== user.id ? !!d.user1_story : d.user2_id !== user.id && d.user2_id ? !!d.user2_story : false;
            
            return (
              <div key={d.id} className="card" style={{ opacity: d.resolved ? 0.7 : 1, transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                   <div>
                     <h3 style={{ fontSize: 18, fontWeight: 600, color: d.resolved ? 'var(--text-dim)' : 'var(--text-primary)' }}>{d.topic}</h3>
                     <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                     <button 
                       onClick={() => toggleResolve(d.id, d.resolved)}
                       title="Mark as resolved"
                       style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: d.resolved ? 'var(--text-muted)' : 'var(--text-primary)' }}
                     >
                       {d.resolved ? <CheckCircle2 color="var(--color-primary)" size={18} /> : <Circle color="var(--text-dim)" size={18} />}
                       <span style={{ fontSize: 13 }}>{d.resolved ? 'Resolved' : 'Needs Repair'}</span>
                     </button>
                     <button 
                       onClick={() => deleteDisagreement(d.id)}
                       title="Delete entry"
                       style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                </div>

                <div className="grid-responsive">
                   {/* Partner 1 (Creator) */}
                   <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12 }}>
                     <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={12} /> {d.user1_id === user.id ? 'My View' : 'Partner\'s View'}
                     </div>
                     <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                        {d.user1_story}
                     </div>
                   </div>

                   {/* Partner 2 */}
                   <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12 }}>
                     <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '1px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageSquare size={12} /> {d.user1_id !== user.id ? 'My View' : 'Partner\'s View'}
                     </div>
                     
                     {d.user2_story ? (
                       <div style={{ fontSize: 14, lineHeight: 1.5 }}>{d.user2_story}</div>
                     ) : (
                       <div>
                         {d.user1_id !== user.id ? (
                           replyingTo === d.id ? (
                             <div>
                               <textarea 
                                 className="input bg-input" placeholder="Share your perspective gently..." 
                                 value={replyStory} onChange={(e) => setReplyStory(e.target.value)}
                                 style={{ minHeight: 80, marginBottom: 8, padding: 12, fontSize: 13 }}
                               />
                               <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => setReplyingTo(null)} className="btn" style={{ padding: '6px 12px', fontSize: 12 }}>Cancel</button>
                                  <button onClick={() => submitReply(d.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>Save</button>
                               </div>
                             </div>
                           ) : (
                             <button onClick={() => setReplyingTo(d.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13, background: 'rgba(242, 60, 111, 0.1)', color: 'var(--color-primary)' }}>
                               Add Your View
                             </button>
                           )
                         ) : (
                           <div style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic', paddingTop: 8 }}>Waiting for partner...</div>
                         )}
                       </div>
                     )}
                   </div>
                </div>
              </div>
            )
          })}
          
          {disagreements.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)' }}>
              No disagreements logged. That's fantastic! 💖
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Disagreements;
