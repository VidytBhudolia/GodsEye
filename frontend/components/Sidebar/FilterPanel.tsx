"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useMapStore } from "@/store/useMapStore";
import type { EntityType } from "@/types/contract";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
};

const ENTITY_TYPE_OPTIONS: Array<{ value: EntityType; label: string }> = [
  { value: "aircraft", label: "Flights" },
  { value: "ship", label: "Ships" },
  { value: "satellite", label: "Satellites" },
  { value: "signal", label: "Signals" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

function formatCountryLabel(rawCountry: string): string {
  return rawCountry
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

  useEffect(() => {
    if (!open) {
      setCountryQuery("");
    }
  }, [open]);

  const availableCountries = useMemo(() => {
    const uniqueCountries = new Map<string, string>();

    for (const entity of Object.values(entities)) {
      const country = entity.metadata.country?.trim();
      if (!country) {
        continue;
      }

      const normalized = country.toLowerCase();
      if (!uniqueCountries.has(normalized)) {
        uniqueCountries.set(normalized, formatCountryLabel(country));
      }
    }

    return Array.from(uniqueCountries.values()).sort((a, b) => a.localeCompare(b));
  }, [entities]);

  const selectedCountrySet = useMemo(
    () => new Set(filters.countries.map((country) => country.toLowerCase())),
    [filters.countries]
  );

  const countrySuggestions = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return availableCountries
      .filter(
        (country) =>
          country.toLowerCase().includes(query) &&
          !selectedCountrySet.has(country.toLowerCase())
      )
      .slice(0, 8);
  }, [availableCountries, countryQuery, selectedCountrySet]);

  const filtersAreActive = hasActiveFilters();

  const addCountry = (country: string) => {
    if (filters.countries.length >= 5) {
      return;
    }

    const normalizedCountry = formatCountryLabel(country);
    const alreadySelected = filters.countries.some(
      (value) => value.toLowerCase() === normalizedCountry.toLowerCase()
    );

    if (alreadySelected) {
      return;
    }

    setCountryFilter([...filters.countries, normalizedCountry]);
    setCountryQuery("");
  };

  const removeCountry = (country: string) => {
    setCountryFilter(
      filters.countries.filter((value) => value.toLowerCase() !== country.toLowerCase())
    );
  };

  return (
    <div
      className={`fixed bottom-8 left-[72px] top-14 z-40 w-[320px] border-r border-[#1E2130] bg-[#0F1117]/95 backdrop-blur-md transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#1E2130] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Filters
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">Limit entities displayed on the map</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#1E2130] bg-[#141824] p-1.5 text-[#64748B] transition-colors hover:text-[#F8FAFC]"
            aria-label="Close filters"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <section className="mb-5">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Entity Type
            </h3>
            <div className="space-y-2">
              {ENTITY_TYPE_OPTIONS.map((option) => {
                const checked = filters.entityTypes.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-[#1E2130] bg-[#141824] px-3 py-2"
                  >
                    <span className="text-sm text-[#F8FAFC]">{option.label}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#22C55E]"
                      checked={checked}
                      onChange={(event) =>
                        setEntityTypeFilter(option.value, event.target.checked)
                      }
                    />
                  </label>
                );
              })}
            </div>
          </section>

          <section className="mb-5">
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
              Status
            </h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => {
                const selected = filters.statusFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "border-[#22C55E] bg-[#14532D]/50 text-[#22C55E]"
                        : "border-[#1E2130] bg-[#141824] text-[#F8FAFC]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {selected && <Check size={14} />}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">
                Country
              </h3>
              <span className="text-[10px] text-[#64748B]">{filters.countries.length}/5</span>
            </div>
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              />
              <input
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder="Search countries"
                className="h-9 w-full rounded-md border border-[#1E2130] bg-[#141824] pl-9 pr-3 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#38BDF8] focus:outline-none"
              />
            </div>

            {countrySuggestions.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-[#1E2130] bg-[#0F1117]">
                {countrySuggestions.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => addCountry(country)}
                    className="block w-full border-b border-[#1E2130] px-3 py-2 text-left text-sm text-[#F8FAFC] transition-colors last:border-b-0 hover:bg-[#141824]"
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}

            {filters.countries.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => removeCountry(country)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#1E2130] bg-[#141824] px-2.5 py-1 text-xs text-[#F8FAFC] transition-colors hover:border-[#334155]"
                  >
                    {country}
                    <X size={12} className="text-[#64748B]" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#64748B]">No country filters selected</p>
            )}
          </section>
        </div>

        <div className="border-t border-[#1E2130] px-4 py-3">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersAreActive}
            className="w-full rounded-md border border-[#1E2130] bg-[#141824] px-3 py-2 text-sm font-medium text-[#F8FAFC] transition-colors enabled:hover:border-[#334155] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </div>
  );
}
