# Hướng dẫn Kết nối MCP-ADB từ xa (Mạng khác nhau)

Để kết nối **MCP-ADB** server đang chạy trên Termux (Android) từ một máy tính ở mạng khác (ví dụ: Manus AI đang chạy trên cloud), bạn cần sử dụng một kỹ thuật gọi là **Tunneling**. Kỹ thuật này sẽ tạo ra một địa chỉ URL công khai (Public URL) trỏ thẳng về server đang chạy trên điện thoại của bạn.

Dưới đây là 3 cách phổ biến nhất, từ dễ đến nâng cao:

---

## Cách 1: Sử dụng Cloudflare Tunnel (Khuyên dùng - Ổn định & Miễn phí)

Cloudflare Tunnel là giải pháp tốt nhất vì nó cung cấp HTTPS miễn phí và rất ổn định.

1.  **Cài đặt Cloudflared trên Termux:**
    ```bash
    pkg install cloudflared
    ```
2.  **Khởi chạy MCP-ADB ở chế độ SSE:**
    ```bash
    cd mcp-adb
    pnpm run start:sse
    ```
    *(Server sẽ chạy tại http://localhost:3000)*
3.  **Tạo Tunnel tạm thời:**
    Mở một tab mới trong Termux và chạy:
    ```bash
    cloudflared tunnel --url http://localhost:3000
    ```
4.  **Lấy URL:**
    Cloudflare sẽ cung cấp một URL có dạng `https://your-random-name.trycloudflare.com`.
5.  **Kết nối:**
    Sử dụng URL này để kết nối trong Manus AI:
    `https://your-random-name.trycloudflare.com/sse`

---

## Cách 2: Sử dụng LocalTunnel (Đơn giản nhất - Không cần đăng ký)

LocalTunnel rất nhanh gọn và không yêu cầu tạo tài khoản.

1.  **Cài đặt LocalTunnel:**
    ```bash
    npm install -g localtunnel
    ```
2.  **Khởi chạy MCP-ADB ở chế độ SSE:**
    ```bash
    pnpm run start:sse
    ```
3.  **Tạo Tunnel:**
    Mở tab mới trong Termux và chạy:
    ```bash
    lt --port 3000
    ```
4.  **Lấy URL:**
    Bạn sẽ nhận được một URL như `https://cool-panda-123.loca.lt`.
5.  **Kết nối:**
    Sử dụng URL: `https://cool-panda-123.loca.lt/sse`
    *(Lưu ý: Khi truy cập lần đầu, LocalTunnel có thể yêu cầu nhập IP công khai của bạn để xác thực).*

---

## Cách 3: Sử dụng Ngrok (Phổ biến - Cần tài khoản)

Ngrok rất mạnh mẽ nhưng bản miễn phí có giới hạn băng thông và yêu cầu đăng ký.

1.  **Cài đặt Ngrok:**
    Tải bản Linux ARM từ trang chủ Ngrok hoặc cài qua script.
2.  **Cấu hình Authtoken:**
    ```bash
    ngrok config add-authtoken YOUR_TOKEN
    ```
3.  **Tạo Tunnel:**
    ```bash
    ngrok http 3000
    ```
4.  **Kết nối:**
    Sử dụng URL ngrok cung cấp: `https://your-id.ngrok-free.app/sse`

---

## So sánh các giải pháp

| Tiêu chí | Cloudflare Tunnel | LocalTunnel | Ngrok |
| :--- | :--- | :--- | :--- |
| **Độ ổn định** | Rất cao | Trung bình | Cao |
| **Tốc độ** | Nhanh | Trung bình | Nhanh |
| **Đăng ký** | Không (với bản tạm thời) | Không | Có |
| **HTTPS** | Có sẵn | Có sẵn | Có sẵn |

## Lưu ý quan trọng về Bảo mật
Khi bạn expose server ra internet, bất kỳ ai có URL đều có thể điều khiển điện thoại của bạn.
- **Không chia sẻ URL** cho người lạ.
- **Tắt tunnel** ngay khi không sử dụng.
- Trong tương lai, bạn nên cân nhắc thêm một lớp xác thực (Auth Token) vào MCP-ADB nếu định sử dụng lâu dài.
