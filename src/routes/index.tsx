import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { EventCreatePage } from '../features/events/pages/EventCreatePage'
import { EventViewPage } from '../features/events/pages/EventViewPage'
import { EventDetailPage } from '../features/events/pages/EventDetailPage'
import { OffersPage } from '../features/offers/pages/OffersPage'
import { OfferViewPage } from '../features/offers/pages/OfferViewPage'
import { MatrixPage } from '../features/matrix/pages/MatrixPage'
import { KanbanPage } from '../features/kanban/pages/KanbanPage'
import { MapPage } from '../features/map/pages/MapPage'
import { ParametersPage } from '../features/parameters/pages/ParametersPage'
import { AdminUsersPage } from '../pages/AdminUsersPage'
import { BackupPage } from '../pages/BackupPage'
import { AuditPage } from '../pages/AuditPage'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { RoleRoute } from '../features/auth/components/RoleRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'ordenes', element: <EventsListPage /> },
          {
            path: 'ordenes/nueva',
            element: (
              <RoleRoute roles={['functional_admin', 'solicitante']}>
                <EventCreatePage />
              </RoleRoute>
            ),
          },
          { path: 'ordenes/:id', element: <EventViewPage /> },
          {
            path: 'ordenes/:id/editar',
            element: (
              <RoleRoute roles={['functional_admin', 'supervisor', 'analista', 'solicitante']}>
                <EventDetailPage />
              </RoleRoute>
            ),
          },
          { path: 'ofertas', element: <OffersPage /> },
          { path: 'ofertas/:id', element: <OfferViewPage /> },
          { path: 'matriz', element: <RoleRoute roles={['technical_admin', 'functional_admin', 'approver', 'analista', 'supervisor', 'auditor', 'consulta']}><MatrixPage /></RoleRoute> },
          { path: 'tablero', element: <RoleRoute roles={['technical_admin', 'functional_admin', 'approver', 'analista', 'supervisor', 'auditor', 'consulta']}><KanbanPage /></RoleRoute> },
          { path: 'mapa', element: <RoleRoute roles={['technical_admin', 'functional_admin', 'approver', 'analista', 'supervisor', 'auditor', 'consulta']}><MapPage /></RoleRoute> },
          {
            path: 'parametros',
            element: (
              <RoleRoute roles={['functional_admin']}>
                <ParametersPage />
              </RoleRoute>
            ),
          },
          {
            path: 'usuarios',
            element: (
              <RoleRoute roles={['technical_admin']}>
                <AdminUsersPage />
              </RoleRoute>
            ),
          },
          {
            path: 'respaldo',
            element: (
              <RoleRoute roles={['technical_admin']}>
                <BackupPage />
              </RoleRoute>
            ),
          },
          {
            path: 'auditoria',
            element: (
              <RoleRoute roles={['technical_admin', 'functional_admin', 'supervisor', 'approver', 'auditor']}>
                <AuditPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
