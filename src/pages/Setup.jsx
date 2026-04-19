import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Copy, CheckCircle2, ChevronRight, Heart } from 'lucide-react';

const Setup = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form State
  const [partnerCode, setPartnerCode] = useState('');
  const [age, setAge] = useState('');
  const [locationName, setLocationName] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [mood, setMood] = useState(null);

  const EMOJIS = [
    { icon: '☀️', label: 'Radiant' }, 
    { icon: '🌙', label: 'Peaceful' }, 
    { icon: '💖', label: 'Loved' },
    { icon: '🦋', label: 'Excited' }
  ];

  useEffect(() => {
    // If somehow a profile lacks an invite code, generate one now
    if (profile && !profile.invite_code) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      supabase.from('profiles').update({ invite_code: code }).eq('id', user.id).then(() => {
        refreshProfile();
      });
    }
  }, [profile]);

  if (!profile) return null; // wait for profile load

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePartnerSubmit = async (e) => {
    e.preventDefault();
    if (!partnerCode.trim()) {
      setStep(2); // Skip pairing for now
      return; 
    }
    
    setLoading(true);
    try {
      const { data: partnerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('invite_code', partnerCode.trim().toUpperCase())
        .single();

      if (!partnerData) {
        alert("Invite code not found! Please check and try again.");
        setLoading(false);
        return;
      }

      // Mutually set partner_id
      await supabase.from('profiles').update({ partner_id: partnerData.id }).eq('id', user.id);
      await supabase.from('profiles').update({ partner_id: user.id }).eq('id', partnerData.id);
      
      // Attempt to link or create relationship DB row
      const { data: relExists } = await supabase.from('relationship').select('*').or(`user1.eq.${user.id},user1.eq.${partnerData.id}`).limit(1).single();
      if (!relExists) {
         // Create stub relationship row
         await supabase.from('relationship').insert({ user1: user.id, user2: partnerData.id });
      }

      refreshProfile();
      setStep(2);
    } catch (err) {
      alert("Error linking with partner. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('profiles').update({ 
      age: age ? parseInt(age) : null,
      location_name: locationName.trim()
    }).eq('id', user.id);
    setLoading(false);
    setStep(3);
  };

  const handleRelationshipSubmit = async (e) => {
    e.preventDefault();
    if (anniversaryDate) {
      setLoading(true);
      const { data: relData } = await supabase.from('relationship').select('id').limit(1).single();
      if (relData) {
        await supabase.from('relationship').update({ anniversary_date: anniversaryDate }).eq('id', relData.id);
      } else {
        await supabase.from('relationship').insert({ anniversary_date: anniversaryDate });
      }
      setLoading(false);
    }
    setStep(4);
  };

  const handleFinish = async () => {
    setLoading(true);
    
    if (mood) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('moods').upsert(
        { user_id: user.id, date: today, mood: JSON.stringify(mood) }, 
        { onConflict: 'user_id,date' }
      );
    }

    // Set onboarded true
    await supabase.from('profiles').update({ onboarded: true }).eq('id', user.id);
    
    // Refresh to trigger re-route in ProtectedRoute
    refreshProfile(); 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ background: 'var(--color-primary)', width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <Heart color="white" fill="white" size={24} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Setting up your Space</h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ width: 40, height: 4, borderRadius: 2, background: s <= step ? 'var(--color-primary)' : 'var(--bg-card-highlight)' }} />
          ))}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 450, width: '100%', padding: '40px 32px' }}>
        
        {step === 1 && (
          <form onSubmit={handlePartnerSubmit}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Link with Partner</h3>
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              Share your invite code with your partner, or enter theirs below.
            </p>

            <div style={{ background: 'var(--bg-card-highlight)', padding: '16px', borderRadius: 12, marginBottom: 32 }}>
               <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Your Invite Code</div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '2px', color: 'var(--color-primary)' }}>
                   {profile.invite_code || '------'}
                 </span>
                 <button type="button" onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                   {copied ? <CheckCircle2 size={20} color="var(--color-primary)" /> : <Copy size={20} color="var(--text-dim)" />}
                 </button>
               </div>
            </div>

            <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Partner's Invite Code</p>
            <input 
              type="text" 
              className="input" 
              style={{ textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', fontSize: 18 }}
              placeholder="e.g. 8X9A2L" 
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              maxLength={6}
            />

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
              {loading ? 'Linking...' : partnerCode ? 'Link Account' : 'Skip for Now'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePersonalSubmit}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>About You</h3>
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 24 }}>Let's personalize your dashboard experience.</p>
            
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Your Age</p>
            <input 
              type="number" 
              className="input bg-input" 
              placeholder="e.g. 24" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
            
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Where do you live?</p>
            <input 
              type="text" 
              className="input bg-input" 
              placeholder="e.g. New York, NY" 
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              {loading ? 'Saving...' : 'Next Step'} <ChevronRight size={16} />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRelationshipSubmit}>
             <h3 style={{ fontSize: 20, marginBottom: 8 }}>Relationship Dates</h3>
             <p className="text-dim" style={{ fontSize: 13, marginBottom: 24 }}>When did the magic happen?</p>

             <p className="text-dim" style={{ fontSize: 13, marginBottom: 8 }}>Anniversary Date</p>
             <input 
              type="date" 
              className="input bg-input"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
              {loading ? 'Saving...' : 'Next Step'} <ChevronRight size={16} />
            </button>
          </form>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: 20, marginBottom: 8, textAlign: 'center' }}>Vibe Check</h3>
            <p className="text-dim" style={{ fontSize: 13, marginBottom: 24, textAlign: 'center' }}>How are you feeling right now?</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
               {EMOJIS.map(e => (
                 <button 
                  key={e.label} 
                  type="button"
                  onClick={() => setMood(e)}
                  style={{ 
                    padding: '24px 16px', 
                    borderRadius: 16, 
                    border: mood?.label === e.label ? '2px solid var(--color-primary)' : '2px solid transparent',
                    background: 'var(--bg-card-highlight)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    color: 'white',
                    fontFamily: 'inherit'
                  }}>
                    <span style={{ fontSize: 28 }}>{e.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{e.label}</span>
                 </button>
               ))}
            </div>

            <button onClick={handleFinish} className="btn btn-primary" disabled={loading || !mood} style={{ padding: 16, fontSize: 16 }}>
              {loading ? 'Entering...' : 'Enter Our Space'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Setup;
