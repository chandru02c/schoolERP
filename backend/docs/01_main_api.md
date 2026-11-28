## 1. admission API Endpoints
| `POST` | `/admission/application` | `school_create_admission` | Creates a new admission application |
| `PUT` | `/admission/application` | `school_update_admission` | Updates an existing admission application |
| `DELETE` | `/admission/application?id={id}` | `school_delete_admission` | Soft-deletes an application (`is_deleted=TRUE`) |
| `PUT` | `/admission/application/status` | `school_update_admission` | Updates application workflow status |
| `GET` | `/admission/application` | `school_get_admission` | Retrieves single record or paginated list |
| `GET` | `/admission/application/{id}` | `school_get_admission` | Retrieves single record or paginated list |

---------------------------------------------------------------------------------------------------------------------------

## 2. api sructor for document uploade for admition and teacher
| `POST` | `/documents/upload-url` | `school_generate_presigned_url` | Add a section to an existing class |
| `POST` | `/documents/save` | `school_save_document` | List all sections belonging to a class |
| `GET` | `/documents/save` | `school_save_document` | Get single section details |

---------------------------------------------------------------------------------------------------------------------------

## parent api sructor for parent module
| `GET` | `/parent` | `school_get_parent` | Add a section to an existing class |
| `GET` | `/parent/{student_id}` | `school_get_parent` | List all sections belonging to a class |

---------------------------------------------------------------------------------------------------------------------------

## api sructor for cognation configeration
| `POST` | `/auth/cognito-validate` | `school_cognito_auth` | Add a section to an existing class |
| `POST` | `/teacher/cognito-link` | `school_cognito_auth` | List all sections belonging to a class |

---------------------------------------------------------------------------------------------------------------------------

## calss api Endpoints
### Class Endpoints
| `POST` | `/classes` | `school_create_class` | Create a new class with optional initial sections |
| `GET` | `/classes` | `school_get_class` | Query paginated directory of classes with search and filters |
| `GET` | `/classes/{id}` | `school_get_class` | Get class profile and nested sections |
| `PUT` | `/classes/{id}` | `school_update_class` | Update class details |
| `PUT` | `/classes/{id}/status` | `school_update_class` | Update class lifecycle status (`Active`, `Inactive`, `Archived`) |
| `DELETE` | `/classes/{id}` | `school_delete_class` | Soft-delete class and all child sections |

### Section Endpoints
| `POST` | `/classes/{id}/sections` | `school_manage_section` | Add a section to an existing class |
| `GET` | `/classes/{id}/sections` | `school_manage_section` | List all sections belonging to a class |
| `GET` | `/sections/{id}` | `school_manage_section` | Get single section details |
| `PUT` | `/sections/{id}` | `school_manage_section` | Update section details |
| `PUT` | `/sections/{id}/status` | `school_manage_section` | Update section status (`Active`, `Inactive`) |
| `DELETE` | `/sections/{id}` | `school_manage_section` | Soft-delete section |

---------------------------------------------------------------------------------------------------------------------------

## event API Endpoints
| `POST` | `/events` | `school_create_event` | Create a new event with attachments |
| `PUT` | `/events/{eventId}` | `school_update_event` | Update an existing event & sync media |
| `GET` | `/events` | `school_list_events` | Paginated, filtered, searchable event list |
| `GET` | `/events/{eventId}` | `school_get_event` | Get full event details with media items |
| `DELETE` | `/events/{eventId}` | `school_delete_event` | Soft-delete an event (`is_deleted=TRUE`) |
| `GET` | `/events/dashboard/latest` | `school_dashboard_events` | Get latest 2 published upcoming events |
| `POST` | `/events/upload-url` | `school_generate_event_media_upload_url` | Generate S3 Pre-Signed upload URL |

---------------------------------------------------------------------------------------------------------------------------

## student API Endpoints
| `GET` | `/students/import/eligible` | `school_get_student` / `school_import_student` | Fetch approved, non-imported admissions for a mandatory academic year |
| `POST` | `/students/import` | `school_import_student` | Import single or batch approved admissions into Student Master |
| `GET` | `/students` | `school_get_student` | Query paginated student directory with search and academic filters |
| `GET` | `/students/{studentId}` | `school_get_student` | Retrieve complete student profile joined with admission master |
| `PUT` | `/students/{studentId}` | `school_update_student` | Update student academic mapping (roll no, class, section, EMIS) |
| `PUT` | `/students/{studentId}/status` | `school_update_student` | Update student lifecycle status (`Active`, `Inactive`, `Alumni`, etc.) |
| `DELETE` | `/students/{studentId}` | `school_delete_student` | Soft-delete student record |

