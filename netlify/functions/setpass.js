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
  const auth = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const logs = [];

  // 1) Cari user berdasarkan email
  const listRes = await fetch(url + '/admin/users?per_page=100', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const listData = await listRes.json();
  const users = listData.users || listData || [];
  const user = Array.isArray(users) ? users.find(u => u.email === body.email) : null;
  logs.push('user lama: ' + (user ? user.id + ' | confirmed_at=' + user.confirmed_at : 'tidak ada'));

  // 2) Hapus user lama (yang statusnya belum confirmed)
  if (user) {
    const delRes = await fetch(url + '/admin/users/' + user.id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    logs.push('hapus user lama -> ' + delRes.status);
  }

  // 3) Buat user baru: langsung berpassword DAN terkonfirmasi
  const createRes = await fetch(url + '/admin/users', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ email: body.email, password: body.password, email_confirm: true })
  });
  const created = await createRes.text();
  logs.push('buat user baru -> ' + createRes.status + ' : ' + created.slice(0, 200));

  if (!createRes.ok) {
    return { statusCode: createRes.status, headers, body: JSON.stringify({ error: created, logs: logs }) };
  }
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, logs: logs }) };
};
