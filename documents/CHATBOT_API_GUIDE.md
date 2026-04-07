# EduNet Chatbot AI - Tài liệu cho Frontend

## 📋 Tổng quan

Hệ thống chatbot AI của EduNet cho phép:
- 💬 Hỏi đáp AI dựa trên dữ liệu tri thức được lưu giữ
- 📚 Quản lý dữ liệu chatbot (CRUD)
- 🔍 Tìm kiếm thông tin thông minh
- 🌐 Tất cả API không yêu cầu authentication

## 🏗️ Kiến trúc

```
Frontend (React/Vue)
        ↓
    API Gateway (/api)
        ↓
   ChatBot Module
    ├── Controller (Routing)
    ├── Service (Logic)
    └── Entity (Database)
        ↓
   PostgreSQL Database
   (Table: ChatData)
```

## 🔌 API Endpoints

**Base URL:** `http://localhost:3000/api/chatbot`

### 1️⃣ POST /api/chatbot/ask - Hỏi AI

**Mục đích:** Hỏi câu hỏi và nhận câu trả lời từ AI dựa trên dữ liệu đã lưu

**Request:**
```json
{
  "question": "Làm sao để đăng ký khóa học?"
}
```

**Response Success (200):**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "answer": "Quy trình đăng ký khóa học gồm 7 bước: 1. Đăng nhập vào hệ thống...",
    "references": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Quy trình đăng ký khóa học",
        "content": "Quy trình đăng ký khóa học gồm các bước sau...",
        "fileType": "text",
        "htmlContent": null,
        "imageCount": 0,
        "date": "Ngày 07/04/2026",
        "createdAt": "2026-04-07T12:00:00.000Z",
        "updatedAt": "2026-04-07T12:00:00.000Z",
        "deletedAt": null
      }
    ]
  }
}
```

**Response Error (400/503):**
```json
{
  "statusCode": 400,
  "message": "Question is required"
}
```

---

### 2️⃣ GET /api/chatbot - Lấy danh sách dữ liệu chatbot

**Mục đích:** Lấy danh sách tất cả dữ liệu chatbot với phân trang, sắp xếp, lọc

**Query Parameters:**

| Parameter | Type | Example | Mô tả |
|-----------|------|---------|-------|
| `page` | number | `?page=1` | Trang (mặc định 1) |
| `size` | number | `?size=10` | Số item/trang (mặc định 10) |
| `sort` | string | `?sort=createdAt:desc` | Sắp xếp (asc/desc) |
| `filter` | string | `?filter=title:like:đăng ký` | Lọc (xem [Filter Rules](#-filter-rules)) |
| `include` | string | `?include=relation1\|relation2` | Các relation để load (ngăn cách bằng `\|`) |

**Request Example:**
```bash
GET /api/chatbot?page=1&size=10&sort=createdAt:desc
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "rows": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "title": "Quy trình đăng ký khóa học",
        "content": "Quy trình đăng ký khóa học gồm các bước sau...",
        "fileType": "text",
        "htmlContent": null,
        "imageCount": 0,
        "date": "Ngày 07/04/2026",
        "createdAt": "2026-04-07T12:00:00.000Z",
        "updatedAt": "2026-04-07T12:00:00.000Z",
        "deletedAt": null
      }
    ],
    "count": 8
  }
}
```

---

### 3️⃣ POST /api/chatbot - Tạo dữ liệu chatbot mới

**Mục đích:** Tạo một bản ghi dữ liệu tri thức mới

**Request:**
```json
{
  "title": "FAQ - Câu hỏi thường gặp",
  "content": "Q: Làm sao để đổi mật khẩu?\nA: Vào Settings > Đổi mật khẩu",
  "fileType": "text",
  "htmlContent": "<p>Q: Làm sao để đổi mật khẩu?</p>",
  "imageCount": 0,
  "date": "Ngày 07/04/2026"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "FAQ - Câu hỏi thường gặp",
    "content": "Q: Làm sao để đổi mật khẩu?...",
    "fileType": "text",
    "htmlContent": "<p>Q: Làm sao để đổi mật khẩu?</p>",
    "imageCount": 0,
    "date": "Ngày 07/04/2026",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "updatedAt": "2026-04-07T12:00:00.000Z",
    "deletedAt": null
  }
}
```

---

### 4️⃣ GET /api/chatbot/:id - Lấy chi tiết một bản ghi

**Mục đích:** Lấy thông tin chi tiết của một bản ghi theo ID

**Request:**
```bash
GET /api/chatbot/550e8400-e29b-41d4-a716-446655440001
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Quy trình đăng ký khóa học",
    "content": "Quy trình đăng ký khóa học gồm các bước sau...",
    "fileType": "text",
    "htmlContent": null,
    "imageCount": 0,
    "date": "Ngày 07/04/2026",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "updatedAt": "2026-04-07T12:00:00.000Z",
    "deletedAt": null
  }
}
```

---

### 5️⃣ PATCH /api/chatbot/:id - Cập nhật dữ liệu

**Mục đích:** Cập nhật thông tin bản ghi (có thể cập nhật một phần)

**Request:**
```json
{
  "title": "Quy trình đăng ký khóa học - Cập nhật 2026",
  "imageCount": 3
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Quy trình đăng ký khóa học - Cập nhật 2026",
    "content": "Quy trình đăng ký khóa học gồm các bước sau...",
    "fileType": "text",
    "htmlContent": null,
    "imageCount": 3,
    "date": "Ngày 07/04/2026",
    "createdAt": "2026-04-07T12:00:00.000Z",
    "updatedAt": "2026-04-07T12:05:00.000Z",
    "deletedAt": null
  }
}
```

---

### 6️⃣ DELETE /api/chatbot/:id - Xóa dữ liệu

**Mục đích:** Xóa một bản ghi (soft delete - đánh dấu xóa, không xóa vật lý)

**Request:**
```bash
DELETE /api/chatbot/550e8400-e29b-41d4-a716-446655440001
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "message": "Chat data deleted successfully"
  }
}
```

---

## 🔧 Filter Rules

Sử dụng trong query parameter `filter=property:rule:value`

| Rule | Mô tả | Ví dụ |
|------|-------|-------|
| `eq` | Bằng | `?filter=fileType:eq:text` |
| `neq` | Không bằng | `?filter=fileType:neq:word` |
| `gt` | Lớn hơn | `?filter=imageCount:gt:5` |
| `gte` | Lớn hơn hoặc bằng | `?filter=imageCount:gte:5` |
| `lt` | Nhỏ hơn | `?filter=imageCount:lt:10` |
| `lte` | Nhỏ hơn hoặc bằng | `?filter=imageCount:lte:10` |
| `like` | Chứa (case-insensitive) | `?filter=title:like:đăng ký` |
| `nlike` | Không chứa | `?filter=title:nlike:admin` |
| `in` | Trong danh sách | `?filter=fileType:in:text,word` |
| `nin` | Không trong danh sách | `?filter=fileType:nin:text,word` |
| `isnull` | Là NULL | `?filter=htmlContent:isnull` |
| `isnotnull` | Không NULL | `?filter=htmlContent:isnotnull` |

**Ghép nhiều filter:**
```bash
?filter=title:like:đăng ký&&imageCount:gt:0
```

---

## 📝 Ví dụ sử dụng với JavaScript/Fetch

### Hỏi AI

```javascript
const question = "Làm sao để nộp bài tập?";

