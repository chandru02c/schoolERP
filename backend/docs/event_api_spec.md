# Event Module — API Specification & Architecture Contracts

## 1. Request Headers & Multi-Tenancy

Every API request requires:
- `Authorization`: `Bearer <Cognito_Access_Token>`
- `org_id`: Tenant ID (e.g. `1001`)
- `Content-Type`: `application/json`

---

## 2. API Endpoints Overview

| Method | Endpoint Path | Description | Lambda Function |
|---|---|---|---|
| `POST` | `/events` | Create a new event with attachments | `school_create_event` |
| `PUT` | `/events/{eventId}` | Update an existing event & sync media | `school_update_event` |
| `GET` | `/events` | Paginated, filtered, searchable event list | `school_list_events` |
| `GET` | `/events/{eventId}` | Get full event details with media items | `school_get_event` |
| `DELETE` | `/events/{eventId}` | Soft-delete an event (`is_deleted=TRUE`) | `school_delete_event` |
| `GET` | `/events/dashboard/latest` | Get latest 2 published upcoming events | `school_dashboard_events` |
| `POST` | `/events/upload-url` | Generate S3 Pre-Signed upload URL | `school_generate_event_media_upload_url` |

---

## 3. Pre-Signed URL Contract

### `POST /events/upload-url`
#### Request Payload:
```json
{
  "org_id": "1001",
  "event_id": "EVT000001",
  "file_name": "banner.jpg",
  "content_type": "image/jpeg"
}
```

#### Response (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Presigned upload URL generated successfully.",
  "timestamp": "2026-08-27T10:00:00.000Z",
  "data": {
    "uploadUrl": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg?X-Amz-Algorithm=...",
    "bucket": "school-erp-documents-prod",
    "s3Key": "school-data/1001/school-event/EVT000001/banner.jpg",
    "fileUrl": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg",
    "expiresInSeconds": 300
  }
}
```

---

## 4. Event Creation Contract

### `POST /events`
#### Request Payload:
```json
{
  "event_title": "Annual Science Fair 2026",
  "event_short_description": "Science models and robotics exhibitions.",
  "event_description": "Comprehensive full description for students and parents.",
  "event_type": "SCHOOL_EVENT",
  "event_status": "UPCOMING",
  "publish_status": "PUBLISHED",
  "event_start_date": "2026-10-10T09:00:00.000Z",
  "event_end_date": "2026-10-10T16:00:00.000Z",
  "thumbnail_image_url": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg",
  "contents": [
    {
      "content_type": "IMAGE",
      "content_url": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg",
      "file_name": "banner.jpg",
      "display_order": 1
    },
    {
      "content_type": "YOUTUBE",
      "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "display_order": 2
    }
  ]
}
```

#### Response (HTTP 201 Created):
```json
{
  "success": true,
  "message": "Event created successfully.",
  "timestamp": "2026-08-27T10:00:00.000Z",
  "data": {
    "event_id": 1,
    "org_id": 1001,
    "event_title": "Annual Science Fair 2026",
    "event_short_description": "Science models and robotics exhibitions.",
    "event_description": "Comprehensive full description for students and parents.",
    "event_type": "SCHOOL_EVENT",
    "event_status": "UPCOMING",
    "publish_status": "PUBLISHED",
    "event_start_date": "2026-10-10T09:00:00.000Z",
    "event_end_date": "2026-10-10T16:00:00.000Z",
    "thumbnail_image_url": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg",
    "contents": [
      {
        "event_content_id": 101,
        "org_id": 1001,
        "event_id": 1,
        "content_type": "IMAGE",
        "content_url": "https://school-erp-documents-prod.s3.ap-south-1.amazonaws.com/school-data/1001/school-event/EVT000001/banner.jpg",
        "file_name": "banner.jpg",
        "display_order": 1
      },
      {
        "event_content_id": 102,
        "org_id": 1001,
        "event_id": 1,
        "content_type": "YOUTUBE",
        "content_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "file_name": null,
        "display_order": 2
      }
    ]
  }
}
```

---

## 5. Dashboard Latest Events Contract

### `GET /events/dashboard/latest`
#### Response (HTTP 200 OK):
```json
{
  "success": true,
  "message": "Dashboard latest upcoming events retrieved.",
  "timestamp": "2026-08-27T10:00:00.000Z",
  "data": [
    {
      "event_id": 1,
      "org_id": 1001,
      "event_title": "Annual Sports Meet 2026",
      "event_short_description": "Exciting athletic track and field competitions.",
      "event_type": "SPORTS",
      "event_status": "UPCOMING",
      "publish_status": "PUBLISHED",
      "event_start_date": "2026-09-15T09:00:00.000Z",
      "thumbnail_image_url": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211"
    }
  ]
}
```
