# Hướng dẫn Kết nối MCP-ADB qua Cấu hình JSON

Để sử dụng **MCP-ADB** với các ứng dụng hỗ trợ MCP (như Manus AI, Claude Desktop, Cursor, v.v.), bạn cần cung cấp một đoạn cấu hình JSON để ứng dụng biết cách khởi chạy và giao tiếp với server.

## 1. Cấu hình JSON Tiêu chuẩn

Dưới đây là cấu trúc JSON để thêm **MCP-ADB** vào danh sách server của bạn.

### Đối với Linux / macOS / Termux
Thay thế `/path/to/mcp-adb` bằng đường dẫn tuyệt đối đến thư mục bạn đã clone repository.

```json
{
  "mcpServers": {
    "mcp-adb": {
      "command": "node",
      "args": [
        "/path/to/mcp-adb/dist/index.js"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/path/to/adb"
      }
    }
  }
}
```

### Đối với Windows
Sử dụng đường dẫn Windows (lưu ý dùng dấu gạch chéo kép `\\`).

```json
{
  "mcpServers": {
    "mcp-adb": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\mcp-adb\\dist\\index.js"
      ]
    }
  }
}
```

## 2. Cách thiết lập trên các nền tảng

### Manus AI
1. Truy cập **Settings** -> **Integrations**.
2. Tìm mục **Custom MCP Servers**.
3. Chọn **Add Server** hoặc **Import JSON**.
4. Dán đoạn mã JSON ở trên vào.
5. Manus sẽ tự động khởi chạy server qua giao thức `stdio`.

### Claude Desktop
1. Mở file cấu hình tại:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Thêm cấu hình `mcp-adb` vào mục `mcpServers`.
3. Khởi động lại Claude Desktop.

### Termux (Sử dụng với các AI Agent chạy cục bộ)
Nếu bạn đang chạy một AI Agent (như OpenManus hoặc các công cụ CLI hỗ trợ MCP) ngay trên Termux:
1. Đảm bảo đã cài đặt `nodejs` và `android-tools`.
2. Đường dẫn trong Termux thường là: `/data/data/com.termux/files/home/mcp-adb/dist/index.js`.

## 3. Kiểm tra kết nối

Sau khi cấu hình, bạn có thể thử yêu cầu AI thực hiện các lệnh sau để kiểm tra:
- *"Liệt kê các thiết bị Android đang kết nối"* (AI sẽ gọi `adb_devices`).
- *"Chụp ảnh màn hình điện thoại"* (AI sẽ gọi `screenshot`).
- *"Bật chế độ máy bay"* (AI sẽ gọi `airplane_on`).

## 4. Lưu ý về Quyền truy cập
- Đảm bảo lệnh `adb` có thể chạy được từ terminal mà không cần sudo.
- Nếu sử dụng trên Termux, hãy đảm bảo đã chạy `adb connect localhost:PORT` trước khi AI gọi công cụ.
