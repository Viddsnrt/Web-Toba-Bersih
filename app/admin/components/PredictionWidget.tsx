// 'use client';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { TrendingUp, AlertCircle, Loader } from 'lucide-react';

// interface PredictionData {
//   date: string;
//   predicted_volume_kg: number;
//   confidence: string;
//   model_accuracy: number;
// }

// export default function PredictionWidget() {
//   const [prediction, setPrediction] = useState<PredictionData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchPrediction();
//   }, []);

//   const fetchPrediction = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get('http://localhost:5000/ai/predict-waste');
      
//       if (res.data.success) {
//         setPrediction(res.data.data.prediction);
//         setError(null);
//       }
//     } catch (err: any) {
//       console.error('Prediction Error:', err);
//       setError(err.response?.data?.error || 'Gagal mengambil prediksi');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 flex items-center justify-center">
//         <Loader className="animate-spin text-blue-500" size={24} />
//         <span className="ml-3 text-slate-600">Loading prediksi...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white p-8 rounded-[30px] shadow-sm border border-red-200 flex items-start gap-4">
//         <AlertCircle className="text-red-500 mt-1" size={24} />
//         <div>
//           <h3 className="font-bold text-slate-800">AI Engine Offline</h3>
//           <p className="text-sm text-slate-600">{error}</p>
//           <button 
//             onClick={fetchPrediction}
//             className="mt-2 text-blue-600 text-sm font-semibold hover:underline"
//           >
//             Coba Lagi
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[30px] shadow-sm border border-blue-200">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-bold text-slate-800">Prediksi Sampah Besok</h3>
//         <TrendingUp className="text-blue-600" size={24} />
//       </div>

//       {prediction && (
//         <div className="space-y-3">
//           <div className="flex justify-between items-center">
//             <span className="text-slate-600">Tanggal</span>
//             <span className="font-semibold text-slate-800">{prediction.date}</span>
//           </div>
          
//           <div className="flex justify-between items-center">
//             <span className="text-slate-600">Volume Prediksi</span>
//             <span className="text-2xl font-black text-blue-600">
//               {prediction.predicted_volume_kg} kg
//             </span>
//           </div>

//           <div className="flex justify-between items-center">
//             <span className="text-slate-600">Confidence</span>
//             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
//               {prediction.confidence}
//             </span>
//           </div>

//           <div className="flex justify-between items-center pt-3 border-t border-blue-200">
//             <span className="text-slate-600">Model Accuracy</span>
//             <span className="font-semibold text-slate-800">{prediction.model_accuracy}%</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }