import { useState } from 'react'
import { UsersTab } from './tabs/users/UsersTab'
import { PoliciesTab } from './tabs/policies/PoliciesTab'
import { ClaimsTab } from './tabs/claims/ClaimsTab'
import { QuotesTab } from './tabs/quotes/QuotesTab'
import type { AdminConfig } from './api/adminApi'

type Tab = 'users' | 'policies' | 'claims' | 'quotes'

const TABS: { id: Tab; label: string }[] = [
  { id: 'users',    label: 'Usuários' },
  { id: 'policies', label: 'Apólices' },
  { id: 'claims',   label: 'Sinistros' },
  { id: 'quotes',   label: 'Cotações' },
]

function App() {
  const [config, setConfig] = useState<AdminConfig>({
    baseUrl: 'http://localhost:8080',
    adminKey: 'esparta-admin-2026',
  })
  // activeTab = equivalente ao backstack/NavController no Android
  const [activeTab, setActiveTab] = useState<Tab>('users')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

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

      {/* Tab bar — equivalente ao BottomNavigationView ou TabLayout no Android */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #e0e0e0', padding: '0 24px' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              fontSize: 14,
              cursor: 'pointer',
              color: activeTab === t.id ? '#1a1a2e' : '#666',
              borderBottom: activeTab === t.id ? '3px solid #1a1a2e' : '3px solid transparent',
              fontWeight: activeTab === t.id ? 600 : 400,
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 860, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,.08)', padding: 28 }}>
        {activeTab === 'users'    && <UsersTab    config={config} />}
        {activeTab === 'policies' && <PoliciesTab config={config} />}
        {activeTab === 'claims'   && <ClaimsTab   config={config} />}
        {activeTab === 'quotes'   && <QuotesTab   config={config} />}
      </div>

    </div>
  )
}

export default App
