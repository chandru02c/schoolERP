# Admission Module — API Endpoint Specification & Contracts

## 1. Request Headers & Tenant Context

All requests to the Admission API must include tenant context headers or Cognito authorizer claims:

| Header Name | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | Bearer Cognito Access Token |
| `org_id` | Number | Yes | Organization / Tenant ID (e.g. `1001`) |
| `Content-Type` | String | Yes | Must be `application/json` |

---

## 2. API Endpoints Overview

| Method | Endpoint Path | Action | Description |
|---|---|---|---|
| `POST` | `/admission/application` | `CREATE` | Creates a new admission application |
| `PUT` | `/admission/application` | `UPDATE` | Updates an existing admission application |
| `DELETE` | `/admission/application?id={id}` | `DELETE` | Soft-deletes an application (`is_deleted=TRUE`) |
| `PUT` | `/admission/application/status` | `STATUS_UPDATE` | Updates application workflow status |
| `GET` | `/admission/application` | `fn_get_admission()` | Retrieves single record or paginated list |

---

## 3. Sample Requests & Responses (Final Schema Mapped)

### 3.1 Create Application (`POST /admission/application`)

#### Request Payload:
```json
{
  "academic_year": "2026-27",
  "application_date": "2026-07-24",
  "admission_type": "NEW",
  "admission_class": "Class 1",
  "section": "A",
  "student_first_name": "Aarav",
  "student_middle_name": "Kumar",
  "student_last_name": "Sharma",
  "gender": "Male",
  "dob": "2018-05-14",
  "blood_group": "O+",
  "nationality": "Indian",
  "religion": "Hindu",
  "caste": "General",
  "category": "GEN",
  "mother_tongue": "Hindi",
  "aadhaar_no": "987654321012",
  "previous_school": "St. Xaviers Pre-School",
  "previous_class": "UKG",
  "student_photo": "https://s3.ap-south-1.amazonaws.com/erp-photos/1001/aarav.jpg",
  "father_name": "Rajesh Sharma",
  "father_mobile": "9876543210",
  "father_email": "rajesh.sharma@example.com",
  "father_occupation": "Software Engineer",
  "mother_name": "Sunita Sharma",
  "mother_mobile": "9876543299",
  "mother_email": "sunita.sharma@example.com",
  "mother_occupation": "Teacher",
  "guardian_name": null,
  "guardian_mobile": null,
  "relationship": null,
  "address_line1": "123 Park Street",
  "address_line2": "Flat 4B",
  "city": "Mumbai",
  "district": "Mumbai City",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "transport_required": true,
  "hostel_required": false,
  "special_child": false,
  "medical_condition": "None",
  "remarks": "Submitted during annual admission drive.",
  "admission_status": "SUBMITTED",
  "documents": [
    {
      "document_type": "BIRTH_CERTIFICATE",
      "document_name": "aarav_birth_cert.pdf",
      "s3_key": "docs/1001/10001/aarav_birth_cert.pdf"
    }
  ]
}
```

#### Response (HTTP 201 Created):
```json
{
  "success": true,
  "message": "Admission application created successfully.",
  "timestamp": "2026-07-24T09:15:00.000Z",
  "data": {
    "id": 10001,
    "org_id": 1001,
    "application_no": "ORG1001-2026-000001",
    "academic_year": "2026-27",
    "application_date": "2026-07-24",
    "admission_type": "NEW",
    "admission_class": "Class 1",
    "section": "A",
    "student_first_name": "Aarav",
    "student_middle_name": "Kumar",
    "student_last_name": "Sharma",
    "student_full_name": "Aarav Kumar Sharma",
    "gender": "Male",
    "dob": "2018-05-14",
    "blood_group": "O+",
    "nationality": "Indian",
    "religion": "Hindu",
    "caste": "General",
    "category": "GEN",
    "mother_tongue": "Hindi",
    "aadhaar_no": "987654321012",
    "previous_school": "St. Xaviers Pre-School",
    "previous_class": "UKG",
    "student_photo": "https://s3.ap-south-1.amazonaws.com/erp-photos/1001/aarav.jpg",
    "father_name": "Rajesh Sharma",
    "father_mobile": "9876543210",
    "father_email": "rajesh.sharma@example.com",
    "father_occupation": "Software Engineer",
    "mother_name": "Sunita Sharma",
    "mother_mobile": "9876543299",
    "mother_email": "sunita.sharma@example.com",
    "mother_occupation": "Teacher",
    "guardian_name": null,
    "guardian_mobile": null,
    "relationship": null,
    "address_line1": "123 Park Street",
    "address_line2": "Flat 4B",
    "city": "Mumbai",
    "district": "Mumbai City",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "transport_required": true,
    "hostel_required": false,
    "special_child": false,
    "medical_condition": "None",
    "remarks": "Submitted during annual admission drive.",
    "admission_status": "SUBMITTED",
    "is_active": true,
    "is_deleted": false,
    "created_by": 101,
    "updated_by": 101,
    "created_at": "2026-07-24T09:15:00.000Z",
    "updated_at": "2026-07-24T09:15:00.000Z",
    "documents": [
      {
        "id": 90001,
        "org_id": 1001,
        "admission_id": 10001,
        "document_type": "BIRTH_CERTIFICATE",
        "document_name": "aarav_birth_cert.pdf",
        "s3_key": "docs/1001/10001/aarav_birth_cert.pdf",
        "verified": false,
        "verified_by": null,
        "verified_at": null,
        "created_at": "2026-07-24T09:15:00.000Z"
      }
    ],
    "status_history": [
      {
        "id": 50001,
        "org_id": 1001,
        "admission_id": 10001,
        "old_status": null,
        "new_status": "SUBMITTED",
        "remarks": "Application Created: Submitted during annual admission drive.",
        "changed_by": 101,
        "created_at": "2026-07-24T09:15:00.000Z"
      }
    ]
  }
}
```