const response = await fetch('http://localhost:3000/api/chatbot/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ question }),
});

const result = await response.json();
console.log('Câu trả lời:', result.data.answer);
console.log('Tài liệu tham khảo:', result.data.references);
```

### Lấy danh sách với phân trang

```javascript
const response = await fetch(
  'http://localhost:3000/api/chatbot?page=1&size=10&sort=createdAt:desc',
);

const result = await response.json();
console.log('Danh sách:', result.data.rows);
console.log('Tổng cộng:', result.data.count);
```

### Tạo dữ liệu mới

```javascript
const newData = {
  title: "Hướng dẫn sử dụng video",
  content: "Cách xem video trong khóa học...",
  fileType: "text",
  imageCount: 2,
};

const response = await fetch('http://localhost:3000/api/chatbot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newData),
});

const result = await response.json();
console.log('ID bản ghi mới:', result.data.id);
```

### Cập nhật dữ liệu

```javascript
const id = '550e8400-e29b-41d4-a716-446655440001';
const updates = {
  title: "Hướng dẫn sử dụng video - Cập nhật",
  imageCount: 5,
};

const response = await fetch(`http://localhost:3000/api/chatbot/${id}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updates),
});

const result = await response.json();
console.log('Dữ liệu sau cập nhật:', result.data);
```

### Xóa dữ liệu

```javascript
const id = '550e8400-e29b-41d4-a716-446655440001';

const response = await fetch(`http://localhost:3000/api/chatbot/${id}`, {
  method: 'DELETE',
});

