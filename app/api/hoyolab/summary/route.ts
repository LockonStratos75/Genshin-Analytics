import { NextRequest, NextResponse } from "next/server";
import { limiter } from "@/app/api/_utils";
import { genDSv2, genDSv1 } from "@/app/api/_ds";

const SUMMARY_URL = "https://bbs-api-os.hoyolab.com/game_record/genshin/api/index";

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
  const query = `role_id=${encodeURIComponent(uid)}&server=${encodeURIComponent(server)}`;

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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
  };

  // Build DS v2
  const headers = {
    ...baseHeaders,
    "DS": genDSv2(query, "")
  };

  const url = `${SUMMARY_URL}?${query}`;
  let res = await fetch(url, { headers });
  let data: any = await res.json().catch(()=>({}));

  // Fallback to DS v1 if v2 rejected
  if (data?.retcode && data.retcode !== 0) {
    const h2 = { ...baseHeaders, "DS": genDSv1() };
    res = await fetch(url, { headers: h2 });
    data = await res.json().catch(()=>({}));
  }

  return NextResponse.json(data);
}

function cryptoRandomId(){
  // 32-char hex
  let s = ""; const hex = "abcdef0123456789";
  for(let i=0;i<32;i++) s += hex[Math.floor(Math.random()*hex.length)];
  return s;
}
