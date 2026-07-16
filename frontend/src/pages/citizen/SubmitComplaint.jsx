import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  User, Phone, Mail, Home, CreditCard,
  MapPin, Landmark, Hash,
  FileText, AlignLeft,
  CheckCircle, Copy, Trash2,
  AlertCircle, Loader2, ShieldCheck,
  Navigation, ImagePlus, Map as MapIcon,
  Mic, MicOff, HeartHandshake, PhoneCall,
} from "lucide-react";
import { getCitizenProfile } from "../../services/citizenService";
import { useComplaints } from "../../context/ComplaintContext";
import { useSafetyMode } from "../../context/SafetyModeContext";
import { Field, FieldError } from "../../components/ui/Field";
import { maskAadhaar } from "../../utils/format";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_IMAGES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Quick-report presets for Women Safety Mode. Each seeds the title and a
// starter description containing the keywords the classifier and priority
// engine recognise, so these reports route to the Women Safety Cell with
// the +15 safety boost applied.
const SAFETY_PRESETS = [
  {
    label: "Harassment / Eve Teasing",
    title: "Harassment near ",
    starter: "I want to report harassment / eve teasing of women. ",
  },
  {
    label: "Stalking / Being Followed",
    title: "Stalking incident near ",
    starter: "I was followed and stalked, and it felt very unsafe. ",
  },
  {
    label: "Unsafe / Dark Area",
    title: "Unsafe poorly lit area at ",
    starter: "This area is unsafe for women at night — the street lights are off and the lane is completely dark. ",
  },
  {
    label: "Robbery / Chain Snatching",
    title: "Chain snatching incident at ",
    starter: "A robbery / chain snatching incident occurred here. Women walking alone feel unsafe. ",
  },
  {
    label: "Unsafe Public Transport",
    title: "Unsafe behaviour on public transport at ",
    starter: "Men were misbehaving with women passengers on public transport. It felt harassing and unsafe. ",
  },
];

const HELPLINES = [
  { label: "Emergency", number: "112" },
  { label: "Women Helpline", number: "1091" },
  { label: "Women in Distress", number: "181" },
];

// General (gender-neutral) safety presets — used when the user is in a safety
// flow without Women Safety Mode (e.g. arrived via the Safety Center, or
// switched the pink mode off mid-report).
const GENERAL_SAFETY_PRESETS = [
  {
    label: "Robbery / Snatching",
    title: "Robbery / snatching incident at ",
    starter: "A robbery / snatching incident occurred here. People in the area feel unsafe. ",
  },
  {
    label: "Unsafe / Dark Street",
    title: "Unsafe dark street at ",
    starter: "This street is unsafe at night — the lights are dead and the lane is completely dark. ",
  },
  {
    label: "Suspicious Activity",
    title: "Suspicious activity near ",
    starter: "Suspicious individuals have been loitering here, making residents feel unsafe. ",
  },
  {
    label: "Street Fight / Nuisance",
    title: "Public nuisance / fights at ",
    starter: "Frequent fights and drunk nuisance here create an unsafe atmosphere and risk of assault. ",
  },
  {
    label: "Harassment",
    title: "Harassment incident near ",
    starter: "I want to report harassment in this area. It feels very unsafe. ",
  },
];

