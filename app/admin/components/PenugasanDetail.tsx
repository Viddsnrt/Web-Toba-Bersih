"use client";
import { X, MapPin, Calendar, User, Truck, FileText, Image as ImageIcon } from 'lucide-react';

interface PenugasanDetailProps {
  penugasan: any;
  onClose: () => void;
}

export default function PenugasanDetail({ penugasan, onClose }: PenugasanDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Detail Penugasan - {penugasan.taskNumber}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              penugasan.status === 'SELESAI' ? 'bg-green-100 text-green-800' :
              penugasan.status === 'DITUGASKAN' ? 'bg-yellow-100 text-yellow-800' :
              penugasan.status === 'DITERIMA' ? 'bg-blue-100 text-blue-800' :
              penugasan.status === 'DALAM_PERJALANAN' ? 'bg-purple-100 text-purple-800' :
              penugasan.status === 'TIBA' ? 'bg-indigo-100 text-indigo-800' :
              penugasan.status === 'BEKERJA' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {penugasan.status}
            </span>
          </div>

          {/* Info Umum */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="text-gray-400 mt-1" size={18} />
              <div>
                <p className="font-medium text-gray-900">{penugasan.location}</p>
                <p className="text-sm text-gray-500">Kec. {penugasan.district}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-gray-400" size={18} />
              <span className="text-sm">
                {new Date(penugasan.scheduledAt).toLocaleString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Supir & Truk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-green-600" />
                <span className="font-medium">Supir</span>
              </div>
              <p className="text-lg font-semibold">{penugasan.driver?.fullName}</p>
              <p className="text-sm text-gray-500">{penugasan.driver?.phoneNumber}</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={16} className="text-green-600" />
                <span className="font-medium">Truk</span>
              </div>
              {penugasan.truck ? (
                <>
                  <p className="text-lg font-semibold">{penugasan.truck.plateNumber}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Tidak menggunakan truk</p>
              )}
            </div>
          </div>

          {/* Deskripsi */}
          {penugasan.description && (
            <div>
              <h4 className="font-medium mb-2">Deskripsi</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {penugasan.description}
              </p>
            </div>
          )}

          {/* Foto Bukti (jika ada) */}
          {penugasan.photos && penugasan.photos.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Foto Bukti</h4>
              <div className="grid grid-cols-3 gap-2">
                {penugasan.photos.map((photo: any) => (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt="Bukti"
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Volume (jika ada) */}
          {penugasan.volumeKg && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Volume Sampah</p>
              <p className="text-2xl font-bold text-green-800">{penugasan.volumeKg} KG</p>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Timeline</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ditugaskan:</span>
                <span>{new Date(penugasan.createdAt).toLocaleString()}</span>
              </div>
              {penugasan.startedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Diterima:</span>
                  <span>{new Date(penugasan.startedAt).toLocaleString()}</span>
                </div>
              )}
              {penugasan.completedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Selesai:</span>
                  <span>{new Date(penugasan.completedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}