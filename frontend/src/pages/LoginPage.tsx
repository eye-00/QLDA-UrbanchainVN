import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

type LoginType = 'CITIZEN' | 'STAFF' | 'ADMIN';
type AccountLockedApiError = { errors?: Array<{ code?: string; lockedUntil?: string | null }> };

const sampleCitizens = [
  { identifier: '012345678901', name: 'Công dân A (CCCD: 012345678901 - Ví 1)', type: 'CITIZEN' as const },
  { identifier: '012345678902', name: 'Công dân B (CCCD: 012345678902 - Ví 3)', type: 'CITIZEN' as const }
];

const sampleStaffs = [
  { identifier: 'reception_officer', name: 'Cán bộ Tiếp nhận (reception_officer - Ví 2)', type: 'STAFF' as const },
  { identifier: 'commune_officer', name: 'Cán bộ Cấp xã (commune_officer)', type: 'STAFF' as const },
  { identifier: 'registry_officer', name: 'Cán bộ VPĐKĐĐ (registry_officer - Ví 2)', type: 'STAFF' as const },
  { identifier: 'tax_officer', name: 'Cán bộ Thuế (tax_officer - Ví 2)', type: 'STAFF' as const },
  { identifier: 'approval_officer', name: 'Cán bộ Phê duyệt (approval_officer - Ví 2)', type: 'STAFF' as const }
];

const sampleAdmins = [
  { identifier: 'admin', name: 'Quản trị hệ thống (admin)', type: 'ADMIN' as const }
];

export function LoginPage() {
  const { login, loginWithVneidMock, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loginType, setLoginType] = useState<LoginType>('CITIZEN');
  const [identifier, setIdentifier] = useState('012345678901');
  const [password, setPassword] = useState('StrongPassword@123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      setMessage('Vui lòng nhập mã định danh đăng nhập');
      return;
    }
    if (password.length < 8) {
      setMessage('Mật khẩu phải dài tối thiểu 8 ký tự');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { redirectTo } = await login(loginType, identifier.trim(), password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? redirectTo;
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const accountError = error as AccountLockedApiError;
      if (accountError.errors?.[0]?.code === 'ACCOUNT_LOCKED') {
        const lockedUntil = accountError.errors[0].lockedUntil;
        const timeStr = lockedUntil ? new Date(lockedUntil).toLocaleTimeString('vi-VN') : 'vài phút';
        setMessage(`Tài khoản của bạn đã bị khóa tạm thời do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau ${timeStr}.`);
      } else {
        setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function onVneidMockLogin(citizenId: string) {
    setLoading(true);
    setMessage('');
    try {
      const { redirectTo } = await loginWithVneidMock(citizenId);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? redirectTo;
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng nhập VNeID mô phỏng thất bại');
    } finally {
      setLoading(false);
    }
  }

  const getIdentifierLabel = () => {
    if (loginType === 'CITIZEN') return 'Mã số định danh (Số CCCD / citizenId)';
    if (loginType === 'STAFF') return 'Tên đăng nhập cán bộ / Mã cán bộ';
    return 'Tên đăng nhập quản trị (Username)';
  };

  const getIdentifierPlaceholder = () => {
    if (loginType === 'CITIZEN') return 'Ví dụ: 012345678901';
    if (loginType === 'STAFF') return 'Ví dụ: registry_officer';
    return 'Ví dụ: admin';
  };

  const handleSelectType = (type: LoginType) => {
    setLoginType(type);
    setMessage('');
    if (type === 'CITIZEN') {
      setIdentifier('012345678901');
    } else if (type === 'STAFF') {
      setIdentifier('registry_officer');
    } else {
      setIdentifier('admin');
    }
  };

  return (
    <section className="login-shell">
      <div>
        <h2>Đăng nhập UrbanChain-VN</h2>
        <p className="section-subtitle">
          Hệ thống Đăng ký & Biến động Đất đai trợ giúp bởi Blockchain và VNeID.
        </p>

        <div className="login-tabs">
          <button 
            type="button" 
            className={loginType === 'CITIZEN' ? 'active' : ''} 
            onClick={() => handleSelectType('CITIZEN')}
          >
            Người dân
          </button>
          <button 
            type="button" 
            className={loginType === 'STAFF' ? 'active' : ''} 
            onClick={() => handleSelectType('STAFF')}
          >
            Cán bộ nghiệp vụ
          </button>
          <button 
            type="button" 
            className={loginType === 'ADMIN' ? 'active' : ''} 
            onClick={() => handleSelectType('ADMIN')}
          >
            Quản trị viên
          </button>
        </div>

        <form className="card row-gap" onSubmit={onSubmit}>
          <label>
            {getIdentifierLabel()}
            <input 
              type="text" 
              value={identifier} 
              placeholder={getIdentifierPlaceholder()}
              onChange={(event) => setIdentifier(event.target.value)} 
            />
          </label>
          <label>
            Mật khẩu
            <input 
              type="password" 
              value={password} 
              onChange={(event) => setPassword(event.target.value)} 
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Đang xác thực đăng nhập...' : 'Đăng nhập mật khẩu'}
          </button>
        </form>

        <div className="card row-gap">
          <h3>Xác thực VNeID quốc gia (Mô phỏng)</h3>
          <p className="muted">Đăng nhập nhanh không cần nhập mật khẩu thông qua tài khoản định danh VNeID.</p>
          <div className="action-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <button 
              type="button" 
              disabled={loading} 
              onClick={() => onVneidMockLogin('012345678901')}
              style={{ background: '#0066b2' }}
            >
              VNeID Công dân A
            </button>
            <button 
              type="button" 
              disabled={loading} 
              onClick={() => onVneidMockLogin('012345678902')}
              style={{ background: '#0066b2' }}
            >
              VNeID Công dân B
            </button>
          </div>
        </div>

        {message && <p className="error-notice">{message}</p>}
      </div>

      <div className="card">
        <h3>Tài khoản mẫu liên kết ví thật</h3>
        
        <div className="row-gap-xs" style={{ marginBottom: '12px' }}>
          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-brand)' }}>Người dân (Ví 1 & Ví 3):</strong>
          {sampleCitizens.map((acc) => (
            <button 
              className="account-button" 
              type="button" 
              key={acc.identifier} 
              onClick={() => {
                setLoginType(acc.type);
                setIdentifier(acc.identifier);
              }}
            >
              <span>{acc.name}</span>
            </button>
          ))}
        </div>

        <div className="row-gap-xs" style={{ marginBottom: '12px' }}>
          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-brand)' }}>Cán bộ (Ủy quyền Ví 2):</strong>
          {sampleStaffs.map((acc) => (
            <button 
              className="account-button" 
              type="button" 
              key={acc.identifier} 
              onClick={() => {
                setLoginType(acc.type);
                setIdentifier(acc.identifier);
              }}
            >
              <span>{acc.name}</span>
            </button>
          ))}
        </div>

        <div className="row-gap-xs">
          <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-brand)' }}>Quản trị hệ thống:</strong>
          {sampleAdmins.map((acc) => (
            <button 
              className="account-button" 
              type="button" 
              key={acc.identifier} 
              onClick={() => {
                setLoginType(acc.type);
                setIdentifier(acc.identifier);
              }}
            >
              <span>{acc.name}</span>
            </button>
          ))}
        </div>

        <p className="muted" style={{ marginTop: '16px', fontSize: '12px' }}>Mật khẩu chung: StrongPassword@123</p>
      </div>
    </section>
  );
}
