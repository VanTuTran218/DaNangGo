const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function uuid() {
  return crypto.randomUUID();
}

// 1. POSTMAN ENVIRONMENT
const environment = {
  id: uuid(),
  name: "DaNangGo - Local Development Environment",
  values: [
    {
      key: "baseUrl",
      value: "http://localhost:8000",
      type: "default",
      enabled: true
    },
    {
      key: "partnerEmail",
      value: "partner@dananggo.vn",
      type: "default",
      enabled: true
    },
    {
      key: "partnerPassword",
      value: "Password123@",
      type: "secret",
      enabled: true
    },
    {
      key: "adminEmail",
      value: "admin@dananggo.vn",
      type: "default",
      enabled: true
    },
    {
      key: "adminPassword",
      value: "Password123@",
      type: "secret",
      enabled: true
    },
    {
      key: "partnerToken",
      value: "",
      type: "secret",
      enabled: true
    },
    {
      key: "adminToken",
      value: "",
      type: "secret",
      enabled: true
    },
    {
      key: "testPlaceId",
      value: "1",
      type: "default",
      enabled: true
    },
    {
      key: "testMenuItemId",
      value: "1",
      type: "default",
      enabled: true
    }
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: new Date().toISOString(),
  _postman_exported_using: "Postman/10.0.0"
};

// 2. HELPER TO CREATE REQUEST ITEM
function makeRequest({ name, method, urlPath, query = [], headers = [], body = null, testScript = "" }) {
  const urlParts = urlPath.replace(/^\//, '').split('/');
  
  const queryList = query.map(q => ({
    key: q.key,
    value: String(q.value),
    description: q.description || ""
  }));

  const headerList = [
    { key: "Accept", value: "application/json", type: "text" },
    ...headers.map(h => ({ key: h.key, value: h.value, type: "text" }))
  ];

  if (body) {
    headerList.push({ key: "Content-Type", value: "application/json", type: "text" });
  }

  const reqItem = {
    name,
    request: {
      method,
      header: headerList,
      url: {
        raw: `{{baseUrl}}${urlPath}${queryList.length ? '?' + queryList.map(q => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : ''}`,
        host: ["{{baseUrl}}"],
        path: urlParts,
        query: queryList.length ? queryList : undefined
      }
    },
    response: []
  };

  if (body) {
    reqItem.request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: "json"
        }
      }
    };
  }

  if (testScript) {
    reqItem.event = [
      {
        listen: "test",
        script: {
          type: "text/javascript",
          exec: testScript.trim().split("\n")
        }
      }
    ];
  }

  return reqItem;
}