---------------------------------------------------------------------------------------------------------------------------

## teacher endpoint api's
| `POST` | `/teacher` | `school_create_teacher` | Create teacher |
| `PUT` | `/teacher` | `school_update_teacher` | Update teacher details |
| `PUT` | `/teacher/status` | `school_update_teacher` | Update teacher status |
| `DELETE` | `/teacher/{id}` | `school_delete_teacher` | Soft-delete teacher |
| `GET` | `/teacher` | `school_get_teacher` | Get all teachers |
| `GET` | `/teacher/{id}` | `school_get_teacher` | Get teacher by ID |

--------------------------------------------------------------------------------------------------------------------------

## teacher leave
| `GET` | `/teacher/leave` | `school_get_teacher_leave` | Get teacher leave history and leave balance |
| `POST` | `/teacher/leave` | `school_save_teacher_leave` | Apply a new leave request |
| `POST` | `/teacher/leave` | `school_save_teacher_leave` | Update an existing pending leave request |
| `POST` | `/teacher/leave` | `school_save_teacher_leave` | Cancel a leave request |
| `POST` | `/teacher/leave` | `school_save_teacher_leave` | Approve a leave request (Admin) |
| `POST` | `/teacher/leave` | `school_save_teacher_leave` | Reject a leave request (Admin) |

--------------------------------------------------------------------------------------------------------------------------

## Attendance
| `GET` | `/attendance/daily-sheet` | `school_get_attendance` | Get daily attendance sheet |
| `GET` | `/attendance/history` | `school_get_attendance` | Get attendance history |
| `GET` | `/attendance/class-report` | `school_get_attendance` | Get class attendance report |
| `GET` | `/attendance/student-report` | `school_get_attendance` | Get student attendance report |
| `GET` | `/attendance/summary` | `school_get_attendance` | Get attendance summary |
| `GET` | `/attendance/dashboard-metrics` | `school_get_attendance` | Get attendance dashboard metrics |
| `POST` | `/attendance/manage` | `school_manage_attendance` | Save daily attendance |
| `POST` | `/attendance/manage` | `school_manage_attendance` | Submit daily attendance |
| `POST` | `/holiday/manage` | `school_manage_attendance` | Create holiday |
| `PUT` | `/holiday/manage` | `school_manage_attendance` | Update holiday |
| `DELETE` | `/holiday/manage` | `school_manage_attendance` | Delete holiday |
| `GET` | `/attendance/holiday-list` | `school_get_attendance` | Get holiday list |

---------------------------------------------------------------------------------------------------------------------------

## admin/teacher Dashbord
| `GET` | `/admin/dashboard`   | `school_get_admin_dashboard`   | Get admin dashboard summary and statistics |
| `POST` | `/admin/dashboard`  | `school_get_admin_dashboard`   | Get admin dashboard summary and statistics |
request Headers (teacher_id)| `GET` | `/teacher/dashboard` | `school_get_teacher_dashboard` | Get teacher dashboard summary and statistics |
request Headers (teacher_id)| `POST` | `/teacher/dashboard` | `school_get_teacher_dashboard` | Get teacher dashboard summary and statistics |

----------------------------------------------------------------------------------------------------------------------------

## Mobile Authentication API (school_mobile_user)

Single unified Lambda handling all mobile login and logout operations for both Teacher and Parent users.
All user validation, role detection, organization details retrieval, and teacher/student mappings are fully encapsulated inside two PostgreSQL functions: `school.fn_mobile_user_login` and `school.fn_mobile_user_logout`.

