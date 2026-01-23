# MCP-ADB: Model Context Protocol Server for Android Debug Bridge

**MCP-ADB** là một **Model Context Protocol (MCP) Server** được thiết kế để cho phép các tác nhân AI, như Manus AI, tương tác và điều khiển các thiết bị Android thông qua **Android Debug Bridge (ADB)**. Server này chuyển đổi các lệnh ADB phức tạp thành các công cụ (tools) có cấu trúc, giúp các mô hình ngôn ngữ lớn (LLM) dễ dàng sử dụng để tự động hóa các tác vụ trên thiết bị Android.

## Mục đích

Mục đích chính của dự án này là cung cấp một giao diện lập trình (API) nhất quán và an toàn để thực hiện các hành động sau trên thiết bị Android:

1.  **Kiểm soát cơ bản**: Liệt kê thiết bị, thực thi lệnh shell.
2.  **Tự động hóa giao diện người dùng (UI)**: Chụp ảnh màn hình, kiểm tra cấu trúc UI (XML).
3.  **Thực thi lệnh chuyên biệt**: Sử dụng các công cụ được định nghĩa sẵn bằng TOML để thực hiện các tác vụ cụ thể như bật/tắt Wi-Fi, điều chỉnh âm lượng, v.v.

## Tính năng chính

| Tính năng | Mô tả | Công cụ MCP tương ứng |
| :--- | :--- | :--- |
| **Quản lý thiết bị** | Liệt kê các thiết bị Android đang kết nối. | `adb_devices` |
| **Thực thi Shell** | Thực thi bất kỳ lệnh shell nào trên thiết bị. | `adb_shell` |
| **Kiểm tra UI** | Chụp và trả về cấu trúc UI hiện tại dưới dạng XML. | `inspect_ui` |
| **Chụp màn hình** | Chụp ảnh màn hình và trả về dưới dạng Base64. | `screenshot` |
| **Công cụ động** | Tự động đăng ký các công cụ dựa trên file cấu hình TOML trong thư mục `commands/android`. | (Tên file TOML) |

## Cài đặt và Khởi chạy

### Yêu cầu

*   **Node.js** (Phiên bản 18 trở lên)
*   **pnpm** (hoặc npm/yarn)
*   **Android Debug Bridge (ADB)**:
    *   Trên Linux/macOS: Cài đặt qua trình quản lý gói (ví dụ: `sudo apt install android-tools-adb`).
    *   Trên **Termux (Android)**: Cài đặt qua `pkg install android-tools`.

### Các bước cài đặt

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/tiendung2k03/mcp-adb.git
    cd mcp-adb
    ```

2.  **Cài đặt Dependencies:**
    ```bash
    pnpm install
    ```

3.  **Build Dự án:**
    ```bash
    pnpm run build
    ```

### Hướng dẫn riêng cho Termux

Để chạy MCP-ADB trên Termux và điều khiển chính thiết bị đó hoặc thiết bị khác:

1.  **Cài đặt Node.js và ADB:**
    ```bash
    pkg update
    pkg install nodejs-lts android-tools
    ```
2.  **Bật Wireless Debugging:**
    *   Vào *Developer Options* trên điện thoại.
    *   Bật *Wireless Debugging*.
    *   Kết nối ADB với chính nó: `adb connect localhost:PORT` (sử dụng port hiển thị trong Wireless Debugging).
3.  **Chạy Server:**
    ```bash
    node dist/index.js
    ```

4.  **Khởi chạy MCP Server:**
    Server này được thiết kế để chạy qua **Standard I/O (stdio)**, đây là phương thức giao tiếp tiêu chuẩn cho các MCP server được khởi chạy bởi một tác nhân AI (như Manus AI).

    ```bash
    pnpm start
    ```

    Khi chạy, server sẽ lắng nghe các yêu cầu MCP từ stdin và gửi phản hồi qua stdout.

## Kết nối và Sử dụng qua JSON

Để kết nối **MCP-ADB** với Manus AI, Claude Desktop hoặc các ứng dụng hỗ trợ MCP khác, bạn sử dụng cấu hình JSON sau:

### Cấu hình JSON mẫu

```json
{
  "mcpServers": {
    "mcp-adb": {
      "command": "node",
      "args": [
        "/đường/dẫn/tới/mcp-adb/dist/index.js"
      ],
      "env": {
        "PATH": "/usr/local/bin:/usr/bin:/bin:/đường/dẫn/tới/adb"
      }
    }
  }
}
```

### Cách thiết lập trên Manus AI
1.  Vào **Settings** -> **Integrations** -> **Custom MCP Servers**.
2.  Chọn **Add Server** hoặc **Import JSON**.
3.  Dán đoạn mã JSON ở trên (đã thay đổi đường dẫn thực tế của bạn).
4.  Manus sẽ nhận diện các công cụ như `adb_devices`, `screenshot`, `inspect_ui` và hơn 150 công cụ điều khiển khác.

### Cách thiết lập trên Claude Desktop
1.  Mở file `claude_desktop_config.json` (trong `%APPDATA%\Claude` trên Windows hoặc `~/Library/Application Support/Claude` trên macOS).
2.  Thêm mục `mcp-adb` vào phần `mcpServers`.
3.  Khởi động lại Claude.

## Cấu trúc Dự án

```
mcp-adb/
├── commands/
│   └── android/
│       ├── abi.toml
│       ├── airplane_on.toml
│       └── ... (các công cụ ADB chuyên biệt)
├── dist/
│   └── index.js (File đã build)
├── src/
│   └── index.ts (Mã nguồn chính của MCP Server)
├── utils/ (Các script Python hỗ trợ)
├── package.json
├── tsconfig.json
└── README.md
```

Mã nguồn chính nằm trong `src/index.ts`, nơi định nghĩa các công cụ MCP và logic để thực thi các lệnh ADB tương ứng. Các công cụ chuyên biệt được định nghĩa thông qua các file TOML, cho phép mở rộng dễ dàng mà không cần thay đổi mã nguồn TypeScript.
