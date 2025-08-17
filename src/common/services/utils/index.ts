export function stringify(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch {
    return obj;
  }
}

export function stringifyForLog(value: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, val) => {
      if (typeof val === 'bigint') return val.toString();
      if (val instanceof Map) return { type: 'Map', entries: Array.from(val.entries()) };
      if (val instanceof Set) return { type: 'Set', values: Array.from(val.values()) };
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    },
    2,
  );
}
