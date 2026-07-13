"use client";

import { useState } from "react";
import { COUNTRY_OPTIONS } from "../lib/longitudeCorrection.js";

const FIELD_BASE =
  "w-full bg-transparent border-0 border-b border-ink/25 py-3 px-1 " +
  "text-ink font-serif text-lg placeholder:text-stone/60 " +
  "focus:outline-none focus:border-ink transition-colors";

const SELECT_BASE =
  "w-full bg-transparent border-0 border-b border-ink/25 py-3 pl-1 pr-7 " +
  "text-ink font-serif text-lg " +
  "focus:outline-none focus:border-ink transition-colors " +
  "appearance-none cursor-pointer disabled:cursor-not-allowed";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function daysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
}

export default function InputForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    email: "",
    surname: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    birthMinute: "",
    birthAmPm: "",
    timeUnknown: false,
    birthCountry: "",
    birthCity: "",
    placeUnknown: false,
    gender: "",
    consent: false,
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Clamp day if month/year change makes current day invalid (e.g. Feb 30 → Feb 28)
  const updateDatePart = (k, v) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      const maxDay = daysInMonth(next.birthYear, next.birthMonth);
      if (next.birthDay && parseInt(next.birthDay, 10) > maxDay) {
        next.birthDay = String(maxDay);
      }
      return next;
    });
  };

  const dateComplete = form.birthYear && form.birthMonth && form.birthDay;
  const timeComplete = form.birthHour && form.birthMinute !== "" && form.birthAmPm;

  const canSubmit =
    form.surname.trim() &&
    dateComplete &&
    form.gender &&
    form.consent &&
    !isLoading;

  function combineDate() {
    if (!dateComplete) return "";
    const m = String(form.birthMonth).padStart(2, "0");
    const d = String(form.birthDay).padStart(2, "0");
    return `${form.birthYear}-${m}-${d}`;
  }

  function combineTime() {
    if (form.timeUnknown || !timeComplete) return null;
    let h = parseInt(form.birthHour, 10);
    if (form.birthAmPm === "PM" && h !== 12) h += 12;
    if (form.birthAmPm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(form.birthMinute).padStart(2, "0")}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      email:        form.email,
      surname:      form.surname.trim(),
      birthDate:    combineDate(),
      birthTime:    combineTime(),
      birthCountry: form.placeUnknown ? null : form.birthCountry || null,
      birthCity:    form.placeUnknown ? null : form.birthCity || null,
      gender:       form.gender,
    });
  }

  const dayCount = daysInMonth(form.birthYear, form.birthMonth);

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
        <div className="grid grid-cols-3 gap-4">
          <Select
            value={form.birthMonth}
            onChange={(e) => updateDatePart("birthMonth", e.target.value)}
            aria-label="Birth month"
          >
            <option value="">Month</option>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </Select>
          <Select
            value={form.birthDay}
            onChange={(e) => updateDatePart("birthDay", e.target.value)}
            aria-label="Birth day"
          >
            <option value="">Day</option>
            {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select
            value={form.birthYear}
            onChange={(e) => updateDatePart("birthYear", e.target.value)}
            aria-label="Birth year"
          >
            <option value="">Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
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
        <div className="grid grid-cols-3 gap-4">
          <Select
            value={form.birthHour}
            onChange={(e) => update("birthHour", e.target.value)}
            disabled={form.timeUnknown}
            aria-label="Birth hour"
          >
            <option value="">Hour</option>
            {HOURS_12.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </Select>
          <Select
            value={form.birthMinute}
            onChange={(e) => update("birthMinute", e.target.value)}
            disabled={form.timeUnknown}
            aria-label="Birth minute"
          >
            <option value="">Minute</option>
            {MINUTES.map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </Select>
          <Select
            value={form.birthAmPm}
            onChange={(e) => update("birthAmPm", e.target.value)}
            disabled={form.timeUnknown}
            aria-label="AM or PM"
          >
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </Select>
        </div>
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
          <Select
            value={form.birthCountry}
            onChange={(e) => update("birthCountry", e.target.value)}
            disabled={form.placeUnknown}
            aria-label="Country of birth"
          >
            <option value="">Select country</option>
            {COUNTRY_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
            <option value="other">Other</option>
          </Select>
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

function Select({ value, onChange, disabled, children, ...rest }) {
  return (
    <div className={`relative ${disabled ? "opacity-30" : ""}`}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={SELECT_BASE}
        {...rest}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polyline points="5,8 10,13 15,8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
