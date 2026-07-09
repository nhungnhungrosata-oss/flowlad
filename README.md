# Google Flow Studio – useapi.net

MVP web app Next.js + TypeScript + TailwindCSS mô phỏng giao diện studio giống Google Flow để tạo video và hình ảnh qua useapi.net Google Flow API v1.

## Tính năng

- Giao diện 2 tab: Tạo Video và Tạo Hình Ảnh.
- Token useapi.net chỉ chạy ở server-side API route, không gọi trực tiếp từ client.
- Kiểm tra account Google Flow trước khi tạo nội dung.
- Upload asset/reference image qua server.
- Tạo video async và frontend poll qua `/api/flow/video/job`.
- Tạo ảnh synchronous và hiển thị gallery.
- Preview video MP4, gallery ảnh, lịch sử kết quả trong phiên làm việc.
- Xử lý lỗi thiếu env, account lỗi, upload lỗi, job lỗi.

## Endpoint nội bộ

- `GET /api/flow/account`
- `POST /api/flow/asset/upload`
- `POST /api/flow/video/create`
- `GET /api/flow/video/job?id=JOB_ID`
- `POST /api/flow/image/create`

## Cài đặt

```bash
npm install
```

## Tạo `.env.local`

Copy file mẫu:

```bash
cp .env.example .env.local
```

Điền thông tin thật:

```env
USEAPI_TOKEN=user:your-real-useapi-token
GOOGLE_FLOW_EMAIL=your-google-flow-email@gmail.com
```

Không commit `.env.local` lên GitHub.

## Chạy local

```bash
npm run dev
```

Mở:

```text
http://localhost:3000
```

## Build kiểm tra

```bash
npm run build
```

## Deploy Vercel

1. Đẩy code lên GitHub.
2. Import repository vào Vercel.
3. Vào **Project Settings → Environment Variables**.
4. Thêm:
   - `USEAPI_TOKEN`
   - `GOOGLE_FLOW_EMAIL`
5. Deploy lại project.

## Cách nhập prompt tạo video

Nên viết prompt rõ 4 phần:

```text
Chủ thể + bối cảnh + chuyển động camera + phong cách hình ảnh.
Không text, không logo, không watermark.
```

Ví dụ:

```text
A cinematic 9:16 product ad for a luxury shampoo bottle held by a confident female model, soft studio lighting, slow push-in camera, natural hand movement, premium beauty commercial style, no text, no logo, no watermark.
```

Nếu dùng `startImage`, ảnh đầu nên rõ chủ thể, đúng tỷ lệ và không chứa chữ/logo nếu không muốn chữ xuất hiện trong video.

## Cách nhập prompt tạo hình ảnh

Ví dụ:

```text
A premium studio product photo of a skincare serum bottle on a clean marble surface, soft reflection, high-end cosmetic advertising, sharp details, no text, no logo.
```

Có thể upload tối đa 10 ảnh tham chiếu ở tab hình ảnh. Kết quả ảnh trả về được hiển thị trong gallery.

## Lưu ý bảo mật

- API token không bao giờ xuất hiện trong client React.
- Mọi request useapi.net đều đi qua Next.js Route Handler.
- File upload được kiểm tra MIME và giới hạn 12MB.
- Không log token/email/cookie trong code.

## Lưu ý API

Theo tài liệu useapi.net, video dùng `POST /videos`, job dùng `GET /jobs/{jobId}`, ảnh dùng `POST /images`, upload dùng `POST /assets/{email}`. Nếu provider thay đổi response field, xem phần helper trong `src/lib/utils.ts` để bổ sung field mới.


## AntiCaptcha

Nếu useapi.net báo `No captcha provider API keys configured`, thêm biến môi trường `ANTICAPTCHA_API_KEY` trong Vercel. App sẽ tự cấu hình AntiCaptcha vào useapi.net ở lần tạo ảnh/video tiếp theo.
