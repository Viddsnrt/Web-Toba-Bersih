// app/admin/page.tsx
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard'; // sesuaikan path-nya

export default function AdminPage() {
  const [laporanList, setLaporanList] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch laporan
    axios.get('http://localhost:5000/api/admin/laporan', { headers })
      .then(res => setLaporanList(res.data.data || res.data))
      .catch(() => setLaporanList([]));

    // Fetch posts/berita
    axios.get('http://localhost:5000/api/admin/berita', { headers })
      .then(res => setPosts(res.data.data || res.data))
      .catch(() => setPosts([]));
  }, []);

  return <Dashboard laporanList={laporanList} posts={posts} />;
}