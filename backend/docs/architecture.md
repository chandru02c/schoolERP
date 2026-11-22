# Multi-Tenant SaaS School ERP System — Admission Module Architecture

## 1. Executive Summary
This document defines the synchronized architecture for the **Admission Module** of the Multi-Tenant SaaS School ERP System, updated to align with the final database table schemas (`school.admission_application`, `school.admission_document`, `school.admission_status_history`).

---

## 2. Multi-Tenant Architectural Blueprint

### 2.1 Tenant Isolation Strategy
- **Row-Level Tenant Isolation**: Every functional table in the database schema (`school`) contains `org_id BIGINT NOT NULL`.
- **Query Mandatory Guard**: Every SQL query, view, function, and stored procedure strictly enforces `WHERE org_id = p_org_id` and checks `is_deleted = FALSE`.
- **Session Context Guard**: Dynamic `SET LOCAL app.current_org_id = $1` is executed prior to transaction execution in PostgreSQL.
- **Cross-Tenant Access Prevention**: `fn_validate_admission` checks record ownership before allowing `UPDATE`, `DELETE`, or `STATUS_UPDATE`. Cross-tenant attempts trigger `ERR_TENANT_VIOLATION`.

---

## 3. Database Layer (`school` Schema)

### 3.1 Schema Objects Overview
All objects reside inside the `school` schema:
- **`school.fn_generate_application_no(p_org_id, p_academic_year)`**: Generates sequential, tenant-scoped application numbers formatted as `ORG1001-2026-000001`.
- **`school.fn_validate_admission(p_action, p_org_id, p_data, p_id)`**: Validates mandatory parameters, tenant ownership, status transitions, and duplicate father_mobile/Aadhaar entries.
- **`school.fn_get_admission(p_org_id, p_id, p_search, p_status, p_class, p_academic_year, p_city, p_page, p_limit, p_sort_by, p_sort_order)`**: Retrives single application details with all 53 columns or paginated, searched, filtered lists with total counts.
- **`school.sp_save_admission(p_action, p_id, p_org_id, p_data, p_user_id, OUT p_response)`**: Unified transaction procedure handling `CREATE`, `UPDATE`, `DELETE`, and `STATUS_UPDATE`.
- **`school.vw_admission_details`**: Denormalized view with all 53 application fields, document verification counts, and latest status audit details.
- **`school.trg_update_timestamp`**: Automatic trigger setting `updated_at = CURRENT_TIMESTAMP` on UPDATE.
- **`school.trg_admission_audit`**: Audit trigger creating immutable entries in `school.admission_status_history`.

---

## 4. AWS Serverless Lambda Layer

### 4.1 Responsibility Separation
```
+-----------------------------------------------------------------------+
|                         AWS API Gateway                               |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|  AWS Lambda: backend/lambda/admission                                 |
|  - Request parsing & header extraction (x-tenant-id, x-user-id)       |
|  - Schema sanity validation (validation.js)                            |
|  - Delegates logic to PostgreSQL stored procedures & functions       |
|  - Formats standard API responses (response.js)                        |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|  PostgreSQL Database: school schema                                   |
|  - fn_validate_admission()  -> Business Rules & Duplication Guard   |
|  - fn_generate_application_no() -> Atomic Application Numbering     |
|  - sp_save_admission() -> ACID Transaction Procedure (53 Columns)     |
|  - fn_get_admission()  -> Filtered & Paginated Retrieval            |
+-----------------------------------------------------------------------+
```

---

## 5. Deployment Order

To deploy the backend from scratch, apply database files in the following exact order:
1. `backend/database/functions/fn_generate_application_no.sql`
2. `backend/database/functions/fn_validate_admission.sql`
3. `backend/database/functions/fn_get_admission.sql`
4. `backend/database/procedures/sp_save_admission.sql`
5. `backend/database/views/vw_admission_details.sql`
6. `backend/database/triggers/trg_update_timestamp.sql`
7. `backend/database/triggers/trg_admission_audit.sql`
8. `backend/database/indexes/admission_indexes.sql`
9. `backend/database/seed/admission_seed.sql`


## teacher 

AWS Lambda Functions (backend/lambda/ - Node.js 22.x ES Modules)
school_create_teacher
: Handles POST /teacher -> sp_save_teacher('CREATE').
school_update_teacher
: Handles PUT /teacher and PUT /teacher/status -> sp_save_teacher('UPDATE' | 'STATUS_UPDATE').
school_delete_teacher
: Handles DELETE /teacher/{id} -> sp_save_teacher('DELETE').
school_get_teacher
: Handles GET /teacher & GET /teacher/{id} -> fn_get_teacher.

## student 

. AWS Lambda Functions (backend/lambda/ - Node.js 22.x ES Modules)
school_import_student
: Handles POST /students/import for single and batch imports from approved admissions.
school_get_student
: Handles GET /students (paginated list with search and filters) & GET /students/{studentId} (complete profile).
school_update_student
: Handles PUT /students/{studentId} and PUT /students/{studentId}/status.
school_delete_student
: Handles DELETE /students/{studentId} (soft-delete).
