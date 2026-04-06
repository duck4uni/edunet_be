# Danh sách chức năng chưa gắn API (đang dùng dữ liệu cứng)

> Tài liệu này liệt kê tất cả các chức năng trên giao diện Client và Admin còn đang sử dụng dữ liệu mock/hardcode thay vì gọi API thực.

---

## 🔴 ADMIN

---

### 1. Quản lý Nhân viên (`/admin/employees`)

**Hook:** `useEmployeeManagement.ts`  
**Nguồn data:** `constants/adminData.ts` — `employees` (mock)  
**Trạng thái:** Toàn bộ CRUD dùng `setTimeout + local state`, không có API call nào

**Các thao tác chưa gắn API:**
- Lấy danh sách nhân viên
- Thêm nhân viên mới
- Sửa thông tin nhân viên
- Xóa nhân viên
- Export danh sách

**Các trường dữ liệu cần API:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID nhân viên |
| `employeeId` | string | Mã nhân viên (EMP001) |
| `firstName` | string | Họ |
| `lastName` | string | Tên |
| `email` | string | Email |
| `phone` | string | Số điện thoại |
| `avatar` | string | URL ảnh đại diện |
| `department` | string | Phòng ban |
| `position` | string | Chức vụ |
| `role` | enum | Quyền: `admin` \| `manager` \| `hr` \| `support` |
| `status` | enum | `active` \| `inactive` \| `on_leave` |
| `hireDate` | string (date) | Ngày vào làm |
| `salary` | number | Mức lương |
| `address` | string | Địa chỉ |
| `createdAt` | string (ISO) | Ngày tạo |

---

### 2. Quản lý Tuyển dụng (`/admin/recruitment`)

**Hook:** `useRecruitment.ts`  
**Nguồn data:** `constants/adminData.ts` — `cvApplications`, `jobPostings` (mock)  
**Trạng thái:** Toàn bộ CRUD dùng `setTimeout + local state`, không có API call nào

**Các thao tác chưa gắn API:**
- Lấy danh sách đơn ứng tuyển
- Cập nhật trạng thái đơn (shortlisted / rejected / interview...)
- Xóa đơn ứng tuyển
- Lấy danh sách tin tuyển dụng
- Đóng / xóa tin tuyển dụng
- Tạo tin tuyển dụng mới

**Trường dữ liệu — CVApplication:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID đơn |
| `applicantName` | string | Tên ứng viên |
| `email` | string | Email |
| `phone` | string | SĐT |
| `position` | string | Vị trí ứng tuyển |
| `department` | string | Phòng ban |
| `cvUrl` | string | URL file CV |
| `coverLetter` | string | Thư xin việc |
| `experience` | number | Số năm kinh nghiệm |
| `education` | string | Trình độ học vấn |
| `skills` | string[] | Kỹ năng |
| `expectedSalary` | number | Lương kỳ vọng |
| `availability` | string | Thời gian có thể bắt đầu |
| `status` | enum | `new` \| `reviewing` \| `shortlisted` \| `interview` \| `offered` \| `hired` \| `rejected` |
| `rating` | number | Đánh giá (1-5) |
| `notes` | string | Ghi chú |
| `interviewDate` | string (ISO) | Ngày phỏng vấn |
| `appliedAt` | string (ISO) | Ngày nộp |
| `source` | string | Nguồn: `linkedin` \| `website` \| `referral` |

**Trường dữ liệu — JobPosting:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID tin tuyển dụng |
| `title` | string | Tên vị trí |
| `department` | string | Phòng ban |
| `location` | string | Địa điểm |
| `type` | enum | `full-time` \| `part-time` \| `internship` \| `contract` |
| `description` | string | Mô tả công việc |
| `requirements` | string[] | Yêu cầu |
| `benefits` | string[] | Phúc lợi |
| `salaryRange` | `{ min: number, max: number }` | Range lương |
| `status` | enum | `active` \| `closed` \| `draft` |
| `applicationsCount` | number | Số đơn đã nộp |
| `deadline` | string (date) | Hạn nộp |
| `createdAt` | string (ISO) | Ngày tạo |

---

### 3. Quản lý Phân quyền (`/admin/permissions`)

**Hook:** `usePermissionManagement.ts`  
**Nguồn data:** `constants/adminData.ts` — `permissions`, `roleGroups` (mock)  
**Trạng thái:** Toàn bộ CRUD dùng `setTimeout + local state`, không có API call nào