const result = await response.json();
console.log(result.data.message); // "Chat data deleted successfully"
```

---

## 🌍 Ví dụ sử dụng với Axios

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/chatbot';

// Hỏi AI
const askQuestion = async (question) => {
  const { data } = await axios.post(`${API_BASE}/ask`, { question });
  return data.data;
};

// Lấy danh sách
const getList = async (page = 1, size = 10) => {
  const { data } = await axios.get(API_BASE, {
    params: { page, size, sort: 'createdAt:desc' },
  });
  return data.data;
};

// Tạo mới
const createChatData = async (chatData) => {
  const { data } = await axios.post(API_BASE, chatData);
  return data.data;
};

// Lấy chi tiết
const getChatDataById = async (id) => {
  const { data } = await axios.get(`${API_BASE}/${id}`);
  return data.data;
};

// Cập nhật
const updateChatData = async (id, updates) => {
  const { data } = await axios.patch(`${API_BASE}/${id}`, updates);
  return data.data;
};

// Xóa
const deleteChatData = async (id) => {
  await axios.delete(`${API_BASE}/${id}`);
};
```

---

## 📊 Dữ liệu mẫu sẵn có

Backend đi kèm 8 bản ghi dữ liệu mẫu:

1. **Quy trình đăng ký khóa học** - Hướng dẫn 7 bước đăng ký
2. **Chính sách hoàn tiền** - Điều kiện và thời gian hoàn tiền
3. **Cách sử dụng bảng điều khiển học tập** - Tính năng của Dashboard
4. **Hướng dẫn nộp bài tập** - Quy trình nộp bài từng bước
5. **Giải quyết vấn đề kết nối** - Xử lý lỗi connection
6. **Các tính năng nâng cao** - Danh sách tính năng premium
7. **Yêu cầu hệ thống** - Yêu cầu máy tính/điện thoại
8. **Liên hệ hỗ trợ** - Thông tin bộ phận support

Có thể test ngay bằng query:
```bash
curl "http://localhost:3000/api/chatbot"
```

---

## 🔐 Authentication

**Tất cả API không yêu cầu authentication** (không cần JWT token)

---

## ⚠️ Error Handling

### Status Codes

| Code | Meaning | Ví dụ |
|------|---------|-------|
| 200 | OK - Thành công | GET, PATCH, DELETE |
| 201 | Created - Tạo thành công | POST |
| 400 | Bad Request - Dữ liệu không hợp lệ | Question bị rỗng |
| 404 | Not Found - Không tìm thấy | ID không tồn tại |
| 503 | Service Unavailable - Gemini API chưa config | GEMINI_API_KEY missing |

### Response Error Format

```json
{
  "statusCode": 400,
  "message": "Question is required"
}
```

---

## 🎨 UI Integration Example

### Chat Widget Component (React Example)

```jsx
import { useState } from 'react';

export function ChatbotWidget() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setAnswer(data.data.answer);
      setReferences(data.data.references);
      setQuestion('');
    } catch (error) {
      setAnswer('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Hỏi câu hỏi của bạn..."
      />
      <button onClick={handleAsk} disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Hỏi'}
      </button>

      {answer && (
        <div className="answer-box">
          <p>{answer}</p>

          {references.length > 0 && (
            <div className="references">
              <h4>Tài liệu tham khảo:</h4>
              {references.map((ref) => (
                <div key={ref.id} className="reference-item">
                  <h5>{ref.title}</h5>
                  <p>{ref.content.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 🔔 Lưu ý quan trọng

1. **Soft Delete:** Khi xóa dữ liệu, nó không bị xóa khỏi database mà bị đánh dấu (`deletedAt` != null). Danh sách chỉ hiển thị bản ghi chưa xóa.

2. **Gemini API:** Hệ thống sử dụng Google Gemini 2.5 Flash model. Cần cấu hình `GEMINI_API_KEY` trong `.env`

3. **Case Sensitive:** PostgreSQL phân biệt chữ hoa/thường. Tên cột sử dụng camelCase: `fileType`, `htmlContent`, `imageCount`

4. **Performance:** Mặc định `size=10`, có thể dùng `size=unlimited` để lấy tất cả

5. **Sort Direction:** Mặc định sắp xếp theo `createdAt:DESC` (mới nhất trước)

---

## 📞 Support

Liên hệ team backend nếu cần hỗ trợ API.

**Repo:** EduNet Backend  
**Endpoint Base:** `http://localhost:3000/api`  
**Module:** Chatbot (`src/chatbot/`)
