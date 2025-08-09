# Genshin Analytics – HoYoLAB Auto-Fetch (MVP)

This build adds **auto-fetch** flows:

1. **Characters/Overview via HoYoLAB** – paste your HoYoLAB cookies (ltoken_v2, ltuid_v2 or cookie_token_v2 + account_id_v2) and UID.
2. **Wish History via Authkey URL** – paste the **Wish History URL** copied from the in-game "History" page (opens in your browser).

> **Privacy**: Cookies are only used for the single request you trigger and are **not stored on the server**. Locally, your inputs are kept in `localStorage` so you don't retype them.

### Endpoints used (OS/global):
- Game record overview: `https://bbs-api-os.hoyolab.com/game_record/genshin/api/index`
- Character details: `https://bbs-api-os.hoyolab.com/game_record/genshin/api/character`
- Gacha history: `https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog`

These endpoints may change or require additional headers (DS, x-rpc-*). For production, wire a DS signer and proper UA/device headers.
