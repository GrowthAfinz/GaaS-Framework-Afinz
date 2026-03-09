import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { PeriodProvider } from './contexts/PeriodContext'
import { BUProvider } from './contexts/BUContext'
import { AuthProvider } from './context/AuthContext';
import { UserRoleProvider } from './context/UserRoleContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PeriodProvider>
      <BUProvider>
        <AuthProvider>
          <UserRoleProvider>
            <App />
          </UserRoleProvider>
        </AuthProvider>
      </BUProvider>
    </PeriodProvider>
  </React.StrictMode>,
)
