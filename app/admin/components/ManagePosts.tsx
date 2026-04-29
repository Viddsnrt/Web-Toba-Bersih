"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Edit, Trash2, Plus, Search, Calendar, User } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ManagePostsProps {
  posts: any[];
  onPostsUpdate: () => void;
}

export default function ManagePosts({ posts, onPostsUpdate }: ManagePostsProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    category: 'BERITA',
    imageUrl: '',
    author_id: 1
  });

  // Cek token saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token di ManagePosts:', token ? 'Ada' : 'Tidak ada');
    if (!token) {
      setError('Anda belum login. Silakan refresh halaman atau login ulang.');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  };

  const openModal = (post: any = null) => {
    // Cek token sebelum membuka modal
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesi Anda telah berakhir. Silakan login ulang.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
      return;
    }

    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        category: post.category || 'BERITA',
        imageUrl: post.imageUrl || '',
        author_id: post.authorId || 1
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        category: 'BERITA',
        imageUrl: '',
        author_id: 1
      });
    }
    setError(null);
    setShowModal(true);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Judul tidak boleh kosong');
      return false;
    }
    if (!formData.content.trim()) {
      setError('Konten tidak boleh kosong');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Cek token lagi sebelum submit
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesi Anda telah berakhir. Silakan login ulang.');
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 2000);
      return;
    }

    setLoading(true);
    setError(null);

    // Generate slug from title if not provided
    const generatedSlug = formData.slug || generateSlug(formData.title);
    
    const dataToSend = {
      title: formData.title.trim(),
      slug: generatedSlug,
      content: formData.content.trim(),
      category: formData.category,
      imageUrl: formData.imageUrl || null,
      author_id: formData.author_id
    };

    console.log('Mengirim data dengan token:', token.substring(0, 20) + '...');
    console.log('Data yang dikirim:', dataToSend);

    try {
      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response;
      if (editingPost) {
        response = await axios.put(
          `${API_BASE_URL}/posts/${editingPost.id}`, 
          dataToSend, 
          config
        );
        console.log('Update response:', response.data);
        toast.success('Berita berhasil diperbarui!');
      } else {
        response = await axios.post(
          `${API_BASE_URL}/posts`, 
          dataToSend, 
          config
        );
        console.log('Create response:', response.data);
        toast.success('Berita berhasil ditambahkan!');
      }
      
      setShowModal(false);
      setEditingPost(null);
      onPostsUpdate();
      
    } catch (error: any) {
      console.error('Error saving post:', error);
      
      if (error.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login ulang.');
        // Hapus token yang tidak valid
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        setError('Anda tidak memiliki izin untuk melakukan ini.');
      } else if (error.response) {
        setError(`Gagal menyimpan: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Tidak ada response dari server. Periksa koneksi Anda.');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus berita ini?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Sesi Anda telah berakhir. Silakan login ulang.');
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Berita berhasil dihapus!');
      onPostsUpdate();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      if (error.response?.status === 401) {
        setError('Sesi Anda telah berakhir. Silakan login ulang.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else {
        const deleteMessage = error.response?.data?.message || 'Gagal menghapus berita';
        toast.error(deleteMessage);
      }
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tampilkan pesan error jika token tidak ada
  if (error && error.includes('belum login')) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button
          onClick={() => window.location.href = '/admin/login'}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
        >
          Login Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kelola Berita Homepage</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari berita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => openModal()}
            className="bg-[#064E3B] hover:bg-[#053f30] text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Tambah Berita</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Belum ada berita. Silakan tambah berita baru.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map((post: any) => (
            <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image */}
                {post.imageUrl && (
                  <div className="md:w-48 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString('id-ID') : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {post.author?.fullName || 'Admin'}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {post.category}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{post.content}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(post)}
                        className="p-2 text-white-300 bg-blue-500 rounded-lg transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-white-300 bg-red-600 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[32px] bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingPost ? 'Edit Berita' : 'Tambah Berita'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Isi formulir untuk {editingPost ? 'memperbarui' : 'menambahkan'} berita.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowModal(false); setError(null); setEditingPost(null); }}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              {error && (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Judul Berita
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Masukkan judul berita"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                    required
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Slug (opsional)
                  <input
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="slug-berita"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Kategori
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                  >
                    <option value="BERITA">BERITA</option>
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                    <option value="UPDATE">UPDATE</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  Gambar (URL)
                  <input
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Konten Berita
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="Tulis isi berita di sini..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-relaxed outline-none transition focus:border-green-500 focus:bg-white"
                  required
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(null); setEditingPost(null); }}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-[#064E3B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#053f30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (editingPost ? 'Menyimpan...' : 'Menyimpan...') : (editingPost ? 'Perbarui Berita' : 'Simpan Berita')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toaster position="top-right" />
    </div>
  );
}