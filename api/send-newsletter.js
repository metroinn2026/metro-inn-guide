const { createClient } = require("@supabase/supabase-js");

const esc = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const validHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};

function emailHtml({ subject, intro, article, unsubscribeUrl }) {
  const image = validHttpUrl(article.image);
  const link = validHttpUrl(article.url);
  return `<!doctype html><html><body style="margin:0;background:#f4f2eb;font-family:Arial,'Noto Sans TC',sans-serif;color:#333"><div style="display:none;max-height:0;overflow:hidden">${esc(subject)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2eb;padding:28px 12px"><tr><td align="center"><table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;width:100%;background:#fff"><tr><td style="padding:28px 34px 18px;border-top:7px solid #526b4e"><div style="font-size:13px;letter-spacing:2px;color:#526b4e;font-weight:bold">METRO INN GUIDE</div><h1 style="font-size:28px;line-height:1.4;margin:10px 0">${esc(subject)}</h1>${intro ? `<p style="font-size:16px;line-height:1.8">${esc(intro).replace(/\n/g, "<br>")}</p>` : ""}</td></tr>${image ? `<tr><td><img src="${esc(image)}" alt="" width="620" style="width:100%;height:auto;display:block"></td></tr>` : ""}<tr><td style="padding:26px 34px 34px"><h2 style="font-size:23px;line-height:1.5;margin:0 0 12px">${esc(article.title)}</h2>${article.summary ? `<p style="font-size:16px;line-height:1.8;color:#555">${esc(article.summary).replace(/\n/g, "<br>")}</p>` : ""}${link ? `<p style="margin:28px 0 0"><a href="${esc(link)}" style="display:inline-block;background:#f3653b;color:#fff;text-decoration:none;padding:13px 22px;font-weight:bold">${esc(article.buttonText || "查看完整內容")}</a></p>` : ""}</td></tr><tr><td style="padding:20px 34px;background:#526b4e;color:#fff;font-size:12px;line-height:1.7">北投旅圖｜北捷行旅<br><a href="${esc(unsubscribeUrl)}" style="color:#fff">取消訂閱</a></td></tr></table></td></tr></table></body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL;
  const siteUrl = (
    process.env.PUBLIC_SITE_URL || "https://metro-inn-guide.vercel.app"
  ).replace(/\/$/, "");
  if (!supabaseUrl || !serviceKey || !resendKey || !fromEmail)
    return res.status(503).json({ error: "電子報環境變數尚未設定完整。" });
  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (!token) return res.status(401).json({ error: "請重新登入。" });
  const adminDb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await adminDb.auth.getUser(token);
  if (userError || !user)
    return res.status(401).json({ error: "登入已失效。" });
  const { data: profile } = await adminDb
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!["admin", "super_admin"].includes(profile?.role))
    return res.status(403).json({ error: "沒有寄送權限。" });
  const {
    mode = "test",
    testEmail,
    subject,
    intro = "",
    article = {},
  } = req.body || {};
  if (!subject || !article.title)
    return res.status(400).json({ error: "請填寫信件主旨並選擇文章。" });
  let recipients = [];
  if (mode === "test") {
    if (!testEmail)
      return res.status(400).json({ error: "請填寫測試收件 Email。" });
    recipients = [
      {
        email: String(testEmail).trim().toLowerCase(),
        unsubscribe_token: "00000000-0000-0000-0000-000000000000",
      },
    ];
  } else {
    const { data, error } = await adminDb
      .from("newsletter_subscribers")
      .select("email,unsubscribe_token")
      .eq("status", "active")
      .order("created_at")
      .limit(5000);
    if (error) return res.status(500).json({ error: error.message });
    recipients = data || [];
    if (!recipients.length)
      return res.status(400).json({ error: "目前沒有有效訂閱者。" });
  }
  let success = 0,
    failed = 0;
  for (let i = 0; i < recipients.length; i += 100) {
    const batch = recipients.slice(i, i + 100).map((person) => ({
      from: fromEmail,
      to: [person.email],
      subject: String(subject).slice(0, 180),
      html: emailHtml({
        subject,
        intro,
        article,
        unsubscribeUrl: `${siteUrl}/unsubscribe.html?token=${person.unsubscribe_token}`,
      }),
    }));
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });
    if (response.ok) success += batch.length;
    else failed += batch.length;
  }
  await adminDb.from("newsletter_campaigns").insert({
    subject: String(subject).slice(0, 180),
    content_type: article.type || null,
    content_id: article.id || null,
    content_title: String(article.title).slice(0, 300),
    recipient_count: recipients.length,
    success_count: success,
    failure_count: failed,
    status:
      mode === "test"
        ? "test"
        : failed
          ? success
            ? "partial"
            : "failed"
          : "sent",
    sent_by: user.id,
    sent_at: new Date().toISOString(),
  });
  return res.status(failed && !success ? 502 : 200).json({
    ok: failed === 0,
    recipient_count: recipients.length,
    success_count: success,
    failure_count: failed,
  });
};
