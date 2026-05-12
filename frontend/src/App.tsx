import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import {
  ADMIN_ONLY_ROLES,
  CITIZEN_ROLES,
  DASHBOARD_ROLES,
  LAND_MANAGEMENT_ROLES,
  REGISTRATION_REVIEW_ROLES,
  ROLE_LABELS,
  UserRole
} from './auth/roles';
import { CitizenRegistrationPage } from './pages/CitizenRegistrationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { UserEditPage } from './pages/UserEditPage';
import { OrganizationManagementPage } from './pages/OrganizationManagementPage';
import { OrganizationEditPage } from './pages/OrganizationEditPage';
import { LandManagementPage } from './pages/LandManagementPage';
import { LandEditPage } from './pages/LandEditPage';
import { SearchLandPage } from './pages/SearchLandPage';
import { RegistrationReviewPage } from './pages/RegistrationReviewPage';
import { RegistrationReviewDetailPage } from './pages/RegistrationReviewDetailPage';
import { WalletManagementPage } from './pages/WalletManagementPage';

function hasRole(role: UserRole | undefined, roles: UserRole[]) {
  return Boolean(role && roles.includes(role));
}

type NavItem = {
  to: string;
  label: string;
  roles?: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Bảng điều khiển', roles: DASHBOARD_ROLES },
  { to: '/registrations/create', label: 'Đăng ký lần đầu', roles: CITIZEN_ROLES },
  { to: '/wallets', label: 'Ví blockchain', roles: CITIZEN_ROLES },
  { to: '/admin/users', label: 'Người dùng', roles: ADMIN_ONLY_ROLES },
  { to: '/admin/organizations', label: 'Đơn vị', roles: ADMIN_ONLY_ROLES },
  { to: '/admin/service-wallets', label: 'Ví công vụ', roles: ADMIN_ONLY_ROLES },
  { to: '/lands', label: 'Thửa đất', roles: LAND_MANAGEMENT_ROLES },
  { to: '/registrations/review', label: 'Hồ sơ xử lý', roles: REGISTRATION_REVIEW_ROLES },
  { to: '/lands/search', label: 'Tra cứu thửa đất', roles: DASHBOARD_ROLES }
];

function HomeEntry() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (hasRole(user.role, CITIZEN_ROLES)) return <CitizenRegistrationPage />;
  return <Navigate to="/dashboard" replace />;
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Trang chủ',
  '/login': 'Đăng nhập hệ thống',
  '/dashboard': 'Bảng điều khiển',
  '/registrations/create': 'Nộp hồ sơ đăng ký lần đầu',
  '/wallets': 'Quản lý ví blockchain',
  '/admin/users': 'Quản lý người dùng',
  '/admin/users/edit': 'Cập nhật người dùng',
  '/admin/organizations': 'Quản lý đơn vị',
  '/admin/organizations/edit': 'Cập nhật đơn vị',
  '/lands': 'Quản lý thửa đất',
  '/lands/edit': 'Cập nhật thửa đất',
  '/registrations/review': 'Xử lý hồ sơ đăng ký',
  '/registrations/review/detail': 'Chi tiết xử lý hồ sơ',
  '/lands/search': 'Tra cứu thửa đất',
  '/forbidden': 'Không có quyền truy cập'
};

function isNavItemActive(pathname: string, to: string) {
  if (pathname === to) return true;
  if (to === '/admin/users' && pathname.startsWith('/admin/users/')) return true;
  if (to === '/admin/organizations' && pathname.startsWith('/admin/organizations/')) return true;
  if (to === '/lands' && pathname.startsWith('/lands/')) return true;
  if (to === '/registrations/review' && pathname.startsWith('/registrations/review/')) return true;
  return false;
}

function getCurrentPageLabel(pathname: string) {
  if (pathname.startsWith('/admin/users/') && pathname.endsWith('/edit')) return PAGE_LABELS['/admin/users/edit'];
  if (pathname.startsWith('/admin/organizations/') && pathname.endsWith('/edit')) return PAGE_LABELS['/admin/organizations/edit'];
  if (pathname.startsWith('/lands/') && pathname.endsWith('/edit')) return PAGE_LABELS['/lands/edit'];
  if (pathname.startsWith('/registrations/review/')) return PAGE_LABELS['/registrations/review/detail'];
  return PAGE_LABELS[pathname] ?? 'UrbanChain-VN';
}

export function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageLabel = getCurrentPageLabel(location.pathname);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || hasRole(user?.role, item.roles));

  if (!user) {
    return (
      <main className="guest-shell">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <h1>UrbanChain-VN</h1>
          <p>Quản lý đất đai số hóa</p>
        </div>
        <nav className="sidebar-nav">
          {visibleNavItems.map((item) => (
            <Link key={item.to} to={item.to} className={isNavItemActive(location.pathname, item.to) ? 'active' : ''}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="topbar-title">
            <strong>{currentPageLabel}</strong>
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-user">{user.fullName}</span>
            <button type="button" className="btn btn-outline" onClick={() => void handleLogout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        <section className="page-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/forbidden"
            element={
              <div className="card">
                <h2>Không có quyền truy cập</h2>
                <p>Tài khoản hiện tại không được phép sử dụng chức năng này.</p>
              </div>
            }
          />
          <Route path="/" element={<RequireAuth><HomeEntry /></RequireAuth>} />
          <Route path="/registrations/create" element={<RequireAuth roles={CITIZEN_ROLES}><CitizenRegistrationPage /></RequireAuth>} />
          <Route path="/wallets" element={<RequireAuth roles={CITIZEN_ROLES}><WalletManagementPage /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth roles={DASHBOARD_ROLES}><AdminDashboardPage /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><UserManagementPage /></RequireAuth>} />
          <Route path="/admin/users/:id/edit" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><UserEditPage /></RequireAuth>} />
          <Route path="/admin/organizations" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><OrganizationManagementPage /></RequireAuth>} />
          <Route path="/admin/organizations/:id/edit" element={<RequireAuth roles={ADMIN_ONLY_ROLES}><OrganizationEditPage /></RequireAuth>} />
          <Route path="/lands" element={<RequireAuth roles={LAND_MANAGEMENT_ROLES}><LandManagementPage /></RequireAuth>} />
          <Route path="/lands/:id/edit" element={<RequireAuth roles={LAND_MANAGEMENT_ROLES}><LandEditPage /></RequireAuth>} />
          <Route path="/registrations/review" element={<RequireAuth roles={REGISTRATION_REVIEW_ROLES}><RegistrationReviewPage /></RequireAuth>} />
          <Route path="/registrations/review/:id" element={<RequireAuth roles={REGISTRATION_REVIEW_ROLES}><RegistrationReviewDetailPage /></RequireAuth>} />
          <Route path="/lands/search" element={<RequireAuth roles={DASHBOARD_ROLES}><SearchLandPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </section>
      </main>
    </div>
  );
}
