"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Dashboard from "../components/Dashboard";

export default function DashboardPage() {
  const [laporanList, setLaporanList] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [laporanRes, postsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/laporan", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/posts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setLaporanList(laporanRes.data.data || []);
      setPosts(postsRes.data.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return <Dashboard laporanList={laporanList} posts={posts} />;
}