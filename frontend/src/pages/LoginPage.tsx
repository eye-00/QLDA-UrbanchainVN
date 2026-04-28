import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { validateLoginForm } from '../auth/validators';

const sampleAccounts = [
  ['citizen@urbanchain.vn', 'Công dân'],
  ['reception@urbanchain.vn', 'Tiếp nhận'],
  ['registry@urbanchain.vn', 'VPĐKĐĐ'],
  ['approval@urbanchain.vn', 'Phê duyệt'],
  ['admin@urbanchain.vn', 'Quản trị']
] as const;

export function LoginPage() {
  const { login, loginWithVneidMock, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('citizen@urbanchain.vn');
  const [password, setPassword] = useState('StrongPassword@123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateLoginForm(email, password);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function onVneidMockLogin() {
    setLoading(true);
    setMessage('');
    try {
      await loginWithVneidMock('0482xxxxxxx');
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đăng nhập VNeID mô phỏng thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-shell">
      <div>
        <h2>Đăng nhập UrbanChain-VN</h2>
        <p>Phiên mô phỏng Sprint 2 dùng tài khoản mẫu theo vai trò trong đặc tả API.</p>
        <form className="card row-gap" onSubmit={onSubmit}>
          <label>Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>Mật khẩu
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <div className="card row-gap">
          <h3>VNeID mô phỏng</h3>
          <p className="muted">Xác thực danh tính mô phỏng cho công dân, không kết nối VNeID thật.</p>
          <button type="button" disabled={loading} onClick={onVneidMockLogin}>
            Đăng nhập bằng VNeID mô phỏng
          </button>
        </div>
        {message && <p className="error-notice">{message}</p>}
      </div>
      <div className="card">
        <h3>Tài khoản mẫu</h3>
        {sampleAccounts.map(([account, label]) => (
          <button className="account-button" type="button" key={account} onClick={() => setEmail(account)}>
            <span>{label}</span>
            <small>{account}</small>
          </button>
        ))}
        <p className="muted">Mật khẩu chung: StrongPassword@123</p>
      </div>
    </section>
  );
}
