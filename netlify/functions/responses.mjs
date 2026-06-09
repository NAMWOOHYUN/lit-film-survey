// 관리자 페이지가 호출하는 함수. Netlify Forms에 쌓인 'survey' 응답을 읽어 JSON으로 돌려줍니다.
export default async () => {
  const token = process.env.NETLIFY_API_TOKEN;
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

  if (!token) return json({ error: "NO_TOKEN" });

  const FORM_NAME = "survey";
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  try {
    const fr = await fetch("https://api.netlify.com/api/v1/forms", auth);
    if (!fr.ok) return json({ error: "FORMS_" + fr.status });
    const forms = await fr.json();
    const form = (forms || []).find(f => f.name === FORM_NAME);
    if (!form) return json({ rows: [] });

    const all = [];
    for (let page = 1; page <= 10; page++) {
      const sr = await fetch(`https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=100&page=${page}`, auth);
      if (!sr.ok) break;
      const batch = await sr.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < 100) break;
    }
    const rows = all.map(s => ({ created_at: s.created_at, ...(s.data || {}) }));
    return json({ rows });
  } catch (e) {
    return json({ error: "EXCEPTION" });
  }
};
