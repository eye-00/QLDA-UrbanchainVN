import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RequireAuth } from './auth/RequireAuth';
import { useMemo } from 'react';
import {
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
import { RegistrationBlockchainSignPage } from './pages/RegistrationBlockchainSignPage';
import { ServiceWalletManagementPage } from './pages/ServiceWalletManagementPage';

function RequirePortal({
  allowedTypes,
  children
}: {
  allowedTypes: ('CITIZEN' | 'STAFF' | 'AGENCY_ADMIN' | 'SYSTEM_ADMIN')[];
  children: JSX.Element;
}) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedTypes.includes(user.accountType)) return <Navigate to="/forbidden" replace />;
  return children;
}

function HomeEntry() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.accountType === 'CITIZEN') return <Navigate to="/citizen/dashboard" replace />;
  if (user.accountType === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
  if (user.accountType === 'AGENCY_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.accountType === 'SYSTEM_ADMIN') return <Navigate to="/system/dashboard" replace />;
  return <Navigate to="/forbidden" replace />;
}

function isNavItemActive(pathname: string, to: string) {
  if (pathname === to) return true;
  if (to === '/admin/users' && pathname.startsWith('/admin/users')) return true;
  if (to === '/admin/organizations' && pathname.startsWith('/admin/organizations')) return true;
  if (to === '/staff/lands' && pathname.startsWith('/staff/lands')) return true;
  if (to === '/staff/registrations/review' && pathname.startsWith('/staff/registrations/review')) return true;
  return false;
}

function getCurrentPageLabel(pathname: string) {
  if (pathname.includes('/users') && pathname.endsWith('/edit')) return 'Cập nhật người dùng';
  if (pathname.includes('/users')) return 'Quản lý người dùng';
  if (pathname.includes('/organizations') && pathname.endsWith('/edit')) return 'Cập nhật đơn vị';
  if (pathname.includes('/organizations')) return 'Quản lý đơn vị';
  if (pathname.includes('/service-wallets')) return 'Quản lý ví công vụ';
  if (pathname.includes('/lands') && pathname.endsWith('/edit')) return 'Cập nhật thửa đất';
  if (pathname.includes('/lands') && pathname.includes('/search')) return 'Tra cứu thửa đất';
  if (pathname.includes('/lands')) return 'Quản lý thửa đất';
  if (pathname.includes('/registrations/review') && pathname.endsWith('/blockchain-sign')) return 'Ký và gửi blockchain';
  if (pathname.includes('/registrations/review') && (pathname.includes('/review/') || pathname.split('/').length > 4)) return 'Chi tiết xử lý hồ sơ';
  if (pathname.includes('/registrations/review')) return 'Xử lý hồ sơ đăng ký';
  if (pathname.includes('/registrations') && pathname.endsWith('/blockchain-sign')) return 'Ký và gửi blockchain';
  if (pathname.includes('/registrations/create')) return 'Nộp hồ sơ đăng ký lần đầu';
  if (pathname.includes('/wallets')) return 'Quản lý ví blockchain';
  if (pathname.includes('/dashboard')) return 'Bảng điều khiển';
  return 'UrbanChain-VN';
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

  const visibleNavItems = useMemo(() => {
    if (!user) return [];
    if (user.accountType === 'CITIZEN') {
      return [
        { to: '/citizen/dashboard', label: 'Bảng điều khiển' },
        { to: '/citizen/registrations/create', label: 'Đăng ký lần đầu' },
        { to: '/citizen/wallets', label: 'Ví blockchain' },
        { to: '/citizen/lands/search', label: 'Tra cứu thửa đất' }
      ];
    }
    if (user.accountType === 'STAFF') {
      return [
        { to: '/staff/dashboard', label: 'Bảng điều khiển' },
        { to: '/staff/registrations/review', label: 'Hồ sơ xử lý' },
        { to: '/staff/lands', label: 'Thửa đất' },
        { to: '/staff/lands/search', label: 'Tra cứu thửa đất' }
      ];
    }
    if (user.accountType === 'AGENCY_ADMIN' || user.accountType === 'SYSTEM_ADMIN') {
      const items = [
        { to: user.accountType === 'SYSTEM_ADMIN' ? '/system/dashboard' : '/admin/dashboard', label: 'Bảng điều khiển' },
        { to: '/admin/users', label: 'Người dùng' },
        { to: '/admin/organizations', label: 'Đơn vị' },
        { to: '/admin/service-wallets', label: 'Ví công vụ' },
        { to: '/admin/lands/search', label: 'Tra cứu thửa đất' }
      ];
      return items;
    }
    return [];
  }, [user]);

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
            <span className="topbar-role-badge">{ROLE_LABELS[user.role]}</span>
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
          <Route path="/" element={<HomeEntry />} />

          {/* Citizen Portal */}
          <Route path="/citizen/dashboard" element={<RequirePortal allowedTypes={['CITIZEN']}><CitizenRegistrationPage /></RequirePortal>} />
          <Route path="/citizen/registrations/create" element={<RequirePortal allowedTypes={['CITIZEN']}><CitizenRegistrationPage /></RequirePortal>} />
          <Route path="/citizen/wallets" element={<RequirePortal allowedTypes={['CITIZEN']}><WalletManagementPage /></RequirePortal>} />
          <Route path="/citizen/lands/search" element={<RequirePortal allowedTypes={['CITIZEN']}><SearchLandPage /></RequirePortal>} />
          <Route path="/citizen/registrations/:id/blockchain-sign" element={<RequirePortal allowedTypes={['CITIZEN']}><RegistrationBlockchainSignPage /></RequirePortal>} />

          {/* Staff Portal */}
          <Route path="/staff/dashboard" element={<RequirePortal allowedTypes={['STAFF']}><AdminDashboardPage /></RequirePortal>} />
          <Route path="/staff/registrations/review" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationReviewPage /></RequirePortal>} />
          <Route path="/staff/registrations/review/:id" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationReviewDetailPage /></RequirePortal>} />
          <Route path="/staff/registrations/review/:id/blockchain-sign" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationBlockchainSignPage /></RequirePortal>} />
          <Route path="/staff/lands" element={<RequirePortal allowedTypes={['STAFF']}><LandManagementPage /></RequirePortal>} />
          <Route path="/staff/lands/:id/edit" element={<RequirePortal allowedTypes={['STAFF']}><LandEditPage /></RequirePortal>} />
          <Route path="/staff/lands/search" element={<RequirePortal allowedTypes={['STAFF']}><SearchLandPage /></RequirePortal>} />

          {/* Admin Portal */}
          <Route path="/admin/dashboard" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><AdminDashboardPage /></RequirePortal>} />
          <Route path="/admin/users" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><UserManagementPage /></RequirePortal>} />
          <Route path="/admin/users/:id/edit" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><UserEditPage /></RequirePortal>} />
          <Route path="/admin/organizations" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><OrganizationManagementPage /></RequirePortal>} />
          <Route path="/admin/organizations/:id/edit" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><OrganizationEditPage /></RequirePortal>} />
          <Route path="/admin/service-wallets" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><ServiceWalletManagementPage /></RequirePortal>} />
          <Route path="/admin/lands/search" element={<RequirePortal allowedTypes={['AGENCY_ADMIN', 'SYSTEM_ADMIN']}><SearchLandPage /></RequirePortal>} />

          {/* System Portal */}
          <Route path="/system/dashboard" element={<RequirePortal allowedTypes={['SYSTEM_ADMIN']}><AdminDashboardPage /></RequirePortal>} />

          {/* Compatibility Routes for internal pages navigation */}
          <Route path="/registrations/create" element={<RequirePortal allowedTypes={['CITIZEN']}><CitizenRegistrationPage /></RequirePortal>} />
          <Route path="/wallets" element={<RequirePortal allowedTypes={['CITIZEN']}><WalletManagementPage /></RequirePortal>} />
          <Route path="/registrations/:id/blockchain-sign" element={<RequirePortal allowedTypes={['CITIZEN']}><RegistrationBlockchainSignPage /></RequirePortal>} />
          <Route path="/registrations/review" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationReviewPage /></RequirePortal>} />
          <Route path="/registrations/review/:id" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationReviewDetailPage /></RequirePortal>} />
          <Route path="/registrations/review/:id/blockchain-sign" element={<RequirePortal allowedTypes={['STAFF']}><RegistrationBlockchainSignPage /></RequirePortal>} />
          <Route path="/lands" element={<RequirePortal allowedTypes={['STAFF']}><LandManagementPage /></RequirePortal>} />
          <Route path="/lands/:id/edit" element={<RequirePortal allowedTypes={['STAFF']}><LandEditPage /></RequirePortal>} />
          <Route path="/dashboard" element={<HomeEntry />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </section>
      </main>
    </div>
  );
}