| Method | Endpoint | Lambda Function | DB Function / Procedure | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/mobile-auth/login` | `school_mobile_user` | `school.fn_mobile_user_login` | **Primary Unified Mobile Login** for both Teacher and Parent users. Frontend sends **only** `email_or_phone` and `password`. The backend auto-detects `org_id` and role from `mobile_user_credentials`, fetches complete organization and teacher/student profile details, and returns a unified response. |
| `POST` | `/mobile-auth/logout` | `school_mobile_user` | `school.fn_mobile_user_logout` | **Primary Unified Mobile Logout** for both Teacher and Parent users. Validates tenant and user, updates audit timestamp. |
| `POST` | `/mobile/auth/login` | `school_mobile_user` | `school.fn_mobile_user_login` | [Alias] Alternative endpoint path for unified mobile login. |
| `POST` | `/mobile/auth/logout` | `school_mobile_user` | `school.fn_mobile_user_logout` | [Alias] Alternative endpoint path for unified mobile logout. |
| `POST` | `/mobile/auth/teacher-login` | `school_mobile_user` | `school.fn_mobile_user_login` | [Legacy Alias] Legacy Teacher login route mapped directly to unified login flow. |
| `POST` | `/mobile/auth/parent-login` | `school_mobile_user` | `school.fn_mobile_user_login` | [Legacy Alias] Legacy Parent login route mapped directly to unified login flow. |

### Request & Response Specifications (school_mobile_user)

#### 1. Login (`POST /mobile-auth/login`)
- **Headers:** `Content-Type: application/json`
- **Request Body (Only 2 inputs required from mobile client):**
```json
{
  "email_or_phone": "teacher@school.edu",
  "password": "Password123!"
}
```
- **Database Logic (`school.fn_mobile_user_login`):**
  1. Searches `school.mobile_user_credentials` by Email OR Phone number.
  2. Resolves `org_id` and role (`TEACHER` or `PARENT`) directly from the matching credential.
  3. Validates `org_id` exists, is `ACTIVE`, and not deleted in `school.organization`.
  4. Verifies account status is `ACTIVE`.
  5. Verifies password natively via `pgcrypto` `crypt()` against stored bcrypt hash.
  6. Fetches complete organization details (`organization_name`, `org_code`, `logo_url`, address, contact info).
  7. If **Teacher**: fetches full teacher profile details (`teacher_details`, `teacher_employment`, profile photo).
  8. If **Parent**: resolves full student details for parent's `mapped_student_ids` (`student_master`, classes, sections).
  9. Fetches active academic year and updates login audit timestamp.
- **Success Response (Teacher - HTTP 200):**
```json
{
  "success": true,
  "message": "Teacher login successful.",
  "data": {
    "user_type": "TEACHER",
    "role": "TEACHER",
    "user_id": 105,
    "teacher_id": 105,
    "org_id": 1,
    "organization": {
      "org_id": 1,
      "org_code": "SCH-001",
      "organization_name": "St. Ann's School, Mysore",
      "logo_url": "https://.../logo.png",
      "city": "Mysore",
      "state": "Karnataka",
      "email": "info@stannsschool.edu",
      "phone_number": "+919876543210"
    },
    "organization_name": "St. Ann's School, Mysore",
    "org_code": "SCH-001",
    "teacher": {
      "teacher_id": 105,
      "teacher_code": "TCH-0105",
      "full_name": "Sarah Jenkins",
      "designation": "Senior Faculty",
      "department": "Mathematics",
      "phone": "+919876543210",
      "email": "teacher@school.edu",
      "profile_photo": "https://.../photo.jpg"
    },
    "full_name": "Sarah Jenkins",
    "email": "teacher@school.edu",
    "phone_number": "+919876543210",
    "academic_year_id": 3,
    "academic_year_name": "2026-2027",
    "has_active_academic_year": true
  }
}
```

- **Success Response (Parent - HTTP 200):**
```json
{
  "success": true,
  "message": "Parent login successful.",
  "data": {
    "user_type": "PARENT",
    "role": "PARENT",
    "user_id": 201,
    "parent_id": 201,
    "org_id": 1,
    "parent_name": "Robert Miller",
    "full_name": "Robert Miller",
    "email": "parent@school.edu",
    "phone_number": "+919876543211",
    "organization": {
      "org_id": 1,
      "org_code": "SCH-001",
      "organization_name": "St. Ann's School, Mysore",
      "logo_url": "https://.../logo.png",
      "city": "Mysore",
      "state": "Karnataka",
      "email": "info@stannsschool.edu",
      "phone_number": "+919876543210"
    },
    "organization_name": "St. Ann's School, Mysore",
    "org_code": "SCH-001",
    "mapped_student_ids": [1001, 1002],
    "students": [
      {
        "student_id": 1001,
        "student_code": "STU-1001",
        "student_name": "Alice Miller",
        "class_id": 5,
        "class_name": "Grade 5",
        "section_id": 2,
        "section_name": "A",
        "admission_number": "ADM-2026-001",
        "roll_number": "12",
        "gender": "Female",
        "avatar": "https://.../alice.png"
      }
    ],
    "activeStudent": {
      "student_id": 1001,
      "student_code": "STU-1001",
      "student_name": "Alice Miller",
      "class_id": 5,
      "class_name": "Grade 5",
      "section_id": 2,
      "section_name": "A",
      "admission_number": "ADM-2026-001",
      "roll_number": "12"
    },
    "academic_year_id": 3,
    "academic_year_name": "2026-2027",
    "has_active_academic_year": true
  }
}
```

#### 2. Logout (`POST /mobile-auth/logout`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Mandatory)
- **Request Body:**
```json
{
  "org_id": 1,
  "user_id": 105
}
```
- **Database Logic (`school.fn_mobile_user_logout`):**
  1. Validates `org_id` exists and is active.
  2. Verifies `user_id` belongs to specified `org_id` in `school.mobile_user_credentials`.
  3. Updates session termination / logout audit timestamp.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "User logged out successfully.",
  "data": {
    "org_id": 1,
    "user_id": 105,
    "logged_out_at": "2026-11-14T10:15:00.000Z"
  }
}
```
---------------------------------------------------------------------------------------------------------------------------
## Mobile User Management (Web Admin)
| Method | Endpoint | Lambda Function | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/mobile-user/create` | `school_create_mobile_user` | Create Teacher or Parent mobile user credential |
| `GET` | `/mobile-user/list` | `school_get_mobile_users` | List all mobile users (Admin directory with filters) |
| `PUT` | `/mobile-user/reset-password` | `school_get_mobile_users` | Reset mobile user password (Admin) |
| `PUT` | `/mobile-user/update` | `school_get_mobile_users` | Update mobile user details, status, email, phone, mappings |
---------------------------------------------------------------------------------------------------------------------------
## School Calendar
| `GET` | `/mobile-user/calendar` | `school_calendar` | Fetch school calendar events, holidays, examinations, and academic schedules based on `org_id` and active `academy_id` |
| `GET` | `/calendar` | `school_calendar` | Retrieve merged school calendar data for active academic year |
---------------------------------------------------------------------------------------------------------------------------
## Cognito Authentication & User Linking
| `POST` | `/auth/cognito-validate` | `school_cognito_auth` | Validate post-Cognito authentication identity and role against teacher master via JWT claims/email |
| `POST` | `/teacher/cognito-link` | `school_cognito_auth` | Link Cognito User ID (`sub`) and authenticated email to teacher master profile |
---------------------------------------------------------------------------------------------------------------------------
## Common Profile (Teacher & Parent)
| `GET` | `/mobile-user/profile` | `school_common_profile` | Retrieve complete profile details for Teacher or Parent based on `org_id`, `user_type` (`teacher`/`parent`), and `user_id` |
| `POST` | `/mobile-user/profile` | `school_common_profile` | Retrieve complete profile details for Teacher or Parent using JSON body (`org_id`, `user_type`, `user_id`) |
---------------------------------------------------------------------------------------------------------------------------
## Teacher Academy Integration
| `GET` | `/mobile-user/academy` | `school_teacher_academy` | Identify active academy for organization and fetch teacher's assigned academy mappings and subjects |
| `GET` | `/teacher/academy` | `school_teacher_academy` | Get active academic year details and assigned class sets for teacher |
---------------------------------------------------------------------------------------------------------------------------
## Teacher Assigned Classes
| `GET` | `/mobile-user/teacher-classes` | `school_teacher_classes` | Get all assigned classes and sections for logged-in teacher based on active academy |
| `GET` | `/teacher/classes` | `school_teacher_classes` | Query assigned class roster and section list for teacher |
---------------------------------------------------------------------------------------------------------------------------
## Teacher Timetable & Today's Schedule
| `GET` | `/teacher/timetable` | `school_teacher_timetable` | Retrieve weekly timetable periods based on `org_id`, `academy_id`, `teacher_id`, and `class_id` |
| `GET` | `/mobile-user/teacher-timetable` | `school_teacher_timetable` | Fetch teacher timetable dynamically filtered by selected day and class |
| `GET` | `/mobile-user/today-schedule` | `school_teacher_timetable` | Retrieve today's schedule entries (subject, time, class, period) for teacher dashboard |

---------------------------------------------------------------------------------------------------------------------------
## Notification Module API (school_manage_notification)

Unified multi-tenant Notification & Push Notification management for Mobile (React Native Expo / FCM) and Web Admin/Teacher portals.
Backed by `school.notification_master`, `school.device_tokens`, and stored procedure `school.sp_manage_notification`.

| Method | Endpoint | Lambda Function | DB Procedure / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/notifications/device-token` | `school_manage_notification` | `school.sp_manage_notification('REGISTER_DEVICE_TOKEN')` | Register or update device FCM push token for logged-in user (Teacher, Parent, Admin). |
| `GET` | `/notifications` | `school_manage_notification` | `school.sp_manage_notification('GET_NOTIFICATIONS')` | Get notification history for user with unread count and `since_timestamp` delta filter. |
| `POST` | `/notifications/read` | `school_manage_notification` | `school.sp_manage_notification('MARK_READ')` | Mark a single notification as read. |
| `POST` | `/notifications/read-all` | `school_manage_notification` | `school.sp_manage_notification('MARK_ALL_READ')` | Mark all notifications as read for current user in tenant. |
| `POST` | `/notifications/send` | `school_manage_notification` | `school.sp_manage_notification('SEND_NOTIFICATION')` | Internal / Admin dispatch: stores notification in database first, then triggers FCM push notification. |

