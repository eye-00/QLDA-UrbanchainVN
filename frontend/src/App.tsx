import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { CITIZEN_ROLES, DASHBOARD_ROLES, OFFICER_ROLES, ROLE_LABELS, UserRole } from './auth/roles';
import { CitizenRegistrationPage } from './pages/CitizenRegistrationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SearchLandPage } from './pages/SearchLandPage';
import { LoginPage } from './pages/LoginPage';

function hasRole(role: UserRole | undefined, roles: UserRole[]) {
  return Boolean(role && roles.includes(role));
}

export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>UrbanChain-VN</h1>
        <nav>
          {user ? (
            <>
              {hasRole(user.role, CITIZEN_ROLES) && <Link to="/">Đăng ký lần đầu</Link>}
              {hasRole(user.role, DASHBOARD_ROLES) && <Link to="/dashboard">Dashboard cán bộ</Link>}
              {hasRole(user.role, [...CITIZEN_ROLES, ...OFFICER_ROLES]) && <Link to="/lands">Tra cứu thửa đất</Link>}
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
            <button type="button" onClick={handleLogout}>Đăng xuất</button>
          </header>
        )}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<div className="card"><h2>Không có quyền truy cập</h2><p>Tài khoản hiện tại không được phép mở chức năng này.</p></div>} />
          <Route path="/" element={<RequireAuth roles={CITIZEN_ROLES}><CitizenRegistrationPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth roles={DASHBOARD_ROLES}><AdminDashboardPage /></RequireAuth>} />
          <Route path="/lands" element={<RequireAuth roles={[...CITIZEN_ROLES, ...OFFICER_ROLES]}><SearchLandPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
