import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Send } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (name)
        `)
        .order('created_at', { ascending: false });
        
      if (data) setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ text: newMessage, sender_id: user.id }]);
        
      if (!error) setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 800, margin: '0 auto' }}>
      
      <div className="section-title">
        <h2>Chat Timeline</h2>
      </div>

      <div className="card" style={{ padding: '16px', marginBottom: 24 }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            className="input bg-input"
            style={{ marginBottom: 0, flex: 1 }}
            placeholder="Send a loving message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={18} />
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
        {loading ? (
           <p className="text-dim" style={{ textAlign: 'center' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-dim" style={{ textAlign: 'center', marginTop: 40 }}>No messages yet. Say hello!</p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user.id;
            return (
              <div 
                key={msg.id} 
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  background: isMine ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: isMine ? '#fff' : 'var(--text-primary)',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  borderBottomRightRadius: isMine ? '4px' : '16px',
                  borderBottomLeftRadius: isMine ? '16px' : '4px',
                  maxWidth: '75%',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {!isMine && <div className="text-dim" style={{ fontSize: 11, marginBottom: 8 }}>{msg.profiles?.name || 'Partner'}</div>}
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.text}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 12, textAlign: isMine ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Messages;