const GENERAL_HELPLINES = [
  { label: "Emergency", number: "112" },
  { label: "Police", number: "100" },
  { label: "Women Helpline", number: "1091" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const ReadField = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
      {label}
    </span>
    <div className="flex items-center gap-2 inset-panel px-3.5 py-2.5">
      <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
      <span className={`text-xs text-text font-medium ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-muted italic">Not provided</span>}
      </span>
    </div>
  </div>
);

// ─── Map location picker (click to pin) ──────────────────────────────────────
const PUNE_CENTER = [18.5204, 73.8567];

function ClickCapture({ onPick }) {
  useMapEvents({
    click: (e) => onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng }),
  });
  return null;
}

const LocationPickerMap = ({ coords, onPick }) => (
  <div className="rounded-xl overflow-hidden border border-border" style={{ height: 260 }}>
    <MapContainer
      center={coords ? [coords.latitude, coords.longitude] : PUNE_CENTER}
      zoom={coords ? 15 : 12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ClickCapture onPick={onPick} />
      {coords && (
        <CircleMarker
          center={[coords.latitude, coords.longitude]}
          radius={10}
          pathOptions={{
            // Follows the active theme (teal, or pink in Women Safety Mode)
            color: `rgb(${getComputedStyle(document.documentElement).getPropertyValue("--c-primary-hover").trim().split(" ").join(",")})`,
            fillColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue("--c-primary").trim().split(" ").join(",")})`,
            fillOpacity: 0.85,
            weight: 2,
          }}
        />
      )}
    </MapContainer>
  </div>
);

