# Hướng dẫn mô phỏng ký số XML bằng C# và .NET

## Mục tiêu

Tài liệu này mô tả quy trình mô phỏng ký số hóa đơn XML bằng chứng chỉ tự tạo trong .NET. Nội dung bao gồm:

- Tạo cặp khóa và file chứng chỉ `.pfx`
- Ký file XML theo chuẩn XMLDSig
- Xác thực chữ ký bằng Public Key
- Phân biệt giữa mô phỏng và triển khai thật
- Lưu ý quan trọng về Canonicalization (C14N)

---

## Bước 1: Tạo cặp khóa (Private Key & Public Key)

Thay vì mua chứng thư số từ các CA như Bkav, VNPT..., bạn có thể dùng OpenSSL hoặc trực tiếp viết code C# để tạo một file `.pfx`.

File `.pfx` sẽ chứa:

- **Private Key**: dùng để ký dữ liệu
- **Public Key**: dùng để xác thực chữ ký

### Ví dụ C# tạo chứng chỉ tự ký

```csharp
// Ví dụ tạo chứng chỉ tự ký bằng .NET (giả lập Token)
using var rsa = RSA.Create(2048);

var request = new CertificateRequest(
    "cn=SimulatedInvoiceSigner",
    rsa,
    HashAlgorithmName.SHA256,
    RSASignaturePadding.Pkcs1
);

var certificate = request.CreateSelfSigned(
    DateTimeOffset.Now,
    DateTimeOffset.Now.AddYears(1)
);

// Xuất ra file PFX có mật khẩu (tương tự như mã PIN của Token)
byte[] pfxData = certificate.Export(X509ContentType.Pfx, "123456");
File.WriteAllBytes("simulated_token.pfx", pfxData);
```

---

## Bước 2: Viết module ký file XML (XMLDSig)

Sau khi có file `.pfx`, bạn có thể ký số vào file hóa đơn XML đã tạo từ bước trước theo chuẩn **XMLDSig**.

### Các thành phần cần dùng

- **X509Certificate2**: để load file `.pfx` vào bộ nhớ
- **SignedXml**: để thực hiện ký XML
- **System.Security.Cryptography.Xml**: thư viện hỗ trợ thao tác chữ ký XML

### Quy trình ký

1. Tạo một đối tượng `Reference` trỏ đến toàn bộ nội dung file XML.
2. Thêm `XmlDsigEnvelopedSignatureTransform` để đảm bảo chữ ký không bao gồm chính nó.
3. Thực hiện tính toán mã băm (Hash) và ký bằng Private Key.
4. Gắn thẻ `<Signature>` vào cuối file XML.

### Mô tả ngắn gọn

Ký theo kiểu **enveloped signature** nghĩa là chữ ký nằm ngay trong chính tài liệu XML được ký. Đây là kiểu rất phổ biến khi làm việc với hóa đơn điện tử.

---

## Bước 3: Module xác thực (Verify)

Để module hoàn thiện, cần có hàm kiểm tra chữ ký.

### Các bước xác thực

- Trích xuất **Public Key** từ thẻ `<Signature>`
- Dùng Public Key để kiểm tra xem nội dung file XML có bị thay đổi dù chỉ 1 byte hay không
- Nếu dữ liệu thay đổi, chữ ký sẽ không còn hợp lệ

### Ý nghĩa

Hàm Verify giúp đảm bảo:

- Dữ liệu XML không bị sửa đổi sau khi ký
- Chữ ký đến đúng từ khóa công khai tương ứng
- Hệ thống có thể phát hiện lỗi hoặc can thiệp trái phép

---

## Sự khác biệt giữa "Giả lập" và "Thật"

### Giả lập

Bạn dùng chứng chỉ tự tạo.

Khi mở file XML/PDF bằng phần mềm như Foxit Reader, hệ thống thường báo:

> Signature is Unknown

Nguyên nhân là chứng chỉ này không thuộc hệ thống tin cậy toàn cầu.

### Thật

Bạn dùng Private Key nằm bên trong chip bảo mật của USB Token.

Khi đó chữ ký thường hiển thị:

> Signature is Valid

Lý do là chứng chỉ được cấp bởi các tổ chức được công nhận theo quy định.

---

## Lời khuyên cho dự án

Hãy tập trung đặc biệt vào **Canonicalization (C14N)**.

### Vì sao C14N quan trọng?

Canonicalization là bước chuẩn hóa XML trước khi ký, nhằm đảm bảo:

- Cùng một nội dung thì luôn cho ra cùng một biểu diễn chuẩn
- Tránh lỗi do khác nhau ở khoảng trắng, xuống dòng hoặc thứ tự thuộc tính
- Hạn chế việc file chỉ khác nhau một ký tự định dạng mà chữ ký bị hỏng

### Lưu ý thực tế

Đây là lỗi mà nhiều lập trình viên thường gặp nhất khi triển khai hóa đơn điện tử. Nếu không xử lý C14N đúng cách, chữ ký có thể không xác minh được dù nội dung nhìn bề ngoài vẫn giống nhau.

---

## Kết luận

Quy trình mô phỏng ký số XML bằng .NET có thể tóm tắt như sau:

1. Tạo chứng chỉ tự ký và xuất ra file `.pfx`
2. Dùng `SignedXml` để ký vào file XML
3. Dùng Public Key để xác thực chữ ký
4. Đảm bảo xử lý đúng Canonicalization để tránh lỗi ký số

Nếu bạn đang xây dựng hệ thống hóa đơn điện tử, đây là nền tảng quan trọng để hiểu cơ chế ký số trước khi tích hợp với USB Token thật.
