import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, LogOut, Copy, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const { user, profile } = useAuth();
  const [partnerId, setPartnerId] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [lastDisagreement, setLastDisagreement] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile?.partner_id) setPartnerId(profile.partner_id);
    loadRelationship();
  }, [profile]);

  const loadRelationship = async () => {
    const { data } = await supabase.from('relationship').select('*').limit(1).single();
    if (data) {
      if (data.anniversary_date) setAnniversary(data.anniversary_date);
      if (data.last_disagreement_date) setLastDisagreement(data.last_disagreement_date);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update partner ID
      if (partnerId && partnerId !== profile?.partner_id) {
        await supabase.from('profiles').update({ partner_id: partnerId }).eq('id', user.id);
      }

      // Update relationship dates
      const { data: relExists } = await supabase.from('relationship').select('id').limit(1).single();
      
      const relData = { 
        anniversary_date: anniversary || null, 
        last_disagreement_date: lastDisagreement || null 
      };

      if (relExists) {
        await supabase.from('relationship').update(relData).eq('id', relExists.id);
      } else {
        await supabase.from('relationship').insert([relData]);
      }

      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div style={{ paddingBottom: 20, maxWidth: 800, margin: '0 auto' }}>
      <div className="section-title" style={{ marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SettingsIcon className="text-pink" /> Preferences</h2>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 12, fontWeight: 600 }}>Link with Partner</div>
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 16 }}>
          Your ID: Share this with your partner so they can link with you.
        </p>
        <div style={{ display: 'flex', background: 'var(--bg-card-highlight)', padding: '12px 16px', borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{user?.id}</span>
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {copied ? <CheckCircle2 size={18} color="var(--color-primary)" /> : <Copy size={18} color="var(--text-dim)" />}
          </button>
        </div>

        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Partner's ID</p>
        <input 
          type="text" 
          className="input" 
          placeholder="Paste partner's ID here..." 
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
        />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16, fontWeight: 600 }}>Relationship Details</div>
        
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Anniversary Date</p>
        <input 
          type="date" 
          className="input" 
          value={anniversary}
          onChange={(e) => setAnniversary(e.target.value)}
        />

        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Last Disagreement (Optional Reflection)</p>
        <input 
          type="date" 
          className="input" 
          value={lastDisagreement}
          onChange={(e) => setLastDisagreement(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" onClick={saveSettings} disabled={loading} style={{ marginBottom: 24, padding: 16, fontSize: 16 }}>
        {loading ? 'Saving...' : 'Save Settings'}
      </button>

      <button className="btn" onClick={handleSignOut} style={{ color: 'var(--color-primary)', borderColor: 'rgba(242, 60, 111, 0.2)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <LogOut size={18} /> Sign Out
        </div>
      </button>

    </div>
  );
};

export default Settings;
