// Shared helpers for auto-capitalizing the first letter of a field's entry.
//
// Applied only to natural-language text inputs and textareas (names, titles,
// locations, descriptions, etc.). It is intentionally NOT used on email,
// password, URL, phone, numeric, date, search, or select fields — those must
// keep the exact text the user types.
//
// The rule is deliberately minimal: only the FIRST character of the value is
// upper-cased. Nothing else about the entry (length, other characters,
// validation) changes, so form behavior is preserved.

// Capitalize the first character of a string; leave the rest untouched.
export const capitalizeFirst = (value) => {
  if (typeof value !== 'string' || value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

// onChange handler for UNCONTROLLED inputs (those using defaultValue + FormData,
// e.g. the candidate profile form). It capitalizes the first character in place.
// Because only char 0 may change case, the value length is unchanged, so the
// caret position is preserved.
export const capitalizeUncontrolled = (event) => {
  const el = event.target;
  const next = capitalizeFirst(el.value);
  if (next !== el.value) {
    const caret = el.selectionStart;
    el.value = next;
    if (caret != null) {
      // setSelectionRange is only valid on text-like inputs; guard just in case.
      try { el.setSelectionRange(caret, caret); } catch (_) { /* ignore */ }
    }
  }
};