**Các thao tác chưa gắn API:**
- Lấy danh sách quyền (Permission)
- Lấy danh sách nhóm quyền (RoleGroup)
- Tạo nhóm quyền mới
- Sửa nhóm quyền
- Xóa nhóm quyền
- Cập nhật danh sách quyền cho nhóm

**Trường dữ liệu — Permission:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID |
| `code` | string | Mã quyền, vd: `courses.approve` |
| `name` | string | Tên quyền |
| `description` | string | Mô tả |
| `module` | string | Module: `Khóa học`, `Người dùng`, v.v. |

**Trường dữ liệu — RoleGroup:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID |
| `name` | string | Tên nhóm quyền |
| `description` | string | Mô tả |
| `permissions` | string[] | Danh sách mã quyền |
| `isSystem` | boolean | Nhóm hệ thống (không xóa được) |
| `usersCount` | number | Số user thuộc nhóm |
| `createdAt` | string (ISO) | Ngày tạo |

---

### 4. Báo cáo Doanh thu (`/admin/revenue`)

**Hook:** `useRevenue.ts`  
**Nguồn data:** `constants/adminData.ts` — `revenueData`, `adminCourses`, `teachers` (mock)  
**Trạng thái:** Toàn bộ dữ liệu từ mock, không có API call nào

**Các thao tác chưa gắn API:**
- Lấy dữ liệu doanh thu theo tháng
- Lấy top khóa học theo doanh thu
- Lấy top giảng viên theo thu nhập
- Lấy doanh thu theo danh mục
- Export báo cáo

**Trường dữ liệu — RevenueData:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `date` | string | Tháng, vd: `2024-01` |
| `revenue` | number | Doanh thu tổng (VNĐ) |
| `orders` | number | Số đơn hàng |
| `refunds` | number | Số hoàn tiền |
| `netRevenue` | number | Doanh thu ròng |

**Trường dữ liệu — TopCourse (từ API cần trả về):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID khóa học |
| `title` | string | Tên khóa học |
| `teacher` | string | Tên giảng viên |
| `revenue` | number | Doanh thu từ khóa học |
| `students` | number | Số học viên |
| `rating` | number | Điểm đánh giá |

**Trường dữ liệu — TopTeacher (từ API cần trả về):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID giảng viên |
| `name` | string | Tên giảng viên |
| `earnings` | number | Tổng thu nhập |
| `totalCourses` | number | Số khóa học |
| `totalStudents` | number | Số học viên |
| `rating` | number | Điểm đánh giá |

---

### 5. Dashboard — Biểu đồ & Thông báo (một phần)

**Hook:** `useDashboard.ts`  
**Trạng thái:** Thống kê chính lấy từ API thực, nhưng một số phần vẫn hardcode

**Phần chưa gắn API:**

| Phần | Nguồn | Mô tả |
|------|-------|-------|
| Biểu đồ doanh thu | `mockRevenueData` (adminData.ts) | 12 tháng doanh thu hardcoded |
| Biểu đồ người dùng mới | Hardcoded array `[820, 932, 1101, ...]` trong hook | Số liệu người dùng qua 12 tháng hardcoded |
| Thông báo Admin (`notifications`) | `adminNotifications` (adminData.ts) | Danh sách thông báo không từ API |
| Nhật ký hoạt động (`activities`) | `activityLogs` (adminData.ts) | Log hoạt động không từ API |

**Trường dữ liệu — AdminNotification:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID thông báo |
| `type` | enum | `info` \| `warning` \| `error` \| `success` |
| `title` | string | Tiêu đề |
| `message` | string | Nội dung |
| `isRead` | boolean | Đã đọc chưa |
| `createdAt` | string (ISO) | Thời gian |
| `link` | string? | Link điều hướng (optional) |

**Trường dữ liệu — ActivityLog:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID bản ghi |
| `userId` | string | ID người thực hiện |
| `userName` | string | Tên người thực hiện |
| `action` | string | Hành động thực hiện |
| `target` | string | Đối tượng bị tác động |
| `details` | string | Chi tiết |
| `ip` | string | Địa chỉ IP |
| `createdAt` | string (ISO) | Thời gian |

---

### 6. Hồ sơ Admin — Lịch sử đăng nhập & Đổi mật khẩu (`/admin/profile`)

**Hook:** `useAdminAuth.ts`  
**Trạng thái:** Đăng nhập và đăng xuất đã gắn API; các chức năng sau vẫn hardcoded

**Phần chưa gắn API:**

