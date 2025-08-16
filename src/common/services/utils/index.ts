export function stringify(obj: any) {
  try {
      return JSON.stringify(obj);
  } catch {
      return obj;
  }
}

export function parse(obj: any) {
    try {
        return JSON.parse(obj);
    } catch {
        return obj;
    }
}