---

### Request & Response Specifications (school_manage_notification)

#### 1. Register / Update Device Token (`POST /notifications/device-token`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Strictly `org_id` only; matching attendance/academic APIs)
- **Request Body:**
```json
{
  "org_id": 1,
  "user_id": 201,
  "role_type": "PARENT",
  "fcm_token": "fX9aB1...device_push_token...",
  "device_type": "ANDROID",
  "device_model": "Samsung Galaxy S23",
  "app_version": "1.0.0"
}
```
- **Database Logic (`school.sp_manage_notification` - `REGISTER_DEVICE_TOKEN`):**
  1. Validates `org_id`, `user_id`, and `fcm_token`.
  2. Upserts into `school.device_tokens` table.
  3. Sets `token_status = 'ACTIVE'` and updates `updated_on` and `last_used_at`.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Device token registered successfully.",
  "timestamp": "2026-11-28T02:00:00.000Z"
}
```

---

#### 2. Get Notifications (`GET /notifications`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Strictly `org_id` only; matching attendance/academic APIs)
- **Query Parameters:**
  - `org_id` (Mandatory, number): Tenant Organization ID
  - `user_id` (Mandatory, number): User ID (Teacher ID, Parent Credential ID, etc.)
  - `since_timestamp` (Optional, ISO string): For delta refresh — returns only notifications created after this timestamp
  - `limit` (Optional, default 50): Maximum number of records to return
- **Database Logic (`school.sp_manage_notification` - `GET_NOTIFICATIONS`):**
  1. Filters by `org_id` and `user_id`.
  2. Queries total unread count (`is_read = FALSE`).
  3. If `since_timestamp` is provided, fetches only new notifications where `created_on > since_timestamp`.
  4. Returns records ordered by `created_on DESC`.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully.",
  "data": {
    "notifications": [
      {
        "notification_id": 1042,
        "org_id": 1,
        "user_id": 201,
        "role_type": "PARENT",
        "title": "Attendance Alert: Alice Miller Absent",
        "message": "Dear Parent, Alice Miller (Class 5 A) was marked Absent on 2026-11-28 for Morning session.",
        "notification_type": "STUDENT_ABSENT",
        "reference_id": "1001",
        "is_read": false,
        "created_on": "2026-11-28T09:15:00.000Z",
        "created_by": 105,
        "metadata": {
          "student_id": 1001,
          "student_name": "Alice Miller",
          "class_name": "Class 5",
          "session": "MORNING",
          "attendance_date": "2026-11-28",
          "screen": "ParentAttendance"
        }
      },
      {
        "notification_id": 1039,
        "org_id": 1,
        "user_id": 201,
        "role_type": "PARENT",
        "title": "Marks Published: Mid-Term Examination (Mathematics)",
        "message": "Marks summary for Alice Miller in Mathematics: Scored: 88/100 (Grade: A).",
        "notification_type": "MARKS_ENTRY",
        "reference_id": "45",
        "is_read": true,
        "created_on": "2026-11-27T16:30:00.000Z",
        "created_by": 105,
        "metadata": {
          "exam_id": 45,
          "student_id": 1001,
          "scored_marks": 88,
          "max_marks": 100,
          "grade": "A",
          "screen": "ParentMarks"
        }
      }
    ],
    "unread_count": 1,
    "total_fetched": 2,
    "latest_timestamp": "2026-11-28T09:15:00.000Z"
  },
  "timestamp": "2026-11-28T10:00:00.000Z"
}
```

