exports.handler = async function (event, context) {
  const headers = { 'Content-Type': 'application/json' };

  if (!context.clientContext || !context.clientContext.identity) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Identity tidak tersedia' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}

  const secret = process.env.BOOTSTRAP_SECRET || '';
  if (!secret || body.secret !== secret) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Secret salah' }) };
  }
  if (!body.email || !body.password) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email dan password wajib diisi' }) };
  }

  const { url, token } = context.clientContext.identity;

  const listRes = await fetch(url + '/admin/users?per_page=100', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const listData = await listRes.json();
  const users = listData.users || listData || [];
  const user = Array.isArray(users) ? users.find(u => u.email === body.email) : null;

  if (!user) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'User tidak ditemukan' }) };
  }

  const upRes = await fetch(url + '/admin/users/' + user.id, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password: body.password, email_confirm: true })
  });
  const upText = await upRes.text();

  if (!upRes.ok) {
    return { statusCode: upRes.status, headers, body: JSON.stringify({ error: upText }) };
  }
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
