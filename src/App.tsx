import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { MisconfigurationsPage } from './pages/MisconfigurationsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { RankingPage } from './pages/RankingPage';
import { useMisconfigurations } from './hooks/useMisconfigurations';
import { useAuth } from './hooks/useAuth';

export function App() {
  const {
    data,
    allData,
    filters,
    resolvers,
    updateFilter,
    clearFilters,
    assignResolver,
    updateTicket,
    createTicket,
    importTickets,
    addResolver,
    removeResolver,
    removeAllResolvers,
    updateResolver,
    deleteTicket,
    deleteAllTickets
  } = useMisconfigurations();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                <Header resolvers={resolvers} onImport={importTickets} onCreate={createTicket} />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<Dashboard data={allData} resolvers={resolvers} onAssign={assignResolver} />} />
                    <Route path="/misconfigurations" element={<MisconfigurationsPage data={data} resolvers={resolvers} filters={filters} onUpdateFilter={updateFilter} onClearFilters={clearFilters} onAssign={assignResolver} onDelete={deleteTicket} />} />
                    <Route path="/ranking" element={<RankingPage data={allData} resolvers={resolvers} />} />
                    <Route path="/ticket/:id" element={<TicketDetailPage data={allData} resolvers={resolvers} onUpdate={updateTicket} onDelete={deleteTicket} />} />
                    <Route
                      path="/settings"
                      element={
                        <RoleProtectedRoute allowedRoles={['admin']}>
                          <SettingsPage resolvers={resolvers} onAddResolver={async (resolver) => { await addResolver(resolver); }} onRemoveResolver={async (email) => { await removeResolver(email); }} onRemoveAllResolvers={async () => { await removeAllResolvers(); }} onUpdateResolver={async (oldEmail, updatedResolver) => { await updateResolver(oldEmail, updatedResolver); }} onDeleteAllTickets={deleteAllTickets} allDataCount={allData.length} />
                        </RoleProtectedRoute>
                      }
                    />
                    <Route
                      path="/users"
                      element={
                        <RoleProtectedRoute allowedRoles={['admin']}>
                          <UsersPage />
                        </RoleProtectedRoute>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}