---

#### 3. Mark Notification as Read (`POST /notifications/read`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Strictly `org_id` only; matching attendance/academic APIs)
- **Request Body:**
```json
{
  "org_id": 1,
  "user_id": 201,
  "notification_id": 1042
}
```
- **Database Logic (`school.sp_manage_notification` - `MARK_READ`):**
  1. Validates `org_id`, `user_id`, and `notification_id`.
  2. Updates `school.notification_master SET is_read = TRUE WHERE org_id = $1 AND user_id = $2 AND notification_id = $3`.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Notification marked as read.",
  "data": {
    "notification_id": 1042
  },
  "timestamp": "2026-11-28T10:05:00.000Z"
}
```

---

#### 4. Mark All Notifications as Read (`POST /notifications/read-all`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Strictly `org_id` only; matching attendance/academic APIs)
- **Request Body:**
```json
{
  "org_id": 1,
  "user_id": 201
}
```
- **Database Logic (`school.sp_manage_notification` - `MARK_ALL_READ`):**
  1. Validates `org_id` and `user_id`.
  2. Updates `school.notification_master SET is_read = TRUE WHERE org_id = $1 AND user_id = $2 AND is_read = FALSE`.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "All notifications marked as read.",
  "timestamp": "2026-11-28T10:06:00.000Z"
}
```