---

### 3.2 Update Application Status (`PUT /admission/application/status`)

#### Request Payload:
```json
{
  "id": 10001,
  "admission_status": "APPROVED",
  "remarks": "Verification complete. Approved for Grade 1 admission."
}
```

#### Response (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Admission status updated from SUBMITTED to APPROVED.",
  "timestamp": "2026-07-24T09:20:00.000Z",
  "data": {
    "id": 10001,
    "old_status": "SUBMITTED",
    "new_status": "APPROVED",
    "updated_at": "2026-07-24T09:20:00.000Z"
  }
}
```

---

### 3.3 Search & Paginate Applications (`GET /admission/application?page=1&limit=10&status=SUBMITTED&search=Aarav`)

#### Response (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Admission applications list retrieved.",
  "timestamp": "2026-07-24T09:25:00.000Z",
  "meta": {
    "total_records": 1,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  },
  "data": [
    {
      "id": 10001,
      "org_id": 1001,
      "application_no": "ORG1001-2026-000001",
      "academic_year": "2026-27",
      "application_date": "2026-07-24",
      "admission_type": "NEW",
      "admission_class": "Class 1",
      "section": "A",
      "student_first_name": "Aarav",
      "student_last_name": "Sharma",
      "student_full_name": "Aarav Sharma",
      "dob": "2018-05-14",
      "gender": "Male",
      "aadhaar_no": "987654321012",
      "father_name": "Rajesh Sharma",
      "father_mobile": "9876543210",
      "mother_name": "Sunita Sharma",
      "city": "Mumbai",
      "transport_required": true,
      "hostel_required": false,
      "admission_status": "SUBMITTED",
      "is_active": true,
      "created_at": "2026-07-24T09:15:00.000Z"
    }
  ]
}
```

---

## 4. Error Code Matrix

| Error Code | HTTP Status | Description |
|---|---|---|
| `ERR_TENANT_REQUIRED` | 401 | Missing or invalid `x-tenant-id` header |
| `ERR_TENANT_VIOLATION` | 403 | Attempting to access/modify a record belonging to another organization |
| `ERR_RECORD_NOT_FOUND` | 404 | Admission record does not exist or has been soft deleted |
| `ERR_DUPLICATE_AADHAAR` | 400 | Aadhaar number already registered in this tenant organization |
| `ERR_DUPLICATE_APPLICATION` | 400 | Matching student name + DOB + father mobile already exists |
| `ERR_INVALID_STATUS_TRANSITION` | 400 | Prohibited workflow state transition (e.g. APPROVED -> DRAFT) |
| `ERR_VALIDATION_FAILED` | 400 | Missing mandatory parameters or invalid data formats |
| `ERR_INTERNAL_SERVER` | 500 | Unhandled database or system exception |


## api sructor for document uploade for admition and teacher

| `POST` | `/documents/upload-url` | `school_generate_presigned_url` | Add a section to an existing class |
| `POST` | `/documents/save` | `school_save_document` | List all sections belonging to a class |
| `GET` | `/documents/save` | `school_save_document` | Get single section details |


## api sructor for parent module

| `GET` | `/parent ` | `school_get_parent` | Add a section to an existing class |
| `GET` | `/parent /{student_id}` | `school_get_parent` | List all sections belonging to a class |

## api sructor for cognation configeration

| `POST` | `/auth/cognito-validate` | `school_cognito_auth` | Add a section to an existing class |
| `POST` | `/teacher/cognito-link` | `school_cognito_auth` | List all sections belonging to a class |