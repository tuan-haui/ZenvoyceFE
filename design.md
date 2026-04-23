# Mô tả chung
Tôi muốn bạn thiết kế một giao diện website kiểu dạng Admin Dashboard để quản lý nghiệp vụ liên quan hoá đơn điện tử. Phong cách giao diện kiểu đơn giản, hiện tại, tối giản dựa trên UI của Ant Design for Angular. Trang web bao gồm các trang để quản lý ký số.

# 1. Phân hệ Quản trị Hệ thống và Người dùng

## 1.1. Màn hình Đăng nhập / Quên mật khẩu

**Mục đích:** Xác thực người dùng truy cập vào hệ thống.  

**Bố cục:** Form đăng nhập nằm giữa màn hình (Centered Card), logo Zenvoyce ở trên cùng.  

### Trường thông tin (Input):
- Tên đăng nhập: Text input (Bắt buộc).
- Mật khẩu: Password input (Có biểu tượng con mắt để ẩn/hiện mật khẩu).
- Nhớ mật khẩu: Checkbox.

### Nút thao tác (Actions):
- **[Đăng nhập]:** Submit form, gọi API Auth.
- **[Quên mật khẩu]:** Mở modal/chuyển trang nhập Email để nhận mã OTP/Link reset.

---

## 1.2. Màn hình Quản lý người dùng

**Mục đích:** Danh sách tài khoản và cấp phát quyền.  

**Bố cục:** Thanh công cụ tìm kiếm ở trên, Bảng dữ liệu (Data Grid) ở giữa, Phân trang ở dưới.  
Form Thêm/Sửa dạng Popup Modal hoặc Drawer (trượt từ phải sang).

### Bảng dữ liệu hiển thị:
- Họ tên  
- Tên đăng nhập  
- Email  
- Vai trò  
- Thuộc Công ty  
- Trạng thái (Badge Xanh/Đỏ)

### Form Thêm/Sửa (Input):
- Họ tên  
- Email  
- Số điện thoại  
- Tên đăng nhập  
- Mật khẩu (Chỉ hiện khi thêm mới)  
- Vai trò (Dropdown: Admin, Kế toán trưởng, Kế toán...)  
- Công ty quản lý (Dropdown chọn công ty)  
- Trạng thái: Toggle Switch (Hoạt động / Khóa)

### Nút thao tác:
- [+ Thêm mới]  
- [Tìm kiếm]  
- [Sửa]  
- [Khóa tài khoản]  
- [Đổi mật khẩu]

---

## 1.3. Màn hình Quản lý Phân quyền (Ma trận quyền)

**Mục đích:** Gán quyền thao tác trên các Menu cho từng Vai trò.  

**Bố cục:** Bảng ma trận (Matrix Table).  
- Cột dọc: danh sách Menu  
- Cột ngang: các thao tác (Xem, Thêm, Sửa, Xóa)

### Tương tác:
- Dropdown chọn **[Vai trò]** (Ví dụ: Kế toán viên)  
- Checkbox `[ ]` giữa Menu và Thao tác để bật/tắt quyền  

### Nút thao tác:
- [Lưu cấu hình quyền]

---

# 2. Phân hệ Quản lý Danh mục

## 2.1. Màn hình Quản lý Công ty

**Mục đích:** Thiết lập thông tin doanh nghiệp phát hành hóa đơn.  

**Bố cục:** 2 tab:
- "Thông tin chung"
- "Cấu hình chữ ký số"

### Form nhập liệu:

#### Thông tin chung:
- Tên công ty  
- Mã số thuế (Unique)  
- Địa chỉ  
- Người đại diện  
- Điện thoại  
- Email liên hệ  
- Tài khoản ngân hàng  

#### Media:
- Vùng Drag & Drop tải Logo công ty  

#### Chữ ký số:
- Upload file Certificate (.p12, .cer) hoặc kết nối HSM  

### Nút thao tác:
- [Lưu thông tin]  
- [Đặt làm công ty mặc định]

**Lưu ý UI:** Nếu công ty đã phát hành hóa đơn → field Mã số thuế bị disable.

---

## 2.2. Màn hình Quản lý Khách hàng

**Mục đích:** Danh bạ khách hàng/người mua.  

**Bố cục:** Data Grid + bộ lọc  

### Form nhập liệu:
- Tên khách hàng/Đơn vị  
- Mã số thuế  
- Địa chỉ  
- Email nhận hóa đơn (Quan trọng)  
- Số điện thoại  

### Nút thao tác:
- [+ Thêm khách hàng]  
- [Import từ Excel]  
- [Sửa]  
- [Xóa]

---

## 2.3. Màn hình Danh mục Hàng hóa / Dịch vụ

**Mục đích:** Quản lý sản phẩm để lập hóa đơn.  

**Bố cục:** Data Grid  

### Form nhập liệu:
- Mã hàng  
- Tên hàng hóa/dịch vụ  
- Đơn vị tính (Dropdown/Combobox)  
- Đơn giá (Numeric input có format dấu phẩy)  
- Thuế suất (Dropdown: 0%, 5%, 8%, 10%, KCT)