const SectionHeading = ({ step, title, subtitle }) => (
  <div className="flex items-start gap-3 border-b border-border pb-4 mb-5">
    <div className="w-7 h-7 rounded-lg bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
      {step}
    </div>
    <div>
      <h2 className="text-sm font-bold text-text">{title}</h2>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * Complaint form, in two completely separate flavours:
 *  - civic (default, at "/"): plain grievance form — no safety UI, photo required
 *  - safety (safetyForm=true, at "/safety/report"): safety panels + presets +
 *    helplines, photo optional; women panel when Women Safety Mode is on,
 *    general safety panel otherwise
 */
function SubmitComplaint({ safetyForm = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addComplaint } = useComplaints();
  const { safetyMode } = useSafetyMode();
  const [activePreset, setActivePreset] = useState(null);

  // Quick-report preset passed from the Safety Center
  useEffect(() => {
    const p = location.state?.safetyPreset;
    if (safetyForm && p) {
      setTitle(p.title);
      setDescription(p.starter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Citizen profile ────────────────────────────────────────────────────────
  const [citizen, setCitizen] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // ── Location fields ────────────────────────────────────────────────────────
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pinCode, setPinCode] = useState("");

  // ── GPS coordinates (optional — powers the admin hotspot map) ──────────────
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Could not fetch GPS location. You can still submit without it.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // ── Complaint fields (category & priority handled by AI) ──────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ── Voice input (Web Speech API) — dictate the description hands-free ─────
  // Inclusion feature: lets citizens who find typing hard (or are on mobile
  // at the incident site) speak their complaint instead.
  const SpeechRecognitionImpl =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleVoiceInput = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognitionImpl();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .slice(e.resultIndex)
        .map((r) => r[0].transcript)
        .join(" ")
        .trim();
      if (text) {
        setDescription((prev) => `${prev ? prev.trimEnd() + " " : ""}${text}`.slice(0, 1000));
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  // Stop the microphone if the user leaves the page mid-dictation
  useEffect(() => () => recognitionRef.current?.stop(), []);

  // ── Images (mandatory, up to 5) ────────────────────────────────────────────
  const [images, setImages] = useState([]); // [{ file, preview, id }]
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successRecord, setSuccessRecord] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    getCitizenProfile()
      .then(setCitizen)
      .catch((e) => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
  }, []);

  // ── Cleanup preview URLs on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
  }, []);

  // ── Image helpers ──────────────────────────────────────────────────────────
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

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!area.trim()) e.area = "Area / Locality is required.";
    if (area.length > 200) e.area = "Area must not exceed 200 characters.";
    if (!title.trim()) e.title = "Complaint title is required.";
    if (!description.trim()) e.description = "Please describe the issue.";
    if (description.length > 1000) e.description = "Description must not exceed 1000 characters.";
    if (pinCode && !/^\d{6}$/.test(pinCode)) e.pinCode = "Pin code must be exactly 6 digits.";
    // Photo evidence is required for civic grievances, but NOT for safety
    // reports — incidents like harassment or robbery rarely have photos,
    // and demanding one is a barrier to reporting.
    if (!safetyForm && images.length === 0)
      e.images = "Please upload at least one image of the issue.";
    return e;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
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
          name: citizen.name,
          aadhaar: citizen.aadhaar,
          mobile: citizen.mobile,
          address: citizen.address,
          email: citizen.email,
        },
        complaintLocation: {
          area: area.trim(),
          landmark: landmark.trim() || null,
          pinCode: pinCode.trim() || null,
        },
        complaint: {
          title: title.trim(),
          description: description.trim(),
        },
        imageFile: images[0]?.file || null, // uploaded as primary evidence
        imagePreview,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      };

      const record = await addComplaint(payload);
      setSuccessRecord(record);

      // Reset form
      setArea(""); setLandmark(""); setPinCode("");
      setTitle(""); setDescription("");
      setCoords(null); setGeoError("");
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
    } catch (err) {
      setErrors({ submit: err.message || "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(successRecord.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (successRecord) {
    return (
      <div className="max-w-lg mx-auto w-full text-center animate-fade-in">
        <div className="card p-10 space-y-6">
          <div className="w-14 h-14 bg-status-success-bg border border-status-success-border rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-status-success-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">Complaint Registered!</h2>
            <p className="text-muted text-sm mt-1.5 leading-relaxed">
              Your grievance has been recorded and will be routed to the correct
              department shortly.
            </p>
          </div>
          <div className="inset-panel px-6 py-4 space-y-1">
            <p className="text-[10px] text-muted uppercase font-bold tracking-widest">
              Complaint ID
            </p>
            <p className="text-2xl font-bold font-mono text-primary">
              {successRecord.id}
            </p>
            <button
              onClick={copyId}
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              {copied ? "Copied!" : "Copy ID"}
            </button>
          </div>
          <div className="text-left inset-panel p-4 text-sm space-y-2.5">
            {[
              ["Title", successRecord.title],
              ["Area", successRecord.area],
              ["Department", successRecord.department],
              ["Priority", successRecord.priority],
              ["Status", successRecord.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-muted shrink-0">{k}</span>
                <span className="text-text font-semibold text-right">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/track")} className="btn-primary flex-1">
              Track My Complaint
            </button>
            <button onClick={() => setSuccessRecord(null)} className="btn-secondary flex-1">
              Lodge Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto w-full pb-12 space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <h1 className="text-xl font-bold text-text">
          {safetyForm ? "Report a Safety Issue" : "Lodge a Grievance"}
        </h1>
        <p className="text-sm text-muted mt-1">
          {safetyForm
            ? "Safety reports are prioritized and routed to the right cell. Photo evidence is optional."
            : "Provide the details and location of your grievance to submit it to the appropriate department."}
        </p>
      </div>

      {/* ── General safety panel (green) — safety form without Women Mode ── */}
      {safetyForm && !safetyMode && (
        <div className="card !border-primary/30 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="flex items-start gap-3">
            <div className="icon-chip w-11 h-11 shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-text flex items-center gap-2 flex-wrap">
                Safety report
                <span className="badge-primary !text-[10px]">+15 priority boost</span>
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Safety complaints are prioritized for everyone and photo evidence is
                optional. Pick a quick category or describe in your own words.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {GENERAL_SAFETY_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setActivePreset(p.label);
                  setTitle(p.title);
                  setDescription((prev) => (prev.startsWith(p.starter) ? prev : p.starter));
                }}
                className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  activePreset === p.label
                    ? "bg-primary text-white border-primary"
                    : "bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              In immediate danger? Call now
            </span>
            {GENERAL_HELPLINES.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {h.label}: <span className="font-mono">{h.number}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Women Safety panel (USP) — safety form with Women Mode on ── */}
      {safetyForm && safetyMode && (
        <div className="card !border-primary/30 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <div className="flex items-start gap-3">
            <div className="icon-chip w-11 h-11 shrink-0">
              <HeartHandshake className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-text flex items-center gap-2 flex-wrap">
                Women Safety Mode is on
                <span className="badge-primary !text-[10px]">+15 priority boost</span>
              </h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Safety complaints are routed to the <strong>Women Safety Cell</strong>,
                receive a dedicated priority boost, and are never classified below
                High priority. Pick a quick category or describe in your own words.
              </p>
            </div>
          </div>

          {/* Quick-report presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            {SAFETY_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setActivePreset(p.label);
                  setTitle(p.title);
                  setDescription((prev) =>
                    prev.startsWith(p.starter) ? prev : p.starter
                  );
                }}
                className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  activePreset === p.label
                    ? "bg-primary text-white border-primary"
                    : "bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Helplines */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              In immediate danger? Call now
            </span>
            {HELPLINES.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {h.label}: <span className="font-mono">{h.number}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* ── Card 1: Citizen details (read-only) ── */}
        <div className="card space-y-4" data-tour="citizen-details">
          <SectionHeading
            step="1"
            title="Citizen Details"
            subtitle="Verified from your Aadhaar session — these fields cannot be edited."
          />
          {profileLoading ? (
            <div className="flex items-center gap-2 text-muted text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching your verified profile…</span>
            </div>
          ) : profileError ? (
            <div className="alert-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          ) : (
            citizen && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReadField icon={User} label="Full Name" value={citizen.name} />
                  <ReadField icon={CreditCard} label="Aadhaar Number" value={maskAadhaar(citizen.aadhaar)} mono />
                  <ReadField icon={Phone} label="Registered Mobile" value={`+91 ${citizen.mobile}`} mono />
                  <ReadField icon={Mail} label="Email Address" value={citizen.email} />
                </div>
                <ReadField icon={Home} label="Residential Address" value={citizen.address} />
                <div className="flex items-center gap-1.5 text-xs text-status-success-text font-semibold bg-status-success-bg border border-status-success-border rounded-lg px-3 py-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Identity verified via Aadhaar e-KYC
                </div>
              </>
            )
          )}
        </div>

        {/* ── Card 2: Complaint location ── */}
        <div className="card space-y-4" data-tour="location-section">
          <SectionHeading
            step="2"
            title="Complaint Location"
            subtitle="Specify where the issue exists — may differ from your home address."
          />

          <Field
            label="Area / Locality"
            required
            icon={MapPin}
            error={errors.area}
            hint="Enter the exact area, locality, landmark, or road where the issue is located."
            counter={`${area.length}/200`}
          >
            <textarea
              value={area}
              onChange={(e) => setArea(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="e.g. Near Shivaji Nagar Bus Stand, Pune"
              className={`input pl-10 resize-none ${errors.area ? "input-error" : ""}`}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Landmark" optional icon={Landmark}>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite D-Mart"
                className="input pl-10"
              />
            </Field>

            <Field label="Pin Code" optional icon={Hash} error={errors.pinCode}>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="411001"
                maxLength={6}
                className={`input pl-10 font-mono ${errors.pinCode ? "input-error" : ""}`}
              />
            </Field>
          </div>

          {/* GPS / map coordinates (optional) */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locating}
                  className="btn-secondary !py-2 text-xs w-fit"
                >
                  {locating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                  )}
                  {coords ? "Update GPS location" : "Use my GPS location"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMapPicker((v) => !v)}
                  className="btn-secondary !py-2 text-xs w-fit"
                >
                  <MapIcon className="w-3.5 h-3.5 text-primary" />
                  {showMapPicker ? "Hide map" : "Pick on map"}
                </button>
              </div>
              {coords && (
                <span className="badge-success !text-[11px] font-mono">
                  {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)} pinned
                </span>
              )}
              {geoError && <span className="text-[11px] text-status-warning-text">{geoError}</span>}
              {!coords && !geoError && (
                <span className="text-[11px] text-muted">
                  Optional — helps authorities locate the issue on the hotspot map.
                </span>
              )}
            </div>

            {showMapPicker && (
              <div className="space-y-1.5 animate-fade-in">
                <LocationPickerMap coords={coords} onPick={setCoords} />
                <p className="text-[11px] text-muted">
                  Click anywhere on the map to drop the complaint location pin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Card 3: Complaint details ── */}
        <div className="card space-y-5">
          <SectionHeading
            step="3"
            title="Complaint Details"
            subtitle="Describe the issue clearly — our AI will route it to the right department."
          />

          {errors.submit && (
            <div className="alert-error text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          <div data-tour="details-section" className="space-y-5">
          <Field label="Complaint Title" required icon={FileText} error={errors.title}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water pipeline leaking on Main Road"
              className={`input pl-10 ${errors.title ? "input-error" : ""}`}
            />
          </Field>

          <Field
            label="Complaint Description"
            required
            icon={AlignLeft}
            error={errors.description}
            counter={`${description.length}/1000`}
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={6}
              placeholder="Describe the issue in detail — or tap the mic and speak. Include what happened, when it started, and nearby landmarks."
              className={`input pl-10 ${SpeechRecognitionImpl ? "pr-12" : ""} resize-none ${errors.description ? "input-error" : ""}`}
            />
            {/* Voice dictation toggle */}
            {SpeechRecognitionImpl && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                title={listening ? "Stop dictation" : "Dictate your complaint"}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                  listening
                    ? "bg-status-error-bg text-status-error-accent animate-pulse-ring"
                    : "bg-primary-light text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </Field>
          {listening && (
            <p className="text-[11px] text-status-error-text font-semibold -mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error-accent animate-pulse" />
              Listening… speak your complaint, tap the mic again to stop.
            </p>
          )}
          </div>

          {/* Evidence images */}
          <div data-tour="evidence-upload">
            <div className="flex items-center justify-between">
              <label className="label">
                Evidence Images{" "}
                {safetyForm ? (
                  <span className="text-muted font-normal normal-case">(optional for safety reports)</span>
                ) : (
                  <span className="text-status-error-accent">*</span>
                )}
              </label>
              <span className="text-[11px] text-muted font-semibold">
                {images.length}/{MAX_IMAGES} uploaded
              </span>
            </div>
            {safetyForm && images.length === 0 && (
              <p className="text-[11px] text-muted mb-1.5">
                No photo needed — we understand safety incidents often can't be photographed.
                Your description is enough.
              </p>
            )}

            {/* Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-surfaceSoft"
                  >
                    <img src={img.preview} alt="Evidence" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      aria-label="Remove image"
                      className="absolute inset-0 bg-text/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop zone */}
            {images.length < MAX_IMAGES && (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-card py-8 px-4 cursor-pointer transition-all ${
                  errors.images
                    ? "border-status-error-accent/50 bg-status-error-bg/50"
                    : dragOver
                      ? "border-primary/60 bg-primary-light"
                      : "border-border hover:border-primary/50 bg-surfaceSoft hover:bg-primary-light/40"
                }`}
              >
                <div className={`p-3 rounded-xl transition-colors ${dragOver ? "bg-primary/15" : "bg-surface border border-border"}`}>
                  <ImagePlus className={`w-5 h-5 ${dragOver ? "text-primary" : "text-muted"}`} />
                </div>
                <div className="text-center">
                  <p className="text-sm text-text font-semibold">
                    {dragOver ? "Drop images here" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    JPG, JPEG, PNG, WEBP — Max 10 MB each — Up to {MAX_IMAGES} images
                    (first image is submitted as primary evidence)
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
            data-tour="submit-btn"
            disabled={submitting || profileLoading || !!profileError}
            className="btn-primary w-full py-3.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" /> Submit Grievance
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitComplaint;
