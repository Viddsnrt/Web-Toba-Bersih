"use client";
import { useState, useRef } from 'react';
import axios from 'axios';
import {
  Edit, Trash2, Plus, Search, X,
  FolderOpen, Images, ArrowLeft, Image,
  Grid3X3, List, Eye, Upload, Camera
} from 'lucide-react';

interface GalleryPhoto {
  id: number;
  imageUrl: string;
  caption?: string;
  createdAt: string;
}

interface Album {
  id: number;
  title: string;
  description?: string;
  coverUrl?: string;
  photos?: GalleryPhoto[];
  createdAt: string;
}

interface ManageGalleriesProps {
  galleries: Album[];
  onGalleriesUpdate: () => void;
}

interface PhotoItem {
  file: File;
  preview: string;
  url: string;
  uploading: boolean;
  done: boolean;
  error: boolean;
}

export default function ManageGalleries({ galleries, onGalleriesUpdate }: ManageGalleriesProps) {
  const [view, setView] = useState<'albums' | 'album-detail'>('albums');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [albumForm, setAlbumForm] = useState({ title: '', description: '' });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<PhotoItem[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await axios.post('http://localhost:5000/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
    });
    return res.data.imageUrl;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('File harus berupa gambar!');
    if (file.size > 5 * 1024 * 1024) return alert('Maksimal 5MB!');
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    try {
      const url = await uploadFile(file);
      setCoverUrl(url);
    } catch { alert('Gagal upload cover'); }
    finally { setUploadingCover(false); }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => {
      if (!f.type.startsWith('image/')) { alert(`${f.name} bukan gambar`); return false; }
      if (f.size > 5 * 1024 * 1024) { alert(`${f.name} melebihi 5MB`); return false; }
      return true;
    });

    const newItems: PhotoItem[] = validFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      url: '',
      uploading: true,
      done: false,
      error: false,
    }));

    setPhotoFiles(prev => [...prev, ...newItems]);

    newItems.forEach(item => {
      uploadFile(item.file)
        .then(url => {
          setPhotoFiles(prev => prev.map(p =>
            p.preview === item.preview ? { ...p, url, uploading: false, done: true } : p
          ));
        })
        .catch(() => {
          setPhotoFiles(prev => prev.map(p =>
            p.preview === item.preview ? { ...p, uploading: false, error: true } : p
          ));
        });
    });

    e.target.value = '';
  };

  const openAlbumModal = (album: Album | null = null) => {
    setEditingAlbum(album);
    setAlbumForm({ title: album?.title || '', description: album?.description || '' });
    setCoverPreview(album?.coverUrl || null);
    setCoverUrl(album?.coverUrl || '');
    setShowAlbumModal(true);
  };

  const saveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumForm.title) return alert('Judul album wajib diisi!');
    try {
      const data = { ...albumForm, coverUrl };
      if (editingAlbum) {
        await axios.put(`http://localhost:5000/api/galleries/albums/${editingAlbum.id}`, data, authHeader);
        alert('Album berhasil diperbarui!');
      } else {
        await axios.post('http://localhost:5000/api/galleries/albums', data, authHeader);
        alert('Album berhasil dibuat!');
      }
      setShowAlbumModal(false);
      onGalleriesUpdate();
    } catch { alert('Gagal menyimpan album'); }
  };

  const deleteAlbum = async (id: number) => {
    if (!confirm('Hapus album beserta semua fotonya?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/galleries/albums/${id}`, authHeader);
      alert('Album berhasil dihapus!');
      onGalleriesUpdate();
    } catch { alert('Gagal menghapus album'); }
  };

  const openPhotoModal = () => {
    setPhotoFiles([]);
    setShowPhotoModal(true);
  };

  const savePhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    const readyFiles = photoFiles.filter(p => p.done && p.url);
    if (!readyFiles.length) return alert('Pilih minimal 1 foto!');
    if (photoFiles.some(p => p.uploading)) return alert('Tunggu semua foto selesai diupload!');

    setSavingPhotos(true);
    try {
      await Promise.all(
        readyFiles.map(p =>
          axios.post(
            `http://localhost:5000/api/galleries/albums/${selectedAlbum?.id}/photos`,
            { imageUrl: p.url, caption: '' },
            authHeader
          )
        )
      );
      setShowPhotoModal(false);
      setPhotoFiles([]);
      const res = await axios.get(`http://localhost:5000/api/galleries/albums/${selectedAlbum?.id}`, authHeader);
      setSelectedAlbum(res.data);
      onGalleriesUpdate();
      alert(`${readyFiles.length} foto berhasil ditambahkan!`);
    } catch {
      alert('Gagal menambahkan beberapa foto');
    } finally {
      setSavingPhotos(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('Hapus foto ini?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/galleries/photos/${photoId}`, authHeader);
      const res = await axios.get(`http://localhost:5000/api/galleries/albums/${selectedAlbum?.id}`, authHeader);
      setSelectedAlbum(res.data);
      onGalleriesUpdate();
    } catch { alert('Gagal menghapus foto'); }
  };

  const openAlbumDetail = async (album: Album) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/galleries/albums/${album.id}`, authHeader);
      setSelectedAlbum(res.data);
    } catch {
      setSelectedAlbum(album);
    }
    setView('album-detail');
  };

  const filteredAlbums = galleries.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const doneCount = photoFiles.filter(p => p.done).length;
  const uploadingCount = photoFiles.filter(p => p.uploading).length;
  const errorCount = photoFiles.filter(p => p.error).length;

  function renderAlbumModal() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[95vh] overflow-y-auto">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingAlbum ? 'Edit Album' : 'Buat Album Baru'}
            </h3>
            <button onClick={() => setShowAlbumModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={saveAlbum} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Foto Sampul Album</label>
              <div className="relative w-full overflow-hidden rounded-xl bg-gray-100" style={{ paddingBottom: '56.25%' }}>
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {coverUrl && !uploadingCover && (
                      <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        ✓ Terupload
                      </div>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
                          <span className="text-sm font-medium">Mengupload...</span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg hover:bg-black/70 transition-colors font-medium flex items-center gap-1.5"
                    >
                      <Image size={12} /> Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCoverPreview(null); setCoverUrl(''); }}
                      className="absolute top-3 right-3 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-green-500 hover:bg-green-50 transition-all disabled:opacity-50 group"
                  >
                    <div className="w-12 h-12 bg-gray-200 group-hover:bg-green-100 rounded-2xl flex items-center justify-center transition-colors">
                      <Image size={22} />
                    </div>
                    <span className="text-sm font-medium">Upload foto sampul</span>
                    <span className="text-xs text-gray-300">Rasio 16:9 direkomendasikan</span>
                  </button>
                )}
              </div>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Album <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Contoh: Kegiatan Gotong Royong 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
              <textarea
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                placeholder="Deskripsi singkat album..."
              />
            </div>

            <div className="flex gap-3 pt-2 pb-1">
              <button
                type="button"
                onClick={() => setShowAlbumModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
              >
                {editingAlbum ? 'Simpan Perubahan' : 'Buat Album'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'album-detail' && selectedAlbum) {
    const photos = selectedAlbum.photos || [];
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setView('albums')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Kembali
            </button>
            <div className="text-center">
              <h2 className="text-base font-bold text-gray-900">{selectedAlbum.title}</h2>
              <p className="text-xs text-gray-400">{photos.length} foto</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openAlbumModal(selectedAlbum)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={openPhotoModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <Plus size={14} /> Tambah Foto
              </button>
            </div>
          </div>
        </div>

        {selectedAlbum.coverUrl && (
          <div className="relative w-full overflow-hidden bg-gray-900" style={{ paddingBottom: '33%' }}>
            <img
              src={selectedAlbum.coverUrl}
              alt={selectedAlbum.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-5 left-6">
              <h1 className="text-2xl font-black text-white drop-shadow">{selectedAlbum.title}</h1>
              {selectedAlbum.description && (
                <p className="text-white/70 text-sm mt-0.5">{selectedAlbum.description}</p>
              )}
            </div>
          </div>
        )}

        <div className="p-6">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-200 rounded-3xl flex items-center justify-center">
                  <Camera size={40} className="text-green-500" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Plus size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Album Masih Kosong</h3>
              <p className="text-gray-400 text-sm text-center max-w-xs mb-6">
                Mulai tambahkan foto ke album ini untuk mendokumentasikan kegiatan
              </p>
              <button
                onClick={openPhotoModal}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 flex items-center gap-2"
              >
                <Upload size={18} /> Upload Foto Pertama
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-semibold text-gray-800">{photos.length}</span> foto dalam album ini
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`group relative overflow-hidden rounded-xl cursor-pointer bg-gray-100
                      ${index === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}
                    `}
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setLightboxImg(photo.imageUrl)}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=Error'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setLightboxImg(photo.imageUrl)}
                        className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-colors shadow-md"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-1">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}

                <div
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-green-400 hover:text-green-400 hover:bg-green-50 transition-all cursor-pointer group"
                  onClick={openPhotoModal}
                >
                  <Plus size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Tambah</span>
                </div>
              </div>
            </>
          )}
        </div>

        {lightboxImg && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxImg(null)}
          >
            <button className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10">
              <X size={24} />
            </button>
            <img
              src={lightboxImg}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tambah Foto</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ke "{selectedAlbum.title}" — bisa pilih banyak sekaligus</p>
                </div>
                <button onClick={() => { setShowPhotoModal(false); setPhotoFiles([]); }} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={savePhotos} className="p-5 space-y-4">

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-green-400 hover:text-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-green-100 rounded-2xl flex items-center justify-center transition-colors">
                    <Upload size={22} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Klik untuk pilih foto</p>
                    <p className="text-xs mt-0.5">Bisa pilih banyak sekaligus · JPG, PNG, WEBP · maks 5MB/foto</p>
                  </div>
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {photoFiles.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700 font-medium">{photoFiles.length} foto dipilih</span>
                      {uploadingCount > 0 && (
                        <span className="text-orange-500 flex items-center gap-1">
                          <div className="animate-spin w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full" />
                          {uploadingCount} mengupload...
                        </span>
                      )}
                      {uploadingCount === 0 && doneCount > 0 && errorCount === 0 && (
                        <span className="text-green-500 font-medium">✓ Semua siap</span>
                      )}
                      {errorCount > 0 && (
                        <span className="text-red-500">{errorCount} gagal</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoFiles([])}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus semua
                    </button>
                  </div>
                )}

                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {photoFiles.map((item, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                        <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        {item.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                          </div>
                        )}
                        {item.error && (
                          <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                            <X size={20} className="text-white" />
                          </div>
                        )}
                        {item.done && (
                          <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                        {!item.uploading && (
                          <button
                            type="button"
                            onClick={() => setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-green-400 hover:text-green-400 hover:bg-green-50 transition-all group"
                    >
                      <Plus size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-xs">Tambah</span>
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => { setShowPhotoModal(false); setPhotoFiles([]); }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={doneCount === 0 || savingPhotos || uploadingCount > 0}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingPhotos ? (
                      <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Menyimpan...</>
                    ) : (
                      <><Upload size={16} /> Tambahkan {doneCount > 0 ? `${doneCount} ` : ''}Foto</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAlbumModal && renderAlbumModal()}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kelola Galeri</h2>
          <p className="text-sm text-gray-500 mt-0.5">{galleries.length} album tersedia</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari album..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-56 text-sm"
            />
          </div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => openAlbumModal()}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-sm shadow-green-200"
          >
            <Plus size={16} /> Buat Album
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
            <FolderOpen size={20} />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{galleries.length}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Total Album</p>
            <p className="text-xs text-gray-400 mt-0.5">Album tersedia</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
            <Images size={20} />
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {galleries.reduce((acc, g) => acc + (g.photos?.length || 0), 0)}
            </p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">Total Foto</p>
            <p className="text-xs text-gray-400 mt-0.5">Foto di semua album</p>
          </div>
        </div>
      </div>

      {filteredAlbums.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={36} className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-lg">Belum ada album</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Buat album pertama untuk mulai mengorganisir foto</p>
          <button
            onClick={() => openAlbumModal()}
            className="bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} /> Buat Album Pertama
          </button>
        </div>

      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              onClick={() => openAlbumDetail(album)}
            >
              <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200" style={{ paddingBottom: '56.25%' }}>
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Images size={36} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                  <Image size={9} /> {album.photos?.length || 0} foto
                </div>
                {album.photos && album.photos.length > 1 && (
                  <div className="absolute bottom-2 left-2 right-2 hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {album.photos.slice(0, 4).map((img, i) => (
                      <img key={i} src={img.imageUrl} className="h-7 w-7 rounded object-cover border border-white/50" alt="" />
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 line-clamp-1 mb-0.5">{album.title}</h3>
                {album.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{album.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(album.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="border-t border-gray-100 flex" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openAlbumModal(album)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                >
                  <Edit size={14} /> Edit
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => openAlbumDetail(album)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors font-medium"
                >
                  <FolderOpen size={14} /> Buka
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => deleteAlbum(album.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>

      ) : (
        <div className="space-y-2">
          {filteredAlbums.map((album) => (
            <div
              key={album.id}
              className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all group cursor-pointer"
              onClick={() => openAlbumDetail(album)}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Images size={20} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{album.title}</h3>
                {album.description && (
                  <p className="text-xs text-gray-500 truncate">{album.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {album.photos?.length || 0} foto · {new Date(album.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => openAlbumModal(album)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => openAlbumDetail(album)} className="p-2.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors">
                  <FolderOpen size={16} />
                </button>
                <button onClick={() => deleteAlbum(album.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAlbumModal && renderAlbumModal()}
    </div>
  );
}