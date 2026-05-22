import { useState } from 'react'
import { UsersTab } from './tabs/UsersTab'
import type { AdminConfig } from './api/adminApi'

function App() {
  // Config compartilhada com todos os tabs — equivalente a um ViewModel no nível da Activity
  const [config, setConfig] = useState<AdminConfig>({
    baseUrl: 'http://localhost:8080',
    adminKey: 'esparta-admin-2026',
  })

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      {/* Barra de configuração */}
      <header style={{ background: '#1a1a2e', color: '#fff', padding: '16px 24px' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Esparta Admin</h1>
      </header>

      <div style={{ background: '#fff', borderBottom: '1px solid #ddd', padding: '10px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ fontSize: 13, color: '#555' }}>Backend</label>
        <input
          style={{ fontSize: 13, border: '1px solid #ccc', borderRadius: 6, padding: '5px 10px', width: 280 }}
          value={config.baseUrl}
          onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
        />
        <label style={{ fontSize: 13, color: '#555' }}>Admin Key</label>
        <input
          style={{ fontSize: 13, border: '1px solid #ccc', borderRadius: 6, padding: '5px 10px', width: 200 }}
          value={config.adminKey}
          onChange={(e) => setConfig({ ...config, adminKey: e.target.value })}
        />
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: 860, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.08)', padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1a2e' }}>Usuários</h2>
        <UsersTab config={config} />
      </div>

    </div>
  )
}

export default App
