import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';
import StyleCard from './components/StyleCard';
import StyleForm from './components/StyleForm';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStyle, setEditingStyle] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchStyles();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStyles();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
  };

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setStyles(data || []);
    } catch (error) {
      console.error('Error fetching styles:', error);
      alert('Stiller yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (!formData.id) {
        // Create (New Style)
        // Remove 'id' so Supabase generates a new UUID
        const { id, ...newStyle } = formData;

        const { error } = await supabase
          .from('styles')
          .insert([newStyle]);
        if (error) throw error;
      } else {
        // Update (Existing Style)
        const { error } = await supabase
          .from('styles')
          .update(formData)
          .eq('id', formData.id);
        if (error) throw error;
      }

      await fetchStyles();
      setIsFormOpen(false);
      setEditingStyle(null);
    } catch (error) {
      console.error('Error saving style:', error);
      alert('Kaydedilirken hata oluştu: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu stili silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('styles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStyles();
    } catch (error) {
      console.error('Error deleting style:', error);
      alert('Silinirken hata oluştu: ' + error.message);
    }
  };

  const filteredStyles = styles.filter(style =>
    style.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    style.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="logo">🎨</span>
            <h1 className="text-xl font-bold text-slate-900">Satrayni Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Stil ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <button
              onClick={() => {
                setEditingStyle(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm shadow-blue-200"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Yeni Stil</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStyles.map(style => (
              <StyleCard
                key={style.id}
                style={style}
                onEdit={(s) => {
                  setEditingStyle(s);
                  setIsFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {!loading && filteredStyles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Stil bulunamadı.</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {isFormOpen && (
        <StyleForm
          style={editingStyle}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default App;