| Chức năng | Trạng thái hiện tại |
|-----------|---------------------|
| `loginHistory` | Hardcoded 3 bản ghi giả trong `mockLoginHistory` |
| `updateProfile()` | Dùng `setTimeout`, chỉ cập nhật local state, không gọi API |
| `changePassword()` | Hardcoded validate `currentPassword === 'admin123'`, không gọi API |
| `forgotPassword()` | Hardcoded, chỉ hoạt động với `admin@edunet.com` |
| `resetPassword()` | Simulate, không gọi API |
| Cài đặt thông báo | Array `notificationSettings` hardcoded trong `pages/admin/Profile/index.tsx` |

**Trường dữ liệu — LoginHistoryItem:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID bản ghi |
| `device` | string | Thiết bị |
| `browser` | string | Trình duyệt |
| `ip` | string | Địa chỉ IP |
| `location` | string | Vị trí địa lý |
| `time` | string (ISO) | Thời gian đăng nhập |
| `status` | enum | `success` \| `failed` |
| `isCurrent` | boolean | Phiên hiện tại |

**Trường dữ liệu — NotificationSetting:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `key` | string | Mã cài đặt |
| `label` | string | Tên hiển thị |
| `description` | string | Mô tả |
| `enabled` | boolean | Bật/tắt |

---

## 🔵 CLIENT (User)

---

### 7. Tính năng Chat / Tin nhắn (`/chat`)

**Page:** `pages/user/Chat/index.tsx`  
**Trạng thái:** Toàn bộ dữ liệu hardcoded trực tiếp trong file page, không có hook, không có API, không có WebSocket

**Các thao tác chưa gắn API:**
- Lấy danh sách liên hệ / hội thoại
- Lấy lịch sử tin nhắn theo contact
- Gửi tin nhắn
- Reaction tin nhắn
- Tìm kiếm liên hệ
- Ghim / tắt thông báo hội thoại
- Xóa hội thoại
- Gọi thoại / video call (chỉ UI)

**Trường dữ liệu — Contact:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID liên hệ |
| `name` | string | Tên liên hệ |
| `avatar` | string | URL ảnh |
| `isOnline` | boolean | Đang trực tuyến |
| `isVerified` | boolean? | Đã xác thực |
| `isPinned` | boolean? | Đã ghim |
| `isMuted` | boolean? | Đã tắt thông báo |
| `unreadCount` | number | Số tin nhắn chưa đọc |
| `role` | enum | `teacher` \| `student` |
| `isGroup` | boolean? | Là nhóm |
| `memberCount` | number? | Số thành viên (nếu là nhóm) |
| `lastSeen` | string? | Lần cuối trực tuyến |
| `lastMessage` | string? | Tin nhắn cuối |

**Trường dữ liệu — Message:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID tin nhắn |
| `senderId` | string | ID người gửi |
| `content` | string | Nội dung tin nhắn |
| `timestamp` | string (ISO) | Thời gian gửi |
| `type` | enum | `text` \| `image` \| `file` \| `audio` |
| `status` | enum | `sent` \| `delivered` \| `seen` |
| `reactions` | `{ emoji, userId }[]`? | Emoji reaction |
| `replyTo` | string? | ID tin nhắn trả lời |

---

### 8. Trang chủ — Thống kê tổng quan (StatsSection)

**Component:** `components/Home/StatsSection.tsx`  
**Trạng thái:** Toàn bộ số liệu hardcoded trong component, không gọi API

**Phần hardcoded:**
- "10k+ Học viên tích cực"
- "500+ Khóa học chất lượng"
- "100+ Giải thưởng"
- "50+ Quốc gia"

**Trường dữ liệu cần API (hoặc CMS):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `icon` | string | Tên icon |
| `count` | string | Số liệu hiển thị, vd: `10k+` |
| `label` | string | Nhãn mô tả |

---

### 9. Trang chủ — Testimonials / Đánh giá học viên

**Component:** `components/Home/TestimonialsSection.tsx`  
**Trạng thái:** 4 đánh giá hardcoded trong component, không gọi API

**Trường dữ liệu — Testimonial:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | number | ID |
| `name` | string | Tên học viên |
| `role` | string | Chức danh / nơi công tác |
| `avatar` | string | URL ảnh |
| `rating` | number | Điểm đánh giá (1-5) |
| `comment` | string | Nội dung nhận xét |

---

### 10. Trang chủ — HeroSection (số liệu nổi)

**Component:** `components/Home/HeroSection.tsx`  
**Trạng thái:** Hai thẻ floating với số liệu cứng

**Phần hardcoded:**
- Đánh giá: "4.9/5.0"
- Học viên đang hoạt động: "10,000+"
- 3 ảnh avatar học viên (randomuser.me)

---

### 11. Hồ sơ người dùng — Thành tựu (Achievements)

