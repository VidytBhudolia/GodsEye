"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "@/store/useMapStore";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
};

const ENTITY_TYPE_OPTIONS = [
  "Military",
  "Cargo",
  "Tanker",
  "Passenger",
  "Satellite",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
] as const;

function normalizeCountryValue(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeEntityTypeValue(value: string): string {
  return value.trim().toLowerCase();
}

function formatEntityTypeLabel(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCountryLabel(value: string): string {
  const normalized = normalizeCountryValue(value);
  if (normalized.length === 2) {
    return normalized;
  }

  return formatEntityTypeLabel(normalized.toLowerCase());
}

export default function FilterPanel({ open, onClose }: FilterPanelProps) {
  const entities = useMapStore((state) => state.entities);
  const {
    filters,
    setCountryFilter,
    setEntityTypeFilter,
    setStatusFilter,
    clearFilters,
    hasActiveFilters,
  } = useMapStore(
    useShallow((state) => ({
      filters: state.filters,
      setCountryFilter: state.setCountryFilter,
      setEntityTypeFilter: state.setEntityTypeFilter,
      setStatusFilter: state.setStatusFilter,
      clearFilters: state.clearFilters,
      hasActiveFilters: state.hasActiveFilters,
    }))
  );

  const [countryQuery, setCountryQuery] = useState("");

  const availableCountries = useMemo(() => {
    const unique = new Set<string>();

    for (const entity of Object.values(entities)) {
      const normalized = normalizeCountryValue(entity.metadata.country);
      if (normalized) {
        unique.add(normalized);
      }
    }

    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [entities]);

  const selectedCountrySet = useMemo(
    () => new Set(filters.countries.map((country) => normalizeCountryValue(country))),
    [filters.countries]
  );

  const countrySuggestions = useMemo(() => {
    const query = countryQuery.trim().toUpperCase();
    if (!query) {
      return [];
    }

    return availableCountries
      .filter(
        (country) =>
          country.includes(query) && !selectedCountrySet.has(normalizeCountryValue(country))
      )
      .slice(0, 8);
  }, [availableCountries, countryQuery, selectedCountrySet]);

  const selectedEntityTypeSet = useMemo(
    () => new Set(filters.entityTypes.map((value) => normalizeEntityTypeValue(value))),
    [filters.entityTypes]
  );

  const toggleEntityType = (label: string) => {
    const normalized = normalizeEntityTypeValue(label);
    const next = filters.entityTypes.filter(
      (value) => normalizeEntityTypeValue(value) !== normalized
    );

    if (!selectedEntityTypeSet.has(normalized)) {
      next.push(label);
    }

    setEntityTypeFilter(next);
  };

  const addCountry = (countryValue: string) => {
    const normalized = normalizeCountryValue(countryValue);
    if (!normalized || filters.countries.length >= 5) {
      return;
    }

    if (selectedCountrySet.has(normalized)) {
      return;
    }

    setCountryFilter([...filters.countries, normalized]);
    setCountryQuery("");
  };

  const removeCountry = (country: string) => {
    setCountryFilter(
      filters.countries.filter(
        (value) => normalizeCountryValue(value) !== normalizeCountryValue(country)
      )
    );
  };

  return (
    <div
      className={`fixed bottom-8 left-[72px] top-14 z-40 w-[240px] border-r border-[#1E2130] bg-[#0F1117] transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1E2130] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
            Filters
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#1E2130] bg-[#141824] p-1 text-[#64748B] transition-colors hover:text-[#F8FAFC]"
            aria-label="Close filters"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <section className="mb-4">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Entity Type
            </h3>
            <div className="space-y-1.5">
              {ENTITY_TYPE_OPTIONS.map((option) => {
                const selected = selectedEntityTypeSet.has(normalizeEntityTypeValue(option));

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleEntityType(option)}
                    className="flex w-full items-center justify-between rounded-md border border-[#1E2130] bg-[#141824] px-2.5 py-2 text-left"
                  >
                    <span className="text-[12px] text-[#F8FAFC]">{option}</span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selected
                          ? "border-[#22C55E] bg-[#22C55E] text-[#080A0F]"
                          : "border-[#64748B] bg-transparent text-transparent"
                      }`}
                    >
                      <Check size={10} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Status
            </h3>
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map((option) => {
                const selected = filters.statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className="flex w-full items-center gap-2 rounded-md border border-[#1E2130] bg-[#141824] px-2.5 py-2 text-left"
                  >
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        selected
                          ? "border-[#22C55E] bg-[#22C55E]"
                          : "border-[#64748B] bg-transparent"
                      }`}
                    />
                    <span className="text-[12px] text-[#F8FAFC]">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Country
            </h3>
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748B]"
              />
              <input
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCountry(countryQuery);
                  }
                }}
                placeholder="Country name or code"
                className="h-9 w-full rounded-md border border-[#1E2130] bg-[#141824] pl-8 pr-2 text-[12px] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none"
              />
            </div>

            {countrySuggestions.length > 0 && (
              <div className="mt-2 max-h-28 overflow-y-auto rounded-md border border-[#1E2130] bg-[#141824] p-1">
                <div className="flex flex-wrap gap-1">
                  {countrySuggestions.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => addCountry(country)}
                      className="rounded-full border border-[#1E2130] bg-[#0F1117] px-2 py-1 text-[11px] text-[#F8FAFC] transition-colors hover:border-[#334155]"
                    >
                      {formatCountryLabel(country)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filters.countries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {filters.countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => removeCountry(country)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#1E2130] bg-[#141824] px-2 py-1 text-[11px] text-[#F8FAFC]"
                  >
                    {formatCountryLabel(country)}
                    <X size={11} className="text-[#64748B]" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="border-t border-[#1E2130] px-3 py-3">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
            className="w-full rounded-md bg-[#1E2130] px-3 py-2 text-[12px] font-medium text-[#64748B] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