### Nút thao tác:
- [+ Thêm hàng hóa]  
- [Import hàng loạt]  
- [Sửa]  
- [Ngưng sử dụng]

---

# 3. Phân hệ Quản lý Mẫu hóa đơn

## 3.1. Màn hình Thiết lập & Áp dụng mẫu hóa đơn

**Mục đích:** Tùy biến giao diện hóa đơn.  

**Bố cục:** Split-view  
- Trái: Panel cấu hình  
- Phải: Preview PDF (Live)

### Panel cấu hình:
- Chọn mẫu nền (Base Template)  
- Upload Logo & căn chỉnh (Trái/Giữa/Phải)  
- Nhập Watermark  
- Chọn màu chủ đạo (Color picker)

### Nút thao tác:
- [Xem trước]  
- [Lưu mẫu và Áp dụng cho công ty]

---

## 3.2. Màn hình Kho mẫu phát hành

**Mục đích:** Quản lý và gửi thông báo phát hành mẫu.  

**Bố cục:** Card hoặc Table  

### Hiển thị:
- Thumbnail mẫu  
- Ký hiệu mẫu (VD: 1C26TAA)  
- Trạng thái (Chưa thông báo / Đang chờ / Đã chấp nhận)

### Nút thao tác:
- [Thông báo phát hành mẫu]  
- [Xem chi tiết]

---

# 4. Phân hệ Nghiệp vụ Hóa đơn (Cốt lõi)

## 4.1. Màn hình Lập hóa đơn mới

**Mục đích:** Tạo hóa đơn.  

**Bố cục:** Form dài gồm:
- Header  
- Thông tin khách hàng  
- Chi tiết hàng hóa  

### Trường thông tin:

#### Thông tin chung:
- Mẫu số - Ký hiệu  
- Số hóa đơn (Auto-gen)  
- Ngày lập  

#### Người mua:
- Search khách hàng → auto-fill thông tin  

#### Hàng hóa (Editable Table):
- [+ Thêm dòng]  
- Mã/Tên hàng (autocomplete)  
- Số lượng  
- Đơn giá  

#### Tổng kết:
- Tổng tiền hàng  
- Thuế GTGT  
- Tổng thanh toán  
- Số tiền bằng chữ  

### Nút thao tác:
- [Lưu nháp]  
- [Lưu & Chờ ký]  
- [In thử]

---

## 4.2. Màn hình Ký số Hóa đơn

**Mục đích:** Ký hóa đơn bằng USB Token.  

**Bố cục:**  
- Trái: danh sách "Chờ ký"  
- Phải: Preview PDF  

### Nút thao tác:
- [Ký số] (Nhập PIN Token)  
- [Ký lô]

---

## 4.3. Màn hình Phát hành (Gửi CQT)

**Mục đích:** Gửi hóa đơn lên Tổng cục Thuế.  

**Bố cục:** Data Grid  

### Cột quan trọng:
- Trạng thái CQT (Chưa gửi / Chờ cấp mã / Đã cấp / Bị từ chối)  
- Mã CQT  

### Nút thao tác:
- [Phát hành / Gửi TCT]  
- [Gửi email cho khách hàng]

---

## 4.4. Màn hình Xử lý sai sót

**Mục đích:** Điều chỉnh / Thay thế / Hủy hóa đơn.  

**Bố cục:** Popup Modal  

### Trường thông tin:
- Hóa đơn gốc (Read-only)  
- Loại xử lý (Radio):
  - Điều chỉnh tăng  
  - Điều chỉnh giảm  
  - Thay thế  
  - Hủy  
- Lý do  
- File đính kèm  

### Nút thao tác:
- [Lập hóa đơn mới]  
- [Ký Biên bản hủy]

---

# 5. Phân hệ Tra cứu và Báo cáo

## 5.1. Màn hình Tra cứu hóa đơn

**Mục đích:** Tìm kiếm hóa đơn.  

**Bố cục:**  
- Trên: Advanced Search  
- Dưới: Data Grid  

### Bộ lọc:
- Từ ngày - Đến ngày  
- Số hóa đơn  
- Khách hàng  
- Trạng thái  

### Bảng dữ liệu:
- Có cột "Hành động":
  - View PDF  
  - Download XML  
  - Xem lịch sử  

---

## 5.2. Màn hình Lịch sử hóa đơn (Audit Trail)

**Mục đích:** Xem vòng đời hóa đơn.  

**Bố cục:** Timeline  

### Chi tiết:
- Thời gian  
- Hành động  
- Người thực hiện  
- Mã phản hồi TCT  

---

## 5.3. Màn hình Báo cáo Thống kê

**Mục đích:** Dashboard & xuất báo cáo.  

**Bố cục:**
- Trên: Bộ lọc  
- Giữa: Biểu đồ  
- Dưới: Bảng dữ liệu  

### Bộ lọc:
- Kỳ báo cáo (Tháng/Quý/Năm)  
- Loại báo cáo  

### Nút thao tác:
- [Xem báo cáo]  
- [Xuất Excel]  
- [Xuất PDF]