**Hook:** `useProfile.ts`  
**Trạng thái:** Trả về `achievements: [] as Achievement[]` — mảng rỗng, không có API

**Trường dữ liệu — Achievement:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID thành tựu |
| `title` | string | Tên thành tựu |
| `description` | string | Mô tả |
| `icon` | string | Emoji / icon |
| `earnedAt` | string (date) | Ngày đạt được |
| `type` | enum | `course` \| `quiz` \| `streak` \| `community` \| `special` |

---

### 12. Hồ sơ người dùng — Chứng chỉ (Certificates)

**Hook:** `useProfile.ts`  
**Trạng thái:** Trả về `certificates: [] as Certificate[]` — mảng rỗng, không có API

**Trường dữ liệu — Certificate:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID chứng chỉ |
| `courseName` | string | Tên khóa học |
| `issueDate` | string (date) | Ngày cấp |
| `credentialId` | string | Mã chứng chỉ |
| `downloadUrl` | string | URL tải về |
| `expiryDate` | string? | Ngày hết hạn (optional) |

---

### 13. Hồ sơ người dùng — Đổi mật khẩu

**Hook:** `useProfile.ts`  
**Trạng thái:** `handleChangePassword` chỉ hiện thông báo thành công ngay lập tức mà không gọi API

```ts
// Hiện tại — không gắn API:
const handleChangePassword = (_values) => {
  message.success('Đổi mật khẩu thành công!');
  setIsPasswordModalOpen(false);
};
```

**Trường dữ liệu cần gửi lên API:**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `currentPassword` | string | Mật khẩu hiện tại |
| `newPassword` | string | Mật khẩu mới |
| `confirmPassword` | string | Xác nhận mật khẩu mới |

---

### 14. Hồ sơ người dùng — Ticket responses (ticket chi tiết)

**Hook:** `useProfile.ts`  
**Trạng thái:** `responses` của mỗi ticket bị map thành `[]` khi convert từ API, không lấy nội dung phản hồi chi tiết

**Trường dữ liệu — TicketResponse (cần thêm vào API response):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID phản hồi |
| `message` | string | Nội dung |
| `isStaff` | boolean | Là nhân viên |
| `authorName` | string | Tên người gửi |
| `authorAvatar` | string | Avatar |
| `createdAt` | string (ISO) | Thời gian gửi |

---

## 📋 Bảng Tổng hợp

| # | Chức năng | Loại | Hook/Component | Mức độ |
|---|-----------|------|----------------|--------|
| 1 | Quản lý Nhân viên | Admin | `useEmployeeManagement` | 🔴 Hoàn toàn hardcoded |
| 2 | Quản lý Tuyển dụng | Admin | `useRecruitment` | 🔴 Hoàn toàn hardcoded |
| 3 | Quản lý Phân quyền | Admin | `usePermissionManagement` | 🔴 Hoàn toàn hardcoded |
| 4 | Báo cáo Doanh thu | Admin | `useRevenue` | 🔴 Hoàn toàn hardcoded |
| 5 | Dashboard - Charts & Notifications | Admin | `useDashboard` | 🟡 Một phần hardcoded |
| 6 | Hồ sơ Admin - loginHistory, updateProfile, changePassword | Admin | `useAdminAuth` | 🟡 Một phần hardcoded |
| 7 | Chat / Tin nhắn | Client | `Chat/index.tsx` | 🔴 Hoàn toàn hardcoded |
| 8 | Trang chủ - StatsSection | Client | `StatsSection.tsx` | 🟡 Số liệu tĩnh |
| 9 | Trang chủ - Testimonials | Client | `TestimonialsSection.tsx` | 🟡 Nội dung tĩnh |
| 10 | Trang chủ - HeroSection badges | Client | `HeroSection.tsx` | 🟡 Số liệu tĩnh |
| 11 | Hồ sơ người dùng - Thành tựu | Client | `useProfile` | 🔴 Trả mảng rỗng |
| 12 | Hồ sơ người dùng - Chứng chỉ | Client | `useProfile` | 🔴 Trả mảng rỗng |
| 13 | Đổi mật khẩu (user) | Client | `useProfile` | 🔴 Không gọi API |
| 14 | Ticket chi tiết - responses | Client | `useProfile` | 🟡 Response bị bỏ qua |

**Chú thích:**
- 🔴 **Hoàn toàn hardcoded** — dữ liệu 100% từ mock, cần xây dựng API endpoint và gắn kết
- 🟡 **Một phần hardcoded** — một số dữ liệu từ API thực, nhưng vẫn còn phần dùng mock/tĩnh
