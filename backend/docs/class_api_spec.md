# Class & Section Management Module — API Specification & Data Contracts

## 1. Overview & Architecture

The **Class Management Module** provides comprehensive grade, class, and section management for the multi-tenant School ERP.
- **Hierarchy:** One `Class` contains multiple `Sections` (e.g. Section A, Section B, Section C).
- **Multi-Tenancy:** All queries, procedures, indexes, and APIs enforce `org_id` context passed via HTTP headers and request payloads.

---

## 2. Request Headers

| Header Name | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | Bearer Cognito Access Token |
| `org_id` | Number | Yes | Organization / Tenant ID (e.g. `1001`) |
| `x-user-id` | Number | No | Authenticated User ID for audit tracking |
| `Content-Type` | String | Yes | Must be `application/json` |

---

## 3. Endpoints Summary

### Class Endpoints
| Method | Endpoint Path | Lambda Function | Description |
|---|---|---|---|
| `POST` | `/classes` | `school_create_class` | Create a new class with optional initial sections |
| `GET` | `/classes` | `school_get_class` | Query paginated directory of classes with search and filters |
| `GET` | `/classes/{id}` | `school_get_class` | Get class profile and nested sections |
| `PUT` | `/classes/{id}` | `school_update_class` | Update class details |
| `PUT` | `/classes/{id}/status` | `school_update_class` | Update class lifecycle status (`Active`, `Inactive`, `Archived`) |
| `DELETE` | `/classes/{id}` | `school_delete_class` | Soft-delete class and all child sections |

### Section Endpoints
| Method | Endpoint Path | Lambda Function | Description |
|---|---|---|---|
| `POST` | `/classes/{id}/sections` | `school_manage_section` | Add a section to an existing class |
| `GET` | `/classes/{id}/sections` | `school_manage_section` | List all sections belonging to a class |
| `GET` | `/sections/{id}` | `school_manage_section` | Get single section details |
| `PUT` | `/sections/{id}` | `school_manage_section` | Update section details |
| `PUT` | `/sections/{id}/status` | `school_manage_section` | Update section status (`Active`, `Inactive`) |
| `DELETE` | `/sections/{id}` | `school_manage_section` | Soft-delete section |

---

## 4. Payloads & Responses

### 4.1 Create Class (`POST /classes`)
```json
{
  "class_name": "Grade 1",
  "description": "Primary education grade 1 standard curriculum.",
  "status": "Active",
  "sections": [
    {
      "section_name": "A",
      "description": "Primary Section A",
      "status": "Active"
    },
    {
      "section_name": "B",
      "description": "Primary Section B",
      "status": "Active"
    }
  ]
}
```

#### Response (`201 Created`):
```json
{
  "success": true,
  "message": "Class created successfully.",
  "timestamp": "2026-08-26T00:30:00.000Z",
  "data": {
    "class_id": 1,
    "org_id": 1001,
    "class_name": "Grade 1",
    "class_code": "CLS-ORG1001-0001",
    "description": "Primary education grade 1 standard curriculum.",
    "status": "Active",
    "is_active": true,
    "created_at": "2026-08-26T00:30:00.000Z",
    "updated_at": "2026-08-26T00:30:00.000Z",
    "sections": [
      {
        "class_section_id": 1,
        "class_id": 1,
        "org_id": 1001,
        "section_name": "A",
        "section_code": "SEC-ORG1001-0001",
        "description": "Primary Section A",
        "status": "Active",
        "is_active": true
      },
      {
        "class_section_id": 2,
        "class_id": 1,
        "org_id": 1001,
        "section_name": "B",
        "section_code": "SEC-ORG1001-0002",
        "description": "Primary Section B",
        "status": "Active",
        "is_active": true
      }
    ],
    "section_count": 2
  }
}
```

---

## 5. Error Codes

| Error Code | HTTP Status | Description |
|---|---|---|
| `ERR_INVALID_ORG` | 400 | Missing or non-positive `org_id` |
| `ERR_CLASS_NAME_REQUIRED` | 400 | Class Name is missing or empty |
| `ERR_DUPLICATE_CLASS_NAME` | 400 | Class with the same name already exists in tenant |
| `ERR_CLASS_NOT_FOUND` | 404 | Class not found for tenant |
| `ERR_SECTION_NAME_REQUIRED` | 400 | Section Name is missing or empty |
| `ERR_DUPLICATE_SECTION_NAME` | 400 | Section with same name already exists in class |
| `ERR_SECTION_NOT_FOUND` | 404 | Section not found for tenant |
