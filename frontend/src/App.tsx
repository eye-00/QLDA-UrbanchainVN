import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import {
  ADMIN_ONLY_ROLES,
  CITIZEN_ROLES,
  DASHBOARD_ROLES,
  LAND_MANAGEMENT_ROLES,
  ROLE_LABELS,
  UserRole
} from './auth/roles';
import { CitizenRegistrationPage } from './pages/CitizenRegistrationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { OrganizationManagementPage } from './pages/OrganizationManagementPage';
import { LandManagementPage } from './pages/LandManagementPage';

function hasRole(role: UserRole | undefined, roles: UserRole[]) {
  return Boolean(role && roles.includes(role));
}

function HomeEntry() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hasRole(user.role, CITIZEN_ROLES)) return <CitizenRegistrationPage />;
  return <Navigate to="/dashboard" replace />;
}

export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>UrbanChain-VN</h1>
        <nav>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              {hasRole(user.role, CITIZEN_ROLES) && <Link to="/registrations/create">Đăng ký lần đầu</Link>}
              {hasRole(user.role, ADMIN_ONLY_ROLES) && <Link to="/admin/users">Quản lý người dùng</Link>}
              {hasRole(user.role, ADMIN_ONLY_ROLES) && <Link to="/admin/organizations">Quản lý đơn vị</Link>}
              {hasRole(user.role, LAND_MANAGEMENT_ROLES) && <Link to="/lands">Quản lý thửa đất</Link>}
            </>
          ) : (
            <Link to="/login">Đăng nhập</Link>
          )}
        </nav>
      </aside>
      <main className="content">
        {user && (
          <header className="topbar">
            <div>
              <strong>{user.fullName}</strong>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
            <button type="button" onClick={() => void handleLogout()}>Đăng xuất</button>
          </header>
        )}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<div className="card"><h2>Không có quyền truy cập</h2><p>Tài khoản hiện tại không được phép mở chức năng này.</p></div>} />
          <Route path="/" element={<RequireAuth><HomeEntry /></RequireAuth>} />
          <Route path="/registrations/create" element={<RequireAuth roles={CITIZEN_ROLES}><CitizenRegistrationPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth roles={DASHBOARD_ROLES}><AdminDashboardPage /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><UserManagementPage /></RequireAuth>} />
          <Route path="/admin/organizations" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><OrganizationManagementPage /></RequireAuth>} />
          <Route path="/lands" element={<RequireAuth roles={LAND_MANAGEMENT_ROLES}><LandManagementPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
