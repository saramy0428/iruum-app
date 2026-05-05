"use client";

import { useState } from "react";

const FIELD_BASE =
  "w-full bg-transparent border-0 border-b border-ink/25 py-3 px-1 " +
  "text-ink font-serif text-lg placeholder:text-stone/60 " +
  "focus:outline-none focus:border-ink transition-colors";

export default function InputForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    email: "",
    surname: "",
    birthDate: "",
    birthTime: "",
    timeUnknown: false,
    birthCountry: "",
    birthCity: "",
    placeUnknown: false,
    gender: "",
    consent: false,
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.surname.trim() &&
    form.birthDate &&
    form.gender &&
    form.consent &&
    !isLoading;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      email:        form.email,
      surname:      form.surname.trim(),
      birthDate:    form.birthDate,
      birthTime:    form.timeUnknown ? null : form.birthTime || null,
      birthCountry: form.placeUnknown ? null : form.birthCountry || null,
      birthCity:    form.placeUnknown ? null : form.birthCity || null,
      gender:       form.gender,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* ── Email ──────────────────────────────────────────────────────────── */}
      <Field label="Your e-mail" optional>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          className={FIELD_BASE}
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </Field>

      {/* ── Surname ────────────────────────────────────────────────────────── */}
      <Field label="Your last name">
        <input
          type="text"
          autoComplete="family-name"
          className={FIELD_BASE}
          placeholder="e.g. Anderson"
          value={form.surname}
          onChange={(e) => update("surname", e.target.value)}
          required
        />
      </Field>

      {/* ── Birth Date ─────────────────────────────────────────────────────── */}
      <Field label="Date of birth">
        <input
          type="date"
          className={FIELD_BASE}
          value={form.birthDate}
          onChange={(e) => update("birthDate", e.target.value)}
          required
        />
      </Field>

      {/* ── Birth Time ─────────────────────────────────────────────────────── */}
      <Field
        label="Time of birth"
        optional
        helper={
          <CheckboxToggle
            checked={form.timeUnknown}
            onChange={(v) => update("timeUnknown", v)}
            label="I don't know the time"
          />
        }
      >
        <input
          type="time"
          disabled={form.timeUnknown}
          className={`${FIELD_BASE} disabled:opacity-30`}
          value={form.birthTime}
          onChange={(e) => update("birthTime", e.target.value)}
        />
      </Field>

      {/* ── Birth Place ────────────────────────────────────────────────────── */}
      <Field
        label="Place of birth"
        optional
        helper={
          <CheckboxToggle
            checked={form.placeUnknown}
            onChange={(v) => update("placeUnknown", v)}
            label="I don't know"
          />
        }
      >
        <div className="grid grid-cols-2 gap-6">
          <input
            type="text"
            autoComplete="country-name"
            disabled={form.placeUnknown}
            className={`${FIELD_BASE} disabled:opacity-30`}
            placeholder="Country"
            value={form.birthCountry}
            onChange={(e) => update("birthCountry", e.target.value)}
          />
          <input
            type="text"
            autoComplete="address-level2"
            disabled={form.placeUnknown}
            className={`${FIELD_BASE} disabled:opacity-30`}
            placeholder="City"
            value={form.birthCity}
            onChange={(e) => update("birthCity", e.target.value)}
          />
        </div>
      </Field>

      {/* ── Gender ─────────────────────────────────────────────────────────── */}
      <Field label="How do you identify your gender?">
        <div className="flex flex-wrap gap-x-10 gap-y-3 pt-2">
          {["Female", "Male", "Non-binary"].map((g) => (
            <label key={g} className="inline-flex items-center gap-3 cursor-pointer group">
              <span
                className={`relative w-4 h-4 border border-ink/50 rounded-full transition-colors ${
                  form.gender === g ? "border-ink" : "group-hover:border-ink"
                }`}
              >
                {form.gender === g && (
                  <span className="absolute inset-1 bg-vermilion rounded-full" />
                )}
              </span>
              <input
                type="radio"
                name="gender"
                value={g}
                checked={form.gender === g}
                onChange={() => update("gender", g)}
                className="sr-only"
              />
              <span className="font-serif text-lg">{g}</span>
            </label>
          ))}
        </div>
      </Field>

      <div className="hairline" />

      {/* ── Consent ────────────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
            className="sr-only"
          />
          <span
            className={`flex-shrink-0 w-4 h-4 mt-1.5 border border-ink/50 transition-colors ${
              form.consent ? "border-ink bg-ink" : "group-hover:border-ink"
            }`}
          >
            {form.consent && (
              <svg viewBox="0 0 12 12" className="w-full h-full text-paper" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="2.5,6 5,8.5 9.5,3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="font-serif text-base text-ink/80 leading-relaxed">
            I understand that the personal information I provide (such as my date of birth) will be used solely
            for the purpose of creating my Korean name and will not be used for any other purpose.
            I give my consent to this use.
          </span>
        </label>
      </div>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`group relative inline-flex items-center gap-4 px-10 py-5 transition-all
            ${canSubmit
              ? "bg-ink text-paper hover:bg-vermilion cursor-pointer"
              : "bg-ink/15 text-ink/40 cursor-not-allowed"}
          `}
        >
          <span className="font-sans text-sm uppercase tracking-widest">
            {isLoading ? "Calculating…" : "Receive my name"}
          </span>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4"  y1="12" x2="20" y2="12" strokeLinecap="round" />
            <polyline points="14,6 20,12 14,18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </form>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, optional, helper, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <label className="font-serif text-base text-ink/90">
          {label}
          {optional && <span className="ml-2 eyebrow">optional</span>}
        </label>
        {helper}
      </div>
      {children}
    </div>
  );
}

function CheckboxToggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-stone hover:text-ink transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`w-3.5 h-3.5 border transition-colors ${
          checked ? "border-ink bg-ink" : "border-ink/40"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-full h-full text-paper" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="2.5,6 5,8.5 9.5,3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="font-sans text-xs uppercase tracking-widest">{label}</span>
    </label>
  );
}
