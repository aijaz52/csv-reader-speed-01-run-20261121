// Fast drop-in for csv-reader 1.0.0 (make.fun csv-reader-speed-01-run-20261121).
// Same broken-row policy and answers as the house reference, read by code-unit
// scanning with slice-based field building instead of one character at a time.

const END = 2;
const COMMA = 0;
const LINE_BREAK = 1;

const QUOTE = 34; // "
const COMMA_C = 44;
const LF = 10;
const CR = 13;
const BOM = 0xfeff;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  const n = text.length;
  let i = text.charCodeAt(0) === BOM ? 1 : 0;
  let line = 1;
  let recordLine = 1;
  let recordRow = null;

  // Reads an unquoted run from `start` (value prefix in `segs`) up to the next
  // comma or line break; a lone CR outside quotes is dropped (stray_cr).
  // Returns the joined value, how the field ended, and how many characters
  // were kept (for the quote_junk test).
  function readRun(segs, start) {
    let kept = 0;
    let p = start;
    let ended = END;
    scan: while (p < n) {
      const c = text.charCodeAt(p);
      if (c === COMMA_C) {
        segs.push(text.slice(start, p));
        kept += p - start;
        p += 1;
        ended = COMMA;
        break scan;
      }
      if (c === LF) {
        segs.push(text.slice(start, p));
        kept += p - start;
        p += 1;
        line += 1;
        ended = LINE_BREAK;
        break scan;
      }
      if (c === CR) {
        if (text.charCodeAt(p + 1) === LF) {
          segs.push(text.slice(start, p));
          kept += p - start;
          p += 2;
          line += 1;
          ended = LINE_BREAK;
          break scan;
        }
        segs.push(text.slice(start, p));
        kept += p - start;
        start = p + 1;
        errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
        p += 1;
        continue;
      }
      p += 1;
    }
    if (ended === END) {
      segs.push(text.slice(start));
      kept += p - start;
    }
    i = p;
    return { value: segs.join(''), ended, kept };
  }

  while (true) {
    // Skip lines with no characters.
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === LF) {
        i += 1;
        line += 1;
      } else if (c === CR && text.charCodeAt(i + 1) === LF) {
        i += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (i >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let lastQuoted = false;

    // One field at a time; a field ends at a comma (record goes on), at a
    // line break or at the end of the text (record ends).
    let ended;
    do {
      ended = END;
      if (text.charCodeAt(i) === QUOTE) {
        lastQuoted = true;
        const open = i;
        const openLine = line;
        const segs = [];
        let segStart = ++i;
        let closed = false;
        while (i < n) {
          const c = text.charCodeAt(i);
          if (c === QUOTE) {
            if (text.charCodeAt(i + 1) === QUOTE) {
              segs.push(text.slice(segStart, i), '"');
              i += 2;
              segStart = i;
              continue;
            }
            segs.push(text.slice(segStart, i));
            i += 1;
            closed = true;
            break;
          }
          if (c === CR) {
            // CRLF and a lone CR inside quotes are each one LF.
            segs.push(text.slice(segStart, i), '\n');
            line += 1;
            i += text.charCodeAt(i + 1) === LF ? 2 : 1;
            segStart = i;
            continue;
          }
          if (c === LF) line += 1;
          i += 1;
        }
        if (!closed) {
          // The quote never closes: a literal character, the rest read again
          // as an unquoted field (unterminated_quote).
          i = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          const r = readRun(['"'], i);
          fields.push(r.value);
          ended = r.ended;
          continue;
        }
        if (i >= n) {
          ended = END;
        } else {
          const c = text.charCodeAt(i);
          if (c === COMMA_C) {
            i += 1;
            ended = COMMA;
          } else if (c === LF) {
            i += 1;
            line += 1;
            ended = LINE_BREAK;
          } else if (c === CR && text.charCodeAt(i + 1) === LF) {
            i += 2;
            line += 1;
            ended = LINE_BREAK;
          } else {
            // What follows the closing quote is appended as it stands, up to
            // the next comma or line break; quote_junk when characters were kept.
            const r = readRun([segs.join('')], i);
            fields.push(r.value);
            if (r.kept > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
            ended = r.ended;
            continue;
          }
        }
        fields.push(segs.join(''));
        continue;
      }
      // Unquoted field.
      const r = readRun([], i);
      fields.push(r.value);
      ended = r.ended;
      lastQuoted = false;
      continue;
    } while (ended === COMMA);

    // A line left with no characters (stray CRs only) is no record.
    if (fields.length === 1 && fields[0] === '' && !lastQuoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
