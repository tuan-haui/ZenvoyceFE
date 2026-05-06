# ⚡ Hướng dẫn code & triển khai Claude (Sonnet) trên Vertex AI (chỉ phần cần thiết)

## 1. Cài đặt backend

```bash
npm init -y
npm install express @google-cloud/vertexai
```

---

## 2. Thiết lập credentials

### Cách chuẩn (khuyến nghị)

Tải Service Account JSON và set:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

---

## 3. Code backend tối giản (Node.js)

### `server.js`

```js
import express from 'express';
import { VertexAI } from '@google-cloud/vertexai';

const app = express();
app.use(express.json());

// Khởi tạo Vertex AI
const vertexAI = new VertexAI({
  project: 'YOUR_PROJECT_ID',
  location: 'us-central1',
});

// Khởi tạo model Claude
const model = vertexAI.getGenerativeModel({
  model: 'claude-3-5-sonnet@20240620',
});

// API chat
app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
    });

    const text =
      result.response.candidates[0].content.parts[0].text;

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI error' });
  }
});

// start server
app.listen(3000, () => {
  console.log('http://localhost:3000');
});
```

---

## 4. Chạy server

```bash
node server.js
```

---

## 5. Test API

### Dùng curl:

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello AI"}'
```

---

## 6. Kết nối frontend (Angular / JS)

```ts
this.http.post('http://localhost:3000/chat', {
  message: input
}).subscribe((res: any) => {
  console.log(res.reply);
});
```

---

## 7. Thêm context (giữ lịch sử chat)

```js
let history = [];

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;

  history.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const result = await model.generateContent({
    contents: history,
  });

  const reply =
    result.response.candidates[0].content.parts[0].text;

  history.push({
    role: 'model',
    parts: [{ text: reply }],
  });

  res.json({ reply });
});
```

---

## 8. Streaming response (giống ChatGPT)

```js
app.post('/chat-stream', async (req, res) => {
  const userMessage = req.body.message;

  const stream = await model.generateContentStream({
    contents: [
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ],
  });

  res.setHeader('Content-Type', 'text/plain');

  for await (const chunk of stream.stream) {
    const text = chunk.candidates[0].content.parts[0].text;
    res.write(text);
  }

  res.end();
});
```

---

## 9. Deploy (cách đơn giản nhất)

### Option 1: VPS / server

```bash
node server.js
```

---

### Option 2: Docker

#### `Dockerfile`

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]
```

```bash
docker build -t ai-app .
docker run -p 3000:3000 ai-app
```

---

## 10. Checklist nhanh

* [ ] Có `project id`
* [ ] Set `GOOGLE_APPLICATION_CREDENTIALS`
* [ ] Dùng đúng model name
* [ ] Backend chạy OK
* [ ] Gọi API trả response

---

**Xong.**