---

#### 5. Send Notification (Admin / Internal Service Dispatch) (`POST /notifications/send`)
- **Headers:** `Content-Type: application/json`, `org_id: <number>` (Strictly `org_id` only; matching attendance/academic APIs)
- **Request Body:**
```json
{
  "org_id": 1,
  "user_id": 201,
  "role_type": "PARENT",
  "title": "Annual Sports Day Notice",
  "message": "Annual Sports Day is scheduled on Saturday. Parents and students are welcome.",
  "notification_type": "EVENT",
  "reference_id": "12",
  "metadata": {
    "event_id": 12,
    "screen": "ParentCalendar"
  }
}
```
- **Database & Push Notification Logic:**
  1. Inserts notification into `school.notification_master` table.
  2. Queries active device tokens for recipient from `school.device_tokens`.
  3. Sends FCM push notification to registered devices.
  4. Automatically marks expired or unregistered tokens as `EXPIRED` in `school.device_tokens`.
- **Success Response (HTTP 200):**
```json
{
  "success": true,
  "message": "Notification stored and push dispatched.",
  "data": {
    "notification": {
      "notification_id": 1043,
      "created_on": "2026-11-28T10:10:00.000Z"
    },
    "push": {
      "success": true,
      "sent": 1,
      "invalidCount": 0
    }
  },
  "timestamp": "2026-11-28T10:10:00.000Z"
}
```

---

### Automated Notification Triggers & Event Handlers

| Trigger Scenario | Originating Lambda | Action / Condition | Target Role & Recipient | Notification Type |
| :--- | :--- | :--- | :--- | :--- |
| **Student Absent** | `school_manage_attendance` | Teacher marks student `ABSENT` during `SAVE_ATTENDANCE` | All linked parents (resolved via `mobile_user_credentials.mapped_student_ids` and `parent_student_mapping`) | `STUDENT_ABSENT` |
| **Teacher Leave Approved** | `school_save_teacher_leave` | Admin approves leave request (`APPROVE`) | Applicant Teacher (`teacher_id`) | `TEACHER_LEAVE_APPROVED` |
| **Teacher Leave Rejected** | `school_save_teacher_leave` | Admin rejects leave request (`REJECT`) with admin remark | Applicant Teacher (`teacher_id`) | `TEACHER_LEAVE_REJECTED` |
| **Marks Entry / Published** | `school_manage_academic` | Marks entered or published (`SAVE_STUDENT_MARKS`, `PUBLISH_EXAM_MARKS`) | All linked parents of each evaluated student (includes subject, exam, scored marks, max marks, grade) | `MARKS_ENTRY` |
