import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { EventsListPage } from '../features/events/pages/EventsListPage'
import { OffersPage } from '../features/offers/pages/OffersPage'
import { MatrixPage } from '../features/matrix/pages/MatrixPage'
import { KanbanPage } from '../features/kanban/pages/KanbanPage'
import { MapPage } from '../features/map/pages/MapPage'
import { ParametersPage } from '../features/parameters/pages/ParametersPage'
import { AdminUsersPage } from '../pages/AdminUsersPage'
import { AuditPage } from '../pages/AuditPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'ordenes', element: <EventsListPage /> },
      { path: 'ofertas', element: <OffersPage /> },
      { path: 'matriz', element: <MatrixPage /> },
      { path: 'tablero', element: <KanbanPage /> },
      { path: 'mapa', element: <MapPage /> },
      { path: 'parametros', element: <ParametersPage /> },
      { path: 'usuarios', element: <AdminUsersPage /> },
      { path: 'auditoria', element: <AuditPage /> },
    ],
  },
])