// 3. BUILD COLLECTION
const collection = {
  info: {
    _postman_id: uuid(),
    name: "DaNangGo - All API Endpoints & Test Suite (Task 10)",
    description: "Bộ sưu tập kiểm thử API toàn diện cho hệ thống DaNangGo Smart Tourism Platform (Postman Collection v2.1.0).\n\nBao gồm đầy đủ các module:\n- 1. Authentication (Partner & Admin Login, Profile, Tự động trích xuất token)\n- 2. Categories & Master Data (Quận/Huyện, Ẩm thực, Khẩu vị, Địa điểm du lịch)\n- 3. Public Discovery & Search (Tìm kiếm không dấu, lọc giá, phân trang)\n- 4. Partner Places Management (CRUD cơ sở, đồng bộ trạng thái, hồ sơ đối tác)\n- 5. Menu Items Management (CRUD món ăn, đồng bộ giá thực đơn)\n- 6. Admin Portal Management (Duyệt địa điểm, Khóa/Mở khóa, Phê duyệt đối tác)\n- 7. Security & Edge Case Tests (Phân quyền 403, validation 400, auth 401)",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    // -------------------------------------------------------------
    // FOLDER 1: AUTHENTICATION
    // -------------------------------------------------------------
    {
      name: "1. Authentication & Session",
      item: [
        makeRequest({
          name: "1.1 Đăng nhập Đối tác (Partner Login)",
          method: "POST",
          urlPath: "/api/auth/login",
          body: {
            identifier: "{{partnerEmail}}",
            password: "{{partnerPassword}}"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Login success and returns token", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.accessToken).to.be.a('string');
});
if (res.data && res.data.accessToken) {
    pm.environment.set("partnerToken", res.data.accessToken);
    console.log("Partner token updated into environment variable 'partnerToken'");
}
`
        }),
        makeRequest({
          name: "1.2 Xem thông tin phiên Đối tác (Partner Profile)",
          method: "GET",
          urlPath: "/api/auth/me",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("User role is PARTNER", function () {
    pm.expect(res.data.user.role).to.eql("PARTNER");
});
`
        }),
        makeRequest({
          name: "1.3 Đăng nhập Quản trị viên (Admin Login)",
          method: "POST",
          urlPath: "/api/admin/auth/login",
          body: {
            identifier: "{{adminEmail}}",
            password: "{{adminPassword}}"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Admin login success and returns token", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.accessToken).to.be.a('string');
});
if (res.data && res.data.accessToken) {
    pm.environment.set("adminToken", res.data.accessToken);
    console.log("Admin token updated into environment variable 'adminToken'");
}
`
        }),
        makeRequest({
          name: "1.4 Xem thông tin phiên Quản trị viên (Admin Session)",
          method: "GET",
          urlPath: "/api/admin/auth/me",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("User role is ADMIN", function () {
    pm.expect(res.data.user.role).to.eql("ADMIN");
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 2: CATEGORIES & MASTER DATA
    // -------------------------------------------------------------
    {
      name: "2. Categories & Master Data",
      item: [
        makeRequest({
          name: "2.1 Lấy danh sách Quận / Huyện (Districts)",
          method: "GET",
          urlPath: "/api/districts",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns list of districts", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
    pm.expect(res.data.length).to.be.above(0);
});
`
        }),
        makeRequest({
          name: "2.2 Lấy danh mục Ẩm thực (Cuisines)",
          method: "GET",
          urlPath: "/api/cuisines",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns list of cuisines", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
`
        }),
        makeRequest({
          name: "2.3 Lấy danh mục Khẩu vị (Tastes)",
          method: "GET",
          urlPath: "/api/tastes",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns list of tastes", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
`
        }),
        makeRequest({
          name: "2.4 Lấy danh mục Điểm tham quan (Attraction Categories)",
          method: "GET",
          urlPath: "/api/attraction-categories",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns list of attraction categories", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 3: PUBLIC DISCOVERY & SEARCH
    // -------------------------------------------------------------
    {
      name: "3. Public Search & Discovery",
      item: [
        makeRequest({
          name: "3.1 Tìm kiếm quán (Accent-insensitive: 'mi quang')",
          method: "GET",
          urlPath: "/api/places",
          query: [
            { key: "q", value: "mi quang", description: "Từ khóa không dấu" },
            { key: "page", value: "1", description: "Trang hiện tại" },
            { key: "limit", value: "10", description: "Số bản ghi mỗi trang" }
          ],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Search returns matching results", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.items).to.be.an('array');
});
`
        }),
        makeRequest({
          name: "3.2 Lọc theo Quận và Khoảng giá (District 1, 20k-100k)",
          method: "GET",
          urlPath: "/api/places",
          query: [
            { key: "district_id", value: "1", description: "Quận Hải Châu" },
            { key: "min_price", value: "20000", description: "Giá tối thiểu" },
            { key: "max_price", value: "100000", description: "Giá tối đa" }
          ],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns filtered places", function () {
    pm.expect(res.success).to.be.true;
});
`
        }),
        makeRequest({
          name: "3.3 Xem chi tiết địa điểm công khai (Public Place Detail)",
          method: "GET",
          urlPath: "/api/places/{{testPlaceId}}",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Contains place details", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.place_id).to.eql(Number(pm.environment.get("testPlaceId")));
});
`
        }),
        makeRequest({
          name: "3.4 Lấy danh sách quán ăn chuyên biệt (Restaurants API)",
          method: "GET",
          urlPath: "/api/restaurants",
          query: [
            { key: "page", value: "1" },
            { key: "limit", value: "10" }
          ],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns paginated restaurants", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.items).to.be.an('array');
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 4: PARTNER PLACE MANAGEMENT
    // -------------------------------------------------------------
    {
      name: "4. Partner Place Management",
      item: [
        makeRequest({
          name: "4.1 Lấy danh sách cơ sở thuộc sở hữu đối tác",
          method: "GET",
          urlPath: "/api/partner/places",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns partner places list", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
if (res.data && res.data.length > 0) {
    pm.environment.set("testPlaceId", res.data[0].place_id);
    console.log("Updated testPlaceId from partner list:", res.data[0].place_id);
}
`
        }),
        makeRequest({
          name: "4.2 Lấy chi tiết 1 cơ sở của đối tác",
          method: "GET",
          urlPath: "/api/partner/places/{{testPlaceId}}",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns place owned by partner", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.place_id).to.eql(Number(pm.environment.get("testPlaceId")));
});
`
        }),
        makeRequest({
          name: "4.3 Tạo nhà hàng mới (Partner Create)",
          method: "POST",
          urlPath: "/api/restaurants",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Quán Ăn Thử Nghiệm Postman DaNangGo",
            description: "Quán ăn chuyên các món đặc sản miền Trung được tạo tự động bởi Postman test suite.",
            address: "123 Đường Bạch Đằng, Phường Hải Châu 1",
            district_id: 1,
            cuisine_id: 1,
            price_min: 35000,
            price_max: 85000,
            latitude: 16.0678,
            longitude: 108.2208,
            phone: "0905123456",
            website: "https://dananggo.vn",
            images: [
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"
            ]
          },
          testScript: `
pm.test("Status code is 201 (Created)", function () {
    pm.response.to.have.status(201);
});
var res = pm.response.json();
pm.test("Created restaurant successfully", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.place_id).to.be.a('number');
});
if (res.data && res.data.place_id) {
    pm.environment.set("testPlaceId", res.data.place_id);
    console.log("Created place ID set to testPlaceId:", res.data.place_id);
}
`
        }),
        makeRequest({
          name: "4.4 Cập nhật thông tin cơ sở (Partner Update)",
          method: "PUT",
          urlPath: "/api/restaurants/{{testPlaceId}}",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Quán Ăn Thử Nghiệm Postman DaNangGo (Đã cập nhật)",
            description: "Đã cập nhật mô tả món ngon và giờ mở cửa.",
            price_min: 40000,
            price_max: 95000,
            address: "123 Đường Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Update place succeeded", function () {
    pm.expect(res.success).to.be.true;
});
`
        }),
        makeRequest({
          name: "4.5 Đối tác Ẩn/Hiện quán (PATCH Status: HIDDEN / ACTIVE)",
          method: "PATCH",
          urlPath: "/api/places/{{testPlaceId}}/status",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            status: "HIDDEN"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Status updated to HIDDEN", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.status).to.eql("HIDDEN");
});
`
        }),
        makeRequest({
          name: "4.6 Xem hồ sơ thông tin đối tác (Partner Profile)",
          method: "GET",
          urlPath: "/api/partner/profile",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns partner profile", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.business_name).to.be.a('string');
});
`
        }),
        makeRequest({
          name: "4.7 Cập nhật thông tin hồ sơ đối tác",
          method: "PUT",
          urlPath: "/api/partner/profile",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            businessName: "Hộ kinh doanh Ẩm Thực Đà Nẵng",
            serviceType: "TABLE",
            taxCode: "0401234567",
            address: "Hải Châu, Đà Nẵng",
            phone: "0905999888"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Partner profile updated", function () {
    pm.expect(res.success).to.be.true;
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 5: MENU & PRICE SYNC
    // -------------------------------------------------------------
    {
      name: "5. Menu Items & Price Sync",
      item: [
        makeRequest({
          name: "5.1 Lấy danh sách món ăn của cơ sở",
          method: "GET",
          urlPath: "/api/restaurants/{{testPlaceId}}/menu-items",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns menu items array", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
if (res.data && res.data.length > 0) {
    pm.environment.set("testMenuItemId", res.data[0].item_id);
    console.log("Updated testMenuItemId:", res.data[0].item_id);
}
`
        }),
        makeRequest({
          name: "5.2 Thêm món ăn mới vào thực đơn (Add Dish)",
          method: "POST",
          urlPath: "/api/restaurants/{{testPlaceId}}/menu-items",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Mì Quảng Ếch Đặc Sản",
            price: 55000,
            description: "Mì Quảng ếch om niêu đất thơm ngon chuẩn vị Quảng Nam - Đà Nẵng.",
            image_url: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800",
            is_available: true,
            taste_ids: [1]
          },
          testScript: `
pm.test("Status code is 201 (Created)", function () {
    pm.response.to.have.status(201);
});
var res = pm.response.json();
pm.test("Dish created successfully", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.item_id).to.be.a('number');
});
if (res.data && res.data.item_id) {
    pm.environment.set("testMenuItemId", res.data.item_id);
    console.log("New dish created, set testMenuItemId:", res.data.item_id);
}
`
        }),
        makeRequest({
          name: "5.3 Xem chi tiết 1 món ăn",
          method: "GET",
          urlPath: "/api/menu-items/{{testMenuItemId}}",
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns menu item details", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.item_id).to.eql(Number(pm.environment.get("testMenuItemId")));
});
`
        }),
        makeRequest({
          name: "5.4 Cập nhật thông tin món ăn (Update Dish)",
          method: "PUT",
          urlPath: "/api/menu-items/{{testMenuItemId}}",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Mì Quảng Ếch Đặc Sản Niêu Đất (Phần Lớn)",
            price: 65000,
            is_available: true
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Dish updated successfully", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.price).to.eql(65000);
});
`
        }),
        makeRequest({
          name: "5.5 Xóa mềm / Ẩn món ăn khỏi thực đơn (Soft Delete)",
          method: "DELETE",
          urlPath: "/api/menu-items/{{testMenuItemId}}",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Dish soft deleted successfully", function () {
    pm.expect(res.success).to.be.true;
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 6: ADMIN PORTAL & APPROVAL MANAGEMENT
    // -------------------------------------------------------------
    {
      name: "6. Admin Portal Management",
      item: [
        makeRequest({
          name: "6.1 Admin lấy danh sách địa điểm toàn hệ thống (Lọc Ẩm thực)",
          method: "GET",
          urlPath: "/api/admin/places",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          query: [
            { key: "category", value: "amthuc", description: "Loại ẩm thực" },
            { key: "status", value: "APPROVED", description: "Trạng thái" }
          ],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns admin places list", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data).to.be.an('array');
});
`
        }),
        makeRequest({
          name: "6.2 Admin Phê duyệt cơ sở (Status -> APPROVED)",
          method: "PATCH",
          urlPath: "/api/admin/places/{{testPlaceId}}/status",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          body: {
            status: "APPROVED"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Admin approved place", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.status).to.eql("APPROVED");
});
`
        }),
        makeRequest({
          name: "6.3 Admin Khóa cơ sở vi phạm (Status -> LOCKED)",
          method: "PATCH",
          urlPath: "/api/admin/places/{{testPlaceId}}/status",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          body: {
            status: "LOCKED"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Admin locked place", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.status).to.eql("LOCKED");
});
`
        }),
        makeRequest({
          name: "6.4 Admin Mở khóa cơ sở (Status -> APPROVED)",
          method: "PATCH",
          urlPath: "/api/admin/places/{{testPlaceId}}/status",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          body: {
            status: "APPROVED"
          },
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Admin unlocked place to APPROVED", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.status).to.eql("APPROVED");
});
`
        }),
        makeRequest({
          name: "6.5 Admin xem danh sách hồ sơ đối tác chờ duyệt",
          method: "GET",
          urlPath: "/api/admin/partners",
          headers: [{ key: "Authorization", value: "Bearer {{adminToken}}" }],
          query: [
            { key: "status", value: "PENDING_APPROVAL" },
            { key: "limit", value: "50" },
            { key: "offset", value: "0" }
          ],
          testScript: `
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
var res = pm.response.json();
pm.test("Returns partner registrations", function () {
    pm.expect(res.success).to.be.true;
    pm.expect(res.data.partners).to.be.an('array');
});
`
        })
      ]
    },

    // -------------------------------------------------------------
    // FOLDER 7: SECURITY & EDGE CASES
    // -------------------------------------------------------------
    {
      name: "7. Security & Edge Case Tests (Step 10.4 Validation)",
      item: [
        makeRequest({
          name: "7.1 Edge Case 4: Phân trang limit > 50 bị từ chối (400 Bad Request)",
          method: "GET",
          urlPath: "/api/places",
          query: [
            { key: "limit", value: "100", description: "Vượt giới hạn tối đa 50" }
          ],
          testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
var res = pm.response.json();
pm.test("Error message mentions limit exceeding 50", function () {
    pm.expect(res.success).to.be.false;
});
`
        }),
        makeRequest({
          name: "7.2 Bảo mật 401: Truy cập route bảo vệ mà không có Token",
          method: "GET",
          urlPath: "/api/partner/places",
          testScript: `
pm.test("Status code is 401 Unauthorized", function () {
    pm.response.to.have.status(401);
});
`
        }),
        makeRequest({
          name: "7.3 Validation 400: Giá món ăn là số âm bị từ chối",
          method: "POST",
          urlPath: "/api/restaurants/{{testPlaceId}}/menu-items",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Món Ăn Giá Âm Lỗi",
            price: -50000
          },
          testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
var res = pm.response.json();
pm.test("Rejects negative price", function () {
    pm.expect(res.success).to.be.false;
});
`
        }),
        makeRequest({
          name: "7.4 Validation 400: Tọa độ ngoài phạm vi Đà Nẵng",
          method: "POST",
          urlPath: "/api/restaurants",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            name: "Quán Tọa Độ Sai Lệch",
            address: "Hải Châu, Đà Nẵng",
            district_id: 1,
            latitude: 105.0, // Sai, > 90
            longitude: 200.0 // Sai, > 180
          },
          testScript: `
pm.test("Status code is 400 Bad Request", function () {
    pm.response.to.have.status(400);
});
`
        }),
        makeRequest({
          name: "7.5 Bảo mật 403: Đối tác không được phép tự set trạng thái LOCKED",
          method: "PATCH",
          urlPath: "/api/places/{{testPlaceId}}/status",
          headers: [{ key: "Authorization", value: "Bearer {{partnerToken}}" }],
          body: {
            status: "LOCKED"
          },
          testScript: `
pm.test("Status code is 403 Forbidden", function () {
    pm.response.to.have.status(403);
});
`
        })
      ]
    }
  ]
};

// 4. WRITE OUT FILES
const outDir = path.resolve(__dirname);
const collectionPath = path.join(outDir, 'DaNangGo_Task10_Collection.postman_collection.json');
const environmentPath = path.join(outDir, 'DaNangGo_Task10_Environment.postman_environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
fs.writeFileSync(environmentPath, JSON.stringify(environment, null, 2), 'utf8');

console.log('✅ Generated Postman Collection at:', collectionPath);
console.log('✅ Generated Postman Environment at:', environmentPath);
