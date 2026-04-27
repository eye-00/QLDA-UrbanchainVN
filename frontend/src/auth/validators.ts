export function validateLoginForm(email: string, password: string): string | null {
  if (!email.trim()) return "Email là bắt buộc";
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Email không đúng định dạng";
  if (!password) return "Mật khẩu là bắt buộc";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  return null;
}
