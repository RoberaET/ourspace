import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { ImagePlus } from 'lucide-react';

const Gallery = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (data) setPhotos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (e) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from('photos').insert([
        { url: data.publicUrl, uploaded_by: user.id }
      ]);
      
      if (dbError) throw dbError;

      fetchPhotos(); // Refresh gallery
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
        <div>
          <h2 style={{ fontSize: 18, color: '#db7093', fontWeight: 600 }}>Our Memories</h2>
          <p style={{ fontSize: 12, color: '#888' }}>Upload moments to remember</p>
        </div>
        
        <label className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 16px', borderRadius: '12px' }}>
           {uploading ? '...' : <><ImagePlus size={18} /> Add</>}
           <input type="file" style={{ display: 'none' }} accept="image/*" onChange={uploadPhoto} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Loading memories...</p>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          <ImagePlus size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p>Your gallery is empty.<br/>Upload your first memory together!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {photos.map(photo => (
            <div 
              key={photo.id} 
              style={{ 
                aspectRatio: '1/1', 
                borderRadius: '16px', 
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: '#eee'
              }}
            >
              <img 
                src={photo.url} 
                alt="Memory" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Gallery;
