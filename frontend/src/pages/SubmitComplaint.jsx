import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Home, CreditCard,
  MapPin, Landmark, Hash,
  FileText, AlignLeft,
  CheckCircle, Copy, Trash2,
  AlertCircle, Loader2, ShieldCheck,
  Navigation, ImagePlus
} from 'lucide-react';
import { getCitizenProfile } from '../services/citizenService';
import { useComplaints } from '../context/ComplaintContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * AI Classification Service hook-point.
 * Replace body with: POST /ai/classify-complaint
 * Expected response: { department, priority, confidence, reason }
 */
const aiClassifyComplaint = async ({ title, description, location, images }) => {
  // Simulated pending state — real AI endpoint replaces this
  return {
    department: 'Pending AI Classification',
    priority:   'Pending AI Analysis',
    confidence: null,
    reason:     null
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const maskAadhaar = (num = '') =>
  num.length >= 4 ? `XXXX XXXX ${num.slice(-4)}` : num;

// ─── Sub-components ───────────────────────────────────────────────────────────
const ReadField = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">{label}</span>
    <div className="flex items-center gap-2 bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-2.5">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <span className={`text-xs text-slate-300 font-medium ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-slate-600 italic">Not provided</span>}
      </span>
    </div>
  </div>
);

const FieldError = ({ message }) =>
  message ? (
    <p className="text-[10px] text-rose-400 font-semibold flex items-center gap-1 mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {message}
    </p>
  ) : null;

const SectionHeading = ({ step, title, subtitle }) => (
  <div className="flex items-start gap-3 border-b border-white/5 pb-4 mb-5">
    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
      {step}
    </div>
    <div>
      <h2 className="text-sm font-bold text-white">{title}</h2>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
function SubmitComplaint() {
  const navigate = useNavigate();
  const { addComplaint } = useComplaints();

  // ── Citizen profile ──────────────────────────────────────────────────────
  const [citizen, setCitizen] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // ── Location fields ──────────────────────────────────────────────────────
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pinCode, setPinCode] = useState('');

  // ── Complaint fields (category & priority REMOVED — AI handles them) ─────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // ── Images (mandatory, up to 5) ──────────────────────────────────────────
  const [images, setImages] = useState([]); // [{ file, preview, id }]
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // ── State ────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successRecord, setSuccessRecord] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Load profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    getCitizenProfile()
      .then(setCitizen)
      .catch((e) => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
  }, []);

  // ── Cleanup preview URLs on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
  }, []);

  // ── Image helpers ─────────────────────────────────────────────────────────
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) return;

    const toAdd = [];
    for (const file of incoming.slice(0, slots)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_BYTES) continue;
      toAdd.push({ file, preview: URL.createObjectURL(file), id: crypto.randomUUID() });
    }
    setImages((prev) => [...prev, ...toAdd]);
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true);  };
  const onDragLeave = ()  => setDragOver(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!area.trim())              e.area        = 'Area / Locality is required.';
    if (area.length > 200)         e.area        = 'Area must not exceed 200 characters.';
    if (!title.trim())             e.title       = 'Complaint title is required.';
    if (!description.trim())       e.description = 'Please describe the issue.';
    if (description.length > 1000) e.description = 'Description must not exceed 1000 characters.';
    if (pinCode && !/^\d{6}$/.test(pinCode)) e.pinCode = 'Pin code must be exactly 6 digits.';
    if (images.length === 0)       e.images      = 'Please upload at least one image of the issue.';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Convert first image to a data-URL so it persists in localStorage
      let imagePreview = null;
      if (images.length > 0) {
        imagePreview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(images[0].file);
        });
      }

      const payload = {
        citizen: {
          name:    citizen.name,
          aadhaar: citizen.aadhaar,
          mobile:  citizen.mobile,
          address: citizen.address,
          email:   citizen.email
        },
        complaintLocation: {
          area:     area.trim(),
          landmark: landmark.trim() || null,
          pinCode:  pinCode.trim()  || null
        },
        complaint: {
          title:       title.trim(),
          description: description.trim(),
          department:  'Pending Classification',
          priority:    'Pending'
        },
        imagePreview
      };

      const record = await addComplaint(payload);
      setSuccessRecord(record);

      // Reset form
      setArea(''); setLandmark(''); setPinCode('');
      setTitle(''); setDescription('');
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
    } catch (err) {
      setErrors({ submit: err.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(successRecord.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (successRecord) {
    return (
      <div className="max-w-lg mx-auto w-full px-4 text-center animate-fade-in">
        <div className="glass-panel p-10 rounded-3xl border border-white/5 space-y-6">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Complaint Registered!</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Your grievance has been recorded and will be routed to the correct department shortly.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-white/5 rounded-2xl px-6 py-4 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase font-extrabold tracking-widest">Complaint ID</p>
            <p className="text-2xl font-black font-mono text-sky-400">{successRecord.id}</p>
            <button
              onClick={copyId}
              className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
          <div className="text-left bg-slate-900/40 border border-white/5 rounded-2xl p-4 text-xs space-y-2.5">
            {[
              ['Title',      successRecord.title],
              ['Area',       successRecord.area],
              ['Department', successRecord.department],
              ['Priority',   successRecord.priority],
              ['Status',     successRecord.status]
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">{k}</span>
                <span className="text-slate-200 font-semibold text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/track')}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Track My Complaint
            </button>
            <button
              onClick={() => setSuccessRecord(null)}
              className="flex-1 py-2.5 bg-sky-600/15 hover:bg-sky-600/25 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Lodge Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto w-full px-4 pb-12 space-y-5 animate-fade-in">

      {/* Page Header */}
      <div className="relative glass-panel px-6 py-5 rounded-3xl border border-white/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-sky-500 to-indigo-600" />
        <h1 className="text-lg font-black text-white">Lodge a Grievance</h1>
        <p className="text-xs text-slate-400 mt-1">
          Provide the details and location of your grievance to submit it to the appropriate department.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ══════════════════════════════════════════════════════
            CARD 1 — CITIZEN DETAILS (Auto-filled / Read-only)
        ══════════════════════════════════════════════════════ */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <SectionHeading
            step="1"
            title="Citizen Details"
            subtitle="Verified from your Aadhaar session — these fields cannot be edited."
          />
          {profileLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching your verified profile…</span>
            </div>
          ) : profileError ? (
            <div className="flex items-center gap-2 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{profileError}</span>
            </div>
          ) : citizen && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ReadField icon={User}       label="Full Name"           value={citizen.name} />
                <ReadField icon={CreditCard} label="Aadhaar Number"      value={maskAadhaar(citizen.aadhaar)} mono />
                <ReadField icon={Phone}      label="Registered Mobile"   value={`+91 ${citizen.mobile}`} mono />
                <ReadField icon={Mail}       label="Email Address"       value={citizen.email} />
              </div>
              <ReadField   icon={Home}       label="Residential Address" value={citizen.address} />
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-3 py-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Identity verified via Aadhaar E-KYC
              </div>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            CARD 2 — COMPLAINT LOCATION
        ══════════════════════════════════════════════════════ */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <SectionHeading
            step="2"
            title="Complaint Location"
            subtitle="Specify where the issue exists — may differ from your home address."
          />

          {/* Area — required */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              Area / Locality <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
              <textarea
                value={area}
                onChange={(e) => setArea(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="e.g. Near Shivaji Nagar Bus Stand, Pune"
                className={`w-full bg-slate-900/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none transition-colors ${errors.area ? 'border-rose-500/50' : 'border-slate-800 focus:border-sky-500'}`}
              />
            </div>
            <div className="flex justify-between items-start mt-1">
              <FieldError message={errors.area} />
              <span className={`text-[9px] ml-auto ${area.length > 180 ? 'text-amber-400' : 'text-slate-600'}`}>
                {area.length}/200
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Enter the exact area, locality, landmark, or road where the issue is located.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                Landmark <span className="text-slate-600">(Optional)</span>
              </label>
              <div className="relative">
                <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite D-Mart"
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                Pin Code <span className="text-slate-600">(Optional)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="411001"
                  maxLength={6}
                  className={`w-full bg-slate-900/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors font-mono ${errors.pinCode ? 'border-rose-500/50' : 'border-slate-800 focus:border-sky-500'}`}
                />
              </div>
              <FieldError message={errors.pinCode} />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            CARD 3 — COMPLAINT DETAILS
        ══════════════════════════════════════════════════════ */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-5">
          <SectionHeading
            step="3"
            title="Complaint Details"
            subtitle="Describe the issue clearly..."
          />

          {/* Submit error */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{errors.submit}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              Complaint Title <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Water pipeline leaking on Main Road"
                className={`w-full bg-slate-900/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors ${errors.title ? 'border-rose-500/50' : 'border-slate-800 focus:border-sky-500'}`}
              />
            </div>
            <FieldError message={errors.title} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
              Complaint Description <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-slate-500" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={6}
                placeholder="Describe the issue in detail. Include what happened, when it started, nearby landmarks, and any additional information that will help resolve the complaint."
                className={`w-full bg-slate-900/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none transition-colors ${errors.description ? 'border-rose-500/50' : 'border-slate-800 focus:border-sky-500'}`}
              />
            </div>
            <div className="flex justify-between items-start mt-1">
              <FieldError message={errors.description} />
              <span className={`text-[9px] ml-auto ${description.length > 900 ? 'text-amber-400' : 'text-slate-600'}`}>
                {description.length}/1000
              </span>
            </div>
          </div>

          {/* Evidence Images — mandatory, up to 5 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Evidence Images <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-semibold">
                {images.length}/{MAX_IMAGES} uploaded
              </span>
            </div>

            {/* Previews grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/5 bg-slate-900">
                    <img src={img.preview} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            {images.length < MAX_IMAGES && (
              <div
                ref={dropZoneRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-2xl py-8 px-4 cursor-pointer transition-all ${
                  errors.images
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : dragOver
                    ? 'border-sky-500/60 bg-sky-500/5'
                    : 'border-slate-700 hover:border-sky-500/50 bg-slate-900/30 hover:bg-slate-900/50'
                }`}
              >
                <div className={`p-3 rounded-xl transition-colors ${dragOver ? 'bg-sky-500/15' : 'bg-slate-800'}`}>
                  <ImagePlus className={`w-5 h-5 ${dragOver ? 'text-sky-400' : 'text-slate-400'}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-300 font-semibold">
                    {dragOver ? 'Drop images here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    JPG, JPEG, PNG, WEBP — Max 10 MB each — Up to {MAX_IMAGES} images
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={(e) => addFiles(e.target.files)}
                  className="hidden"
                />
              </div>
            )}
            <FieldError message={errors.images} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || profileLoading || !!profileError}
            className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-sky-600/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Navigation className="w-4 h-4" /> Submit Grievance</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitComplaint;
