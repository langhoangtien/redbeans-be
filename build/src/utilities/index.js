import { ZodError } from "zod";
import crypto from "crypto";
// Hàm validate chung cho tất cả các schema
export const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            // Validate dữ liệu từ client bằng Zod
            schema.parse(req.body); // Nếu không hợp lệ, Zod sẽ ném lỗi
            // Nếu dữ liệu hợp lệ, gọi next() để tiếp tục tới route handler
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                // Nếu lỗi là từ Zod, trả về lỗi validation
                res.status(400).json({
                    message: "Validation failed",
                    errors: error.errors, // Trả về chi tiết lỗi
                });
            }
            else if (error instanceof Error) {
                // Nếu lỗi là một error thông thường
                res.status(500).json({
                    message: "Server error",
                    error: error.message,
                });
            }
            else {
                // Nếu là lỗi không xác định
                res.status(500).json({
                    message: "Unknown error occurred",
                });
            }
            // Không cần gọi next() ở đây vì đã trả về response
        }
    };
};
export const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString("hex"); // Tạo salt ngẫu nhiên
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex"); // Hash mật khẩu với thuật toán PBKDF2
    return { salt, hash };
};
export const comparePassword = (password, storedSalt, storedHash) => {
    // Hash mật khẩu nhập vào bằng salt đã lưu
    const hash = crypto
        .pbkdf2Sync(password, storedSalt, 1000, 64, "sha512")
        .toString("hex");
    // So sánh hash mật khẩu đã nhập với hash đã lưu trong cơ sở dữ liệu
    return hash === storedHash;
};
// Ví dụ sử dụng
// const { salt, hash } = hashPassword("mySecretPassword123");
// // So sánh mật khẩu nhập vào (đây là mật khẩu người dùng sẽ nhập khi đăng nhập)
// const isPasswordCorrect = comparePassword("mySecretPassword123", salt, hash);
// console.log(isPasswordCorrect); // true nếu mật khẩu đúng, false nếu sai
const usSalesTax = {
    AL: 9.24,
    AK: 1.76,
    AZ: 8.4,
    AR: 9.47,
    CA: 8.82,
    CO: 7.77,
    CT: 6.35,
    DE: 0,
    FL: 7.02,
    GA: 7.35,
    HI: 4.44,
    ID: 6.02,
    IL: 8.82,
    IN: 7,
    IA: 6.94,
    KS: 8.7,
    KY: 6,
    LA: 9.55,
    ME: 5.5,
    MD: 6,
    MA: 6.25,
    MI: 6,
    MN: 7.49,
    MS: 7.07,
    MO: 8.29,
    MT: 0,
    NE: 6.94,
    NV: 8.23,
    NH: 0,
    NJ: 6.63,
    NM: 7.72,
    NY: 8.52,
    NC: 6.98,
    ND: 6.96,
    OH: 7.24,
    OK: 8.98,
    OR: 0,
    PA: 6.34,
    RI: 7,
    SC: 7.44,
    SD: 6.4,
    TN: 9.55,
    TX: 8.2,
    UT: 7.19,
    VT: 6.22,
    VA: 5.75,
    WA: 9.23,
    WV: 6.5,
    WI: 5.43,
    WY: 5.36,
};
const euVAT = {
    AT: 20,
    BE: 21,
    BG: 20,
    HR: 25,
    CY: 19,
    CZ: 21,
    DK: 25,
    EE: 20,
    FI: 24,
    FR: 20,
    DE: 19,
    GR: 24,
    HU: 27,
    IE: 23,
    IT: 22,
    LV: 21,
    LT: 21,
    LU: 16,
    MT: 18,
    NL: 21,
    PL: 23,
    PT: 23,
    RO: 19,
    SK: 20,
    SI: 22,
    ES: 21,
    SE: 25,
};
export function calculateTax(countryCode, stateCode) {
    let tax = 0;
    if (countryCode === "US" && stateCode) {
        tax = usSalesTax[stateCode.toUpperCase()] ?? 0;
        return tax / 100;
    }
    tax = euVAT[countryCode.toUpperCase()] ?? 0;
    return tax / 100;
}
//# sourceMappingURL=index.js.map