import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Image as ImageIcon, CheckCircle, Copy, Navigation, Trash2, ArrowRight } from 'lucide-react';

function SubmitComplaint() {
  const [formData, setFormData] = useState({
    citizen_name: '',
    citizen_phone: '',
    description: '',
    address: '',
    latitude: '',
    longitude: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Geo Location Query
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          address: prev.address || 'Detected Location'
        }));
        setLocating(false);
      },
      (error) => {
        console.error("Location error:", error);
        setErrorMsg("Failed to access location. Please input coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setErrorMsg("Please describe your grievance in detail.");
      return;
    }
    
    setLoading(true);
    setErrorMsg(null);

    const payload = new FormData();
    payload.append("citizen_name", formData.citizen_name);
    payload.append("citizen_phone", formData.citizen_phone);
    payload.append("description", formData.description);
    payload.append("address", formData.address);
    if (formData.latitude) payload.append("latitude", formData.latitude);
    if (formData.longitude) payload.append("longitude", formData.longitude);
    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await axios.post(`${apiUrl}/complaints/submit`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessData(response.data);
      // Reset form variables
      setFormData({
        citizen_name: '',
        citizen_phone: '',
        description: '',
        address: '',
        latitude: '',
        longitude: ''
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "An error occurred while submitting your complaint.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (successData?.id) {
      navigator.clipboard.writeText(successData.id.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pb-12">
      
      {/* Success Modal Panel */}
      {successData ? (
        <div className="glass-panel p-8 rounded-3xl shadow-2xl text-center space-y-6 relative overflow-hidden animate-fade-in border-sky-500/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-550 to-indigo-650" />
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-555/25 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Grievance Submitted</h2>
            <p className="text-slate-400 text-sm">
              Your complaint has been successfully recorded and queued for AI classification.
            </p>
          </div>

          {/* Reference ID Card section */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/5 inline-flex flex-col items-center justify-center gap-1.5 w-full max-w-sm">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
              Complaint Reference ID
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold text-sky-400">#{successData.id}</span>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                title="Copy ID to Clipboard"
              >
                {copied ? <span className="text-xs text-emerald-400 font-semibold px-0.5">Copied!</span> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="text-xs bg-slate-900/50 p-4 rounded-xl border border-white/5 text-slate-400 space-y-1.5">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Submission Details</h3>
              <p><strong>Citizen:</strong> {successData.citizen_name || 'Anonymous'}</p>
              <p><strong>Phone:</strong> {successData.citizen_phone || 'Not Provided'}</p>
              <p><strong>Status:</strong> <span className="text-emerald-400 font-semibold">{successData.status}</span></p>
              <p className="truncate" title={successData.address || 'Coordinates Only'}>
                <strong>Location:</strong> {successData.address || `${successData.latitude || '0'}, ${successData.longitude || '0'}`}
              </p>
            </div>

            <div className="text-xs bg-slate-900/50 p-4 rounded-xl border border-white/5 text-slate-400 space-y-1.5">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">AI Classification</h3>
              <p><strong>Department:</strong> <span className="text-sky-400 font-semibold">{successData.department}</span></p>
              <p><strong>Category:</strong> <span className="text-slate-200 font-semibold">{successData.category}</span></p>
              <p className="flex items-center gap-1.5">
                <strong>Priority:</strong>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  successData.priority === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  successData.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {successData.priority}
                </span>
              </p>
              <p className="flex items-center gap-1">
                <strong>Routing:</strong>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-md border border-sky-500/15">
                  <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse" />
                  Auto-Routed
                </span>
              </p>
            </div>
          </div>

          {successData.ai_summary && (
            <div className="text-left text-xs bg-slate-900/30 p-4 rounded-xl border border-white/5 text-slate-400">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">AI Generated Summary</span>
              <p className="text-slate-350 italic">"{successData.ai_summary}"</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setSuccessData(null)}
              className="px-5 py-2.5 bg-slate-900 border border-slate-805 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              Submit Another
            </button>
            
            <a 
              href={`/track?id=${successData.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 hover:shadow-lg hover:shadow-sky-600/10 rounded-xl text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              Track Progress
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (

        /* Grievance Submission Form Panel */
        <div className="glass-panel p-8 rounded-3xl shadow-xl relative">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1.5">Submit Grievance</h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Briefly fill the details of public issues. The system runs real-time AI to direct ticket routing and check validations.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  name="citizen_name"
                  value={formData.citizen_name}
                  onChange={handleInputChange}
                  placeholder="Rohan Sharma"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  name="citizen_phone"
                  value={formData.citizen_phone}
                  onChange={handleInputChange}
                  placeholder="9876543210"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-105 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Physical Address / Landmark
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Sector 15 Main Crossing, opposite metro gate"
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            {/* Coordinates widget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  GPS Coordinates
                </span>
                <button
                  type="button"
                  onClick={fetchLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                  {locating ? 'Locating...' : 'Fetch Live GPS'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="Latitude (e.g. 28.5355)"
                  className="w-full bg-slate-909/60 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="Longitude (e.g. 77.3910)"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-105 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Issue Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe your issue here. Please specify details like leakage duration, road pit depth, light outage count, etc."
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors resize-none"
              />
            </div>

            {/* Photo upload container */}
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Evidence Upload (Optional)
              </span>
              
              {imagePreview ? (
                <div className="relative border border-slate-800 bg-slate-900/40 p-3 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={imagePreview} 
                      alt="Uploader preview" 
                      className="w-16 h-16 object-cover rounded-xl border border-white/10" 
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-200 truncate max-w-[200px]">
                        {imageFile?.name}
                      </p>
                      <p className="text-slate-500">
                        {(imageFile?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-2 text-rose-500 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  <span className="text-xs text-sky-400 font-semibold">Upload issue image file</span>
                  <span className="text-[10px] text-slate-500">JPEG, PNG up to 5MB</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg shadow-sky-600/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                </span>
              ) : 'Submit Grievance'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Inline fallback spinner to avoid circular import issues
function RefreshCw(props) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export default SubmitComplaint;
