"use client";

import { useEffect, useState } from "react";

export interface ReferenceOption {
  code: string;
  label: string;
}

/**
 * A typeahead input constrained to the seeded reference catalog: the user
 * can only select a real option returned by `search`, never submit free
 * text as a code — this is what keeps LoggedFlight's airport/airline
 * references valid without the server needing to reject bad input after
 * the fact (though it still does, as defense in depth).
 */
export function ReferenceSearchField({
  id,
  label,
  placeholder,
  search,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  placeholder: string;
  search: (query: string) => Promise<ReferenceOption[]>;
  selected: ReferenceOption | null;
  onSelect: (option: ReferenceOption | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<ReferenceOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim() || selected) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      search(query)
        .then((results) => {
          if (!cancelled) setOptions(results);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected, search]);

  return (
    <div className="relative">
      <label htmlFor={id} className="text-xs text-text-secondary">
        {label}
      </label>
      {selected ? (
        <div className="mt-1 flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary">
          <span>{selected.label}</span>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="text-xs text-sky-600 hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-sky-500 focus:outline-none"
        />
      )}
      {open && !selected && options.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface-raised shadow-ui">
          {options.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-sky-500/10"
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
