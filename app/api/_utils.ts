export const limiter = (()=>{
  const hits = new Map<string, {count:number, ts:number}>();
  return (key:string, max=20, windowMs=60_000) => {
    const now = Date.now();
    const v = hits.get(key);
    if (!v || now - v.ts > windowMs) { hits.set(key, {count:1, ts:now}); return true; }
    v.count++; v.ts = now;
    hits.set(key, v);
    return v.count <= max;
  };
})();
