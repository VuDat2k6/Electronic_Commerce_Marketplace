# Testing Checklist Alignment Plan

## Yeu cau
- Cap nhat truc tiep `TESTING_CHECKLIST.md` thanh ke hoach test co the thuc thi cho marketplace hien tai.
- Phan anh dung role boundary: admin moderation/canh bao, seller quan ly catalog va bulk upload.
- Bao phu login, storefront, cart, checkout/payment QR, order, review, notification va dashboard.

## Nguyen nhan can sua
- Checklist hien tai van liet ke admin tao/sua/xoa/upload san pham va admin bulk upload, trai voi RBAC da sua.
- Luong quan trong vua bo sung chua duoc dat lam gate: canh bao vi pham, seller archive listing da co order, checkout tu choi listing archived va mailbox isolation.
- Tai khoan seed da mo rong nhung checklist chi neu ba tai khoan, chua ho tro test phe duyet seller hoac cross-seller access.
- Ke hoach hien tai dai nhung chua tach smoke gate, workflow regression va evidence can thu thap.

## Noi dung se cap nhat
- Dieu kien chay local: frontend `3000`, backend `5000`, seed va lenh test.
- Tai khoan/du lieu seed dung cho buyer, pending seller, hai seller active va admin.
- Test gates theo thu tu: startup, auth, storefront, checkout/payment, seller, admin moderation, security, responsive/performance.
- Case cu the co actor, buoc thuc hien, ket qua mong doi, priority va evidence.
- Danh sach automated suite hien co va ma tran ghi nhan loi.

## Nguyen tac khong thay doi ung dung
- Day la thay doi tai lieu kiem thu; khong sua business logic, API hay du lieu.
- Bulk upload chi duoc test duoi vai tro seller; admin khong co test CRUD catalog.

## Kiem tra du kien
- Doc lai checklist de bao dam khong con admin bulk upload hoac admin product CRUD nhu mot hanh vi hop le.
- Xac minh cac route/component/file duoc nhac den ton tai trong workspace.

## Ket qua
- `TESTING_CHECKLIST.md` da duoc thay bang ke hoach theo 8 gates tu startup den UX/performance, co severity, evidence va release exit criteria.
- Checklist da phan anh dung kien truc hien tai: admin moderation/warning read-only, seller catalog/bulk upload, checkout QR va archive/order safety.
- Tai khoan seed cho admin, buyer, become-seller, pending seller va hai seller active da duoc dua vao plan de chay RBAC/cross-seller scenarios.
- Da bo cac case admin product CRUD/bulk upload nhu hanh vi hop le; admin mutation/bulk upload chi con la negative security tests.
- Da kiem tra cac route/component va E2E suite duoc tham chieu trong checklist deu ton tai.
- Ke hoach ghi ro blocker hien co cua full TypeScript gate tai `e2e/test-reg.spec.ts:20`.
