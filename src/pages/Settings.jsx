import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, LogOut, Copy, CheckCircle2, Camera } from 'lucide-react';

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  // Profile State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [locationName, setLocationName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Relationship State
  const [partnerId, setPartnerId] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [lastDisagreement, setLastDisagreement] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age || '');
      setLocationName(profile.location_name || '');
      setPreviewUrl(profile.avatar_url || '');
      if (profile.partner_id) setPartnerId(profile.partner_id);
    }
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalAvatarUrl = profile?.avatar_url;

      // Handle Avatar Upload
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('gallery').upload(fileName, avatarFile);
        if (!uploadError) {
          const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
          finalAvatarUrl = data.publicUrl;
        } else {
          console.error("Avatar upload failed:", uploadError);
        }
      }

      // Update Profile Details
      await supabase.from('profiles').update({ 
        name,
        age: age ? parseInt(age) : null,
        location_name: locationName,
        partner_id: partnerId || null,
        avatar_url: finalAvatarUrl
      }).eq('id', user.id);

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

      // Refresh global context so the whole app updates instantly
      refreshProfile();

      alert("Settings and Profile saved successfully!");
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

      {/* PROFILE EDITOR */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 24, fontWeight: 600 }}>My Profile</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
           <div 
             style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-main)', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--color-primary)' }}
             onClick={() => fileInputRef.current?.click()}
           >
             {previewUrl ? (
                <img src={previewUrl} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                  <Camera size={32} />
                </div>
             )}
             <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', textAlign: 'center', padding: '4px 0', fontSize: 10 }}>EDIT</div>
           </div>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        </div>

        <div className="flex-responsive" style={{ marginBottom: 16 }}>
          <div style={{ flex: 2 }}>
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Name / Nickname</p>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Age</p>
            <input type="number" className="input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 24" />
          </div>
        </div>

        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Living Place</p>
        <input type="text" className="input" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. New York, USA" />

      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 16, fontWeight: 600 }}>Relationship Details</div>
        
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Anniversary Date</p>
        <input type="date" className="input" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ marginBottom: 12, fontWeight: 600 }}>Sync Account (Manual Override)</div>
        <p className="text-dim" style={{ fontSize: 13, marginBottom: 16 }}>
          If invite codes failed, you can manually force link accounts using UUIDs.
        </p>
        <div style={{ display: 'flex', background: 'var(--bg-card-highlight)', padding: '12px 16px', borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{user?.id}</span>
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {copied ? <CheckCircle2 size={18} color="var(--color-primary)" /> : <Copy size={18} color="var(--text-dim)" />}
          </button>
        </div>

        <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Partner's Exact ID</p>
        <input type="text" className="input" placeholder="Paste partner's UUID here..." value={partnerId} onChange={(e) => setPartnerId(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={saveSettings} disabled={loading} style={{ marginBottom: 24, padding: 16, fontSize: 16 }}>
        {loading ? 'Saving...' : 'Save All Settings'}
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
