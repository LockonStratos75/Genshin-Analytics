import crypto from 'crypto';

// DS v2 generator used by HoYoLAB game_record (web) requests
// Formula: md5(`salt=${salt}&t=${t}&r=${r}&b=${body}&q=${query}`)
// body: JSON string for POST; '' for GET
// query: sorted query string like 'role_id=xxxx&server=os_asia'
const SALT_V2 = "6s25p5ox5y14umn1p61aqyyvbvvl3lrt"; // commonly used public salt

export function genDSv2(query: string, body: string = ""): string {
  const t = Math.floor(Date.now() / 1000).toString();
  const r = Math.random().toString(16).slice(2, 8); // 6-hex random
  const c = crypto.createHash("md5")
    .update(`salt=${SALT_V2}&t=${t}&r=${r}&b=${body}&q=${query}`)
    .digest("hex");
  return `${t},${r},${c}`;
}

// Some endpoints still accept v1 (without body/query). Keep as fallback.
const SALT_V1 = "xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs";
export function genDSv1(): string {
  const t = Math.floor(Date.now() / 1000).toString();
  const r = Math.random().toString(16).slice(2, 8);
  const c = crypto.createHash("md5").update(`salt=${SALT_V1}&t=${t}&r=${r}`).digest("hex");
  return `${t},${r},${c}`;
}
