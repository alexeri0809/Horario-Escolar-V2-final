async function getMe() {
  try {
    const r = await fetch('/api/me')
    if (!r.ok) return null
    return await r.json()
  } catch { return null }
}

async function requireLogin() {
  const user = await getMe()
  if (!user) { window.location.href = '/login.html'; return null }
  return user
}

function applyRole(user) {
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(',').map(r => r.trim())
    if (!roles.includes(user.cargo)) el.style.display = 'none'
  })

  const userInfo = document.getElementById('user-info')
  if (userInfo) {
    const emoji = { aluno: '🎒', professor: '🧑‍🏫', diretor: '🏫' }[user.cargo] || '👤'
    userInfo.innerHTML = `
      <div style="padding:20px 22px 6px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:1.5rem">${emoji}</span>
          <div>
            <div style="font-size:0.88rem;font-weight:700;color:#fff;letter-spacing:-0.01em">${user.nome || user.username}</div>
            <div style="font-size:0.7rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.08em;margin-top:1px">${user.cargo}</div>
          </div>
        </div>
      </div>
    `
  }
}

async function logout() {
  try { await fetch('/api/logout', { method: 'POST' }) } catch {}
  window.location.href = '/login.html'
}