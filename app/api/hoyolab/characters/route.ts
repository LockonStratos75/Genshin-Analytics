import { NextRequest, NextResponse } from "next/server";
import { limiter } from "@/app/api/_utils";
import { genDSv2, genDSv1 } from "@/app/api/_ds";

const INDEX_URL = "https://bbs-api-os.hoyolab.com/game_record/genshin/api/index";
const CHAR_URL = "https://bbs-api-os.hoyolab.com/game_record/genshin/api/character";

export async function POST(req: NextRequest){
  if (!limiter(req.ip ?? "anon")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  const { uid, server, cookies } = await req.json();
  if (!uid || !server || !(cookies?.ltoken_v2 || cookies?.cookie_token_v2)) {
    return NextResponse.json({ error: "Missing uid/server/cookies" }, { status: 400 });
  }
  const cookieParts = [];
  if (cookies.ltoken_v2) cookieParts.push(`ltoken_v2=${cookies.ltoken_v2}`);
  if (cookies.ltuid_v2) cookieParts.push(`ltuid_v2=${cookies.ltuid_v2}`);
  if (cookies.cookie_token_v2) cookieParts.push(`cookie_token_v2=${cookies.cookie_token_v2}`);
  if (cookies.account_id_v2) cookieParts.push(`account_id_v2=${cookies.account_id_v2}`);
  const baseHeaders: Record<string,string> = {
    "Cookie": cookieParts.join("; ") + ";",
    "x-rpc-app_version": "2.62.1",
    "x-rpc-client_type": "5",
    "x-rpc-language": "en-us",
    "x-rpc-device_id": cryptoRandomId(),
    "x-rpc-device_model": "Windows 10",
    "x-rpc-sys_version": "10",
    "Referer": "https://www.hoyolab.com/",
    "Origin": "https://www.hoyolab.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Content-Type": "application/json"
  };

  // 1) Get avatar IDs from index
  const q = `role_id=${encodeURIComponent(uid)}&server=${encodeURIComponent(server)}`;
  let headers = { ...baseHeaders, "DS": genDSv2(q, "") };
  let res = await fetch(`${INDEX_URL}?${q}`, { headers });
  let idx = await res.json().catch(()=>({}));

  if (idx?.retcode && idx.retcode !== 0) {
    headers = { ...baseHeaders, "DS": genDSv1() };
    res = await fetch(`${INDEX_URL}?${q}`, { headers });
    idx = await res.json().catch(()=>({}));
  }
  if (idx?.retcode && idx.retcode !== 0) return NextResponse.json(idx);

  const avatarIds: number[] = (idx?.data?.avatars ?? []).map((a:any)=>a.id).filter(Boolean);
  // If index didn't contain avatars, still attempt character with empty ids (some accounts allow it)
  const bodyObj: any = { role_id: String(uid), server, character_ids: avatarIds };

  // 2) Request character details with IDs
  const body = JSON.stringify(bodyObj);
  headers = { ...baseHeaders, "DS": genDSv2(q, body) };
  res = await fetch(CHAR_URL, { method: "POST", headers, body });
  let payload: any = await res.json().catch(()=>({}));
  if (payload?.retcode && payload.retcode !== 0) {
    headers = { ...baseHeaders, "DS": genDSv1() };
    res = await fetch(CHAR_URL, { method: "POST", headers, body });
    payload = await res.json().catch(()=>({}));
  }
  if (payload?.retcode && payload.retcode !== 0) return NextResponse.json(payload);

  const characters = (payload?.data?.list ?? payload?.data?.avatars ?? []).map((a:any) => ({
    name: a.name, element: a.element, level: a.level, constellations: a.actived_constellation_num
  }));
  return NextResponse.json({ retcode: 0, characters });
}

function cryptoRandomId(){
  let s = ""; const hex = "abcdef0123456789";
  for(let i=0;i<32;i++) s += hex[Math.floor(Math.random()*hex.length)];
  return s;
}
