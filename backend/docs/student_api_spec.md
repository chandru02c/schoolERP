# Student Module — API Specification & Data Contracts

## 1. Overview & Architecture

The **Student Module** manages student enrollment, academic allocations, and lifecycle statuses while preserving `school.admission_application` as the permanent single source of truth for personal, parent, address, and document data.

### Key Architectural Principles:
1. **Zero Data Duplication:** Personal details, parent contacts, addresses, photos, and uploaded certificates are never cloned into `school.student_master`. They are retrieved dynamically via `admission_id`.
2. **One Admission = One Student:** Enforced through database unique constraint `UNIQUE (org_id, admission_id)` and stored procedure validation (`ERR_STUDENT_ALREADY_EXISTS`).
3. **Academic Year Based Import:** Admissions must be imported academic year-wise. Before loading eligible admissions, `academic_year` is required.
4. **Approval Prerequisite:** Student import is restricted exclusively to admissions with `admission_status = 'APPROVED'`.
5. **Strict Multi-Tenancy:** All queries, indexes, procedures, and API handlers enforce `org_id` isolation.

---

## 2. Request Headers & Tenant Context

All requests to the Student API must include tenant context headers:

| Header Name | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | Bearer Cognito Access Token |
| `org_id` | Number | Yes | Organization / Tenant ID (e.g. `1001`) |
| `x-user-id` | Number | No | Authenticated User ID for audit tracking |
| `Content-Type` | String | Yes | Must be `application/json` |

---

## 3. API Endpoints Summary

| Method | Endpoint Path | Lambda Function | Description |
|---|---|---|---|
| `GET` | `/students/import/eligible` | `school_get_student` / `school_import_student` | Fetch approved, non-imported admissions for a mandatory academic year |
| `POST` | `/students/import` | `school_import_student` | Import single or batch approved admissions into Student Master |
| `GET` | `/students` | `school_get_student` | Query paginated student directory with search and academic filters |
| `GET` | `/students/{studentId}` | `school_get_student` | Retrieve complete student profile joined with admission master |
| `PUT` | `/students/{studentId}` | `school_update_student` | Update student academic mapping (roll no, class, section, EMIS) |
| `PUT` | `/students/{studentId}/status` | `school_update_student` | Update student lifecycle status (`Active`, `Inactive`, `Alumni`, etc.) |
| `DELETE` | `/students/{studentId}` | `school_delete_student` | Soft-delete student record |

---

## 4. Endpoint Specifications

### 4.1 Query Eligible Admissions for Import (`GET /students/import/eligible`)

Returns approved admissions that belong to the specified Academic Year, belong to the authenticated organization, and have **not** already been converted into a student master record.

#### Query Parameters:
- `academic_year` (or `academicYearId`): **Mandatory** (e.g. `2026-27`). If missing, returns `400 Bad Request` (`ERR_ACADEMIC_YEAR_REQUIRED`).
- `search`: Optional search query across applicant name, application number, mobile, father name.
- `class_id`: Optional filter by applied class.
- `page`: Page number (default: 1).
- `limit`: Limit per page (default: 50).

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Eligible approved admissions retrieved successfully.",
  "academic_year": "2026-27",
  "timestamp": "2026-08-24T23:00:00.000Z",
  "data": [
    {
      "id": 105,
      "org_id": 1001,
      "application_no": "ORG1001-2026-000105",
      "academic_year": "2026-27",
      "admission_date": "2026-04-10",
      "admission_type": "NEW",
      "admission_class": "Class 1",
      "section": "A",
      "admission_status": "APPROVED",
      "student_first_name": "Aarav",
      "student_middle_name": "Kumar",
      "student_last_name": "Sharma",
      "student_full_name": "Aarav Kumar Sharma",
      "gender": "Male",
      "dob": "2018-05-14",
      "father_name": "Rajesh Sharma",
      "father_mobile": "9876543210"
    }
  ],
  "pagination": {
    "total_records": 1,
    "page": 1,
    "limit": 50,
    "total_pages": 1
  }
}
```

---

### 4.2 Import Student (`POST /students/import`)

Imports approved admission applications into `school.student_master`, automatically generating sequential `student_code` (`STU-ORG1001-000001`) and `registration_no` (`REG-ORG1001-2026-000001`).

#### Single Import Payload:
```json
{
  "org_id": 1001,
  "admission_id": 105,
  "class_id": "Class 1",
  "section_id": "A",
  "roll_no": "101",
  "academic_year": "2026-27"
}
```

#### Batch Import Payload:
```json
{
  "org_id": 1001,
  "admission_ids": [105, 106, 107]
}
```

#### Batch Success Response (`201 Created`):
```json
{
  "success": true,
  "message": "3 student(s) imported successfully.",
  "timestamp": "2026-08-24T23:00:00.000Z",
  "data": {
    "total_requested": 3,
    "total_success": 3,
    "total_failed": 0,
    "duplicates_skipped": 0,
    "imported_students": [ ... ],
    "failures": []
  }
}
```

---

### 4.3 Query Students Directory (`GET /students`)

Supports multi-field keyword searching, departmental/academic filters, column sorting, and pagination.

---

### 4.4 Get Student Profile (`GET /students/{studentId}`)

Returns the full, denormalized student profile dynamically joined with all 53 columns and documents of the admission master.

---

### 4.5 Update Student Academic Info (`PUT /students/{studentId}`)

Updates student academic mapping (`class_id`, `section_id`, `roll_no`, `emis_no`, `academic_year`, `student_status`).

---

### 4.6 Update Student Status (`PUT /students/{studentId}/status`)

Updates student lifecycle status (`Active`, `Inactive`, `Alumni`, `Suspended`, `Transferred`, `Withdrawn`).

---

### 4.7 Soft Delete Student (`DELETE /students/{studentId}`)

Soft-deletes student record by setting `is_deleted = TRUE`.

---

## 5. Error Codes & Validation Matrix

| Error Code | HTTP Status | Trigger Condition |
|---|---|---|
| `ERR_INVALID_ORG` | 400 | `org_id` header missing or non-positive |
| `ERR_ACADEMIC_YEAR_REQUIRED` | 400 | Academic Year was not provided for eligible admissions import query |
| `ERR_MISSING_ADMISSION_ID` | 400 | `admission_id` not provided in import request |
| `ERR_ADMISSION_NOT_FOUND` | 400 | Admission application ID does not exist in tenant |
| `ERR_ADMISSION_NOT_APPROVED` | 400 | Admission `admission_status` is not `APPROVED` |
| `ERR_STUDENT_ALREADY_EXISTS` | 400 | Admission has already been imported as a student record |
| `ERR_STUDENT_NOT_FOUND` | 404 | `student_id` not found for tenant |
| `ERR_DUPLICATE_ROLL_NO` | 400 | Roll number already taken in class/section/year |
| `ERR_INTERNAL_DB` | 500 | Database exception / constraint violation |
