import { describe, expect, it } from "vitest";
import { validateLoginForm } from "../src/auth/validators";

describe("login validation", () => {
  it("rejects invalid email and short password", () => {
    expect(validateLoginForm("", "StrongPassword@123")).toBe("Email là bắt buộc");
    expect(validateLoginForm("invalid-email", "StrongPassword@123")).toBe(
      "Email không đúng định dạng"
    );
    expect(validateLoginForm("citizen@urbanchain.vn", "123")).toBe(
      "Mật khẩu phải có ít nhất 8 ký tự"
    );
  });

  it("accepts valid credentials format", () => {
    expect(validateLoginForm("citizen@urbanchain.vn", "StrongPassword@123")).toBeNull();
  });
});
