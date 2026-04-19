import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EMOJIS = [{ icon: '☀️', label: 'Radiant' }, { icon: '🌙', label: 'Peaceful' }, { icon: '🌧️', label: 'Sad' }, { icon: '🔥', label: 'Angry' }, { icon: '💖', label: 'Loved' }];

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [relationship, setRelationship] = useState(null);
  const [myMood, setMyMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [distance, setDistance] = useState(null);
  const [memory, setMemory] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Relationship
      const { data: relData } = await supabase.from('relationship').select('*').limit(1).single();
      if (relData) setRelationship(relData);

      // 2. Moods
      const today = new Date().toISOString().split('T')[0];
      const { data: moodsData } = await supabase.from('moods').select('*').eq('date', today);
      if (moodsData) {
        setMyMood(moodsData.find(m => m.user_id === user.id) || null);
        if (profile?.partner_id) {
          setPartnerMood(moodsData.find(m => m.user_id === profile.partner_id) || null);
        }
      }

      // 3. Partner Profile & Distance
      if (profile?.partner_id) {
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', profile.partner_id).single();
        if (pData) {
           setPartnerProfile(pData);
           if (profile.lat && profile.lng && pData.lat && pData.lng) {
             setDistance(calculateDistance(profile.lat, profile.lng, pData.lat, pData.lng).toFixed(1));
           }
        }
      }

      // 4. Memory
      const { data: memData } = await supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(1).single();
      if (memData) setMemory(memData);

      // 5. Tasks (Optional placeholder logic if tables don't exist yet, we'll silently fail)
      const { data: taskData, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(3);
      if (!taskErr && taskData) setTasks(taskData);

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 0.621371; // Return in Miles to match screenshot
  };

  const selectMood = async (moodObj) => {
    const today = new Date().toISOString().split('T')[0];
    const newMood = { mood: moodObj.icon, label: moodObj.label };
    setMyMood({ ...myMood, ...newMood });
    await supabase.from('moods').upsert({ user_id: user.id, mood: JSON.stringify(newMood), date: today }, { onConflict: 'user_id,date' });
  };

  // Calculations
  const startDate = relationship?.anniversary_date ? new Date(relationship.anniversary_date) : new Date('2020-09-12');
  const daysTogether = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
  
  // Fake Next Milestone Logic for UI display
  const nextAnno = new Date(startDate);
  nextAnno.setFullYear(new Date().getFullYear());
  if (nextAnno < new Date()) nextAnno.setFullYear(new Date().getFullYear() + 1);
  const diffTime = Math.abs(nextAnno - new Date());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHrs = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
  const diffMins = Math.floor((diffTime / 1000 / 60) % 60);

  const formatMood = (moodRecord) => {
    if (!moodRecord) return { icon: '🫥', label: 'Unknown' };
    try {
      const parsed = JSON.parse(moodRecord.mood);
      return parsed.icon ? parsed : { icon: moodRecord.mood, label: 'Feeling' };
    } catch {
      return { icon: moodRecord.mood, label: 'Feeling' };
    }
  };

  const myState = formatMood(myMood);
  const pState = formatMood(partnerMood);

  return (
    <>
      <div className="top-bar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#453c48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>P</div>
           <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff306e', marginLeft: '-12px', border: '2px solid var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>U</div>
           <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#fff', marginLeft: '8px', cursor: 'pointer' }}><Plus size={16}/></button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-sidebar)', overflow: 'hidden', position: 'relative', zIndex: 1, border: '4px solid var(--bg-main)' }}>
             <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent"} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-card-highlight)', overflow: 'hidden', marginLeft: '-30px', position: 'relative', zIndex: 2, border: '4px solid var(--bg-main)' }}>
             <img src={partnerProfile?.avatar_url || "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=transparent"} alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
        
        <h1 style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-2px', lineHeight: 1 }}>{daysTogether.toLocaleString()}</h1>
        <div style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, letterSpacing: '1px', marginTop: 8, textTransform: 'uppercase' }}>Days Together</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14, marginTop: 16 }}>Since {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>Forever to go ∞</div>
      </div>

      <div className="dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="left-column">
          
          {/* Milestone Card */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(235, 64, 107, 0.15) 0%, var(--bg-card) 60%)' }}>
            <div style={{ color: 'var(--color-primary)', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Next Milestone</div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Anniversary</h2>
            
            <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{diffDays}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 4 }}>DAYS</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{diffHrs.toString().padStart(2, '0')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 4 }}>HRS</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{diffMins.toString().padStart(2, '0')}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '1px', marginTop: 4 }}>MIN</div>
              </div>
            </div>

            <div style={{ height: 6, background: 'var(--bg-card-highlight)', borderRadius: 3, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '92%', background: 'var(--color-primary)', borderRadius: 3 }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginTop: 8 }}>92% there</div>
          </div>

          {/* Latest Memory */}
          <div>
            <div className="section-title">
              <span>Latest Memory</span>
              <Link to="/gallery" className="section-link">Timeline</Link>
            </div>
            <div className="card" style={{ padding: 0, height: 260 }}>
              {memory ? (
                <img src={memory.url} alt="Memory" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom right, #f4b486, #f3d49f)', position: 'relative' }}>
                   <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: 'white' }}>NEW</div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          
          <div className="section-title">
            <span>Daily Mood</span>
            <span style={{ fontSize: 11, color: 'var(--color-primary)', fontWeight: 500 }}>Updated 2h ago</span>
          </div>

          {/* Mood Grid */}
          <div className="grid-responsive">
            
            {/* My Mood */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-sidebar)', position: 'relative', marginBottom: 16 }}>
                 <img src={profile?.avatar_url || "https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent"} alt="Mine" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                 <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--bg-card)', borderRadius: '50%', padding: 2 }}>
                   <div style={{ background: '#f5b597', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{myState.icon}</div>
                 </div>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '1px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>MY FEELING</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{myState.label}</div>
              
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {EMOJIS.slice(0,3).map(e => (
                   <button key={e.label} onClick={() => selectMood(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>{e.icon}</button>
                ))}
              </div>
            </div>

            {/* Partner Mood */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-sidebar)', position: 'relative', marginBottom: 16 }}>
                 <img src={partnerProfile?.avatar_url || "https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=transparent"} alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                 <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--bg-card)', borderRadius: '50%', padding: 2 }}>
                   <div style={{ background: '#4a6fa5', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{pState.icon}</div>
                 </div>
              </div>
              <div style={{ fontSize: 10, letterSpacing: '1px', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>PARTNER'S FEELING</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{pState.label}</div>
            </div>

          </div>

          {/* Distance */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(228, 71, 108, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin color="var(--color-primary)" size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                {distance ? `${distance} miles apart` : 'Location unknown'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Last updated 5 mins ago
              </div>
            </div>
            <div style={{ marginLeft: 'auto', width: 32, height: 32, background: 'var(--bg-card-highlight)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M12 2L22 20H2L12 2Z"/></svg>
            </div>
          </div>

          {/* Today's Tasks */}
          <div>
            <div className="section-title">
              <span>Today's Tasks</span>
              <Link to="/tasks" className="section-link">View all</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.length > 0 ? tasks.map(t => (
                <div key={t.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {t.completed ? <CheckCircle2 color="var(--color-primary)" size={20} /> : <Circle color="var(--text-dim)" size={20} />}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Assigned to {t.assigned_to === user.id ? 'Me' : 'Partner'}</div>
                  </div>
                </div>
              )) : (
                <>
                  <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid var(--color-primary)' }}></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>Book dinner for Friday</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Assigned to H</div>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <CheckCircle2 color="white" size={12} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, textDecoration: 'line-through', color: 'var(--text-muted)' }}>Grocery run for weekend</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Assigned to K</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Dashboard;
