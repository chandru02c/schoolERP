-- =============================================================================
-- File: backend/database/seed/event_seed.sql
-- Description: Seed data for Event Module tables (Org 1001).
-- Schema: school
-- =============================================================================

DO $$
DECLARE
    v_evt1 BIGINT;
    v_evt2 BIGINT;
    v_evt3 BIGINT;
BEGIN
    -- Event 1: Annual Sports Meet 2026 (UPCOMING, PUBLISHED)
    INSERT INTO school.event_master (
        org_id,
        event_title,
        event_short_description,
        event_description,
        event_type,
        event_status,
        publish_status,
        event_start_date,
        event_end_date,
        thumbnail_image_url,
        created_by,
        created_at,
        is_deleted
    ) VALUES (
        1001,
        'Annual Sports Meet 2026',
        'Exciting athletic track and field competitions for all classes from Grade 1 to 12.',
        'Join us for our grand Annual Sports Day celebration featuring march past, 100m sprint, relays, high jump, shot put, and prize distribution by distinguished sports personalities.',
        'SPORTS',
        'UPCOMING',
        'PUBLISHED',
        '2026-09-15 09:00:00',
        '2026-09-16 17:00:00',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
        1,
        CURRENT_TIMESTAMP,
        FALSE
    ) RETURNING event_id INTO v_evt1;

    INSERT INTO school.event_content (
        org_id, event_id, content_type, content_url, file_name, display_order, created_by
    ) VALUES 
    (1001, v_evt1, 'IMAGE', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80', 'sports_banner.jpg', 1, 1),
    (1001, v_evt1, 'IMAGE', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80', 'ground_prep.jpg', 2, 1),
    (1001, v_evt1, 'YOUTUBE', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, 3, 1);

    -- Event 2: Science & Robotics Exhibition 2026 (UPCOMING, PUBLISHED)
    INSERT INTO school.event_master (
        org_id,
        event_title,
        event_short_description,
        event_description,
        event_type,
        event_status,
        publish_status,
        event_start_date,
        event_end_date,
        thumbnail_image_url,
        created_by,
        created_at,
        is_deleted
    ) VALUES (
        1001,
        'Science & Robotics Exhibition 2026',
        'Interactive innovative projects, working models, and robotics demonstrations by young innovators.',
        'Students from secondary and senior secondary wings will exhibit self-built robots, renewable energy prototypes, and space science simulations for parents and visitors.',
        'SCHOOL_EVENT',
        'UPCOMING',
        'PUBLISHED',
        '2026-10-05 10:00:00',
        '2026-10-05 16:00:00',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        1,
        CURRENT_TIMESTAMP,
        FALSE
    ) RETURNING event_id INTO v_evt2;

    INSERT INTO school.event_content (
        org_id, event_id, content_type, content_url, file_name, display_order, created_by
    ) VALUES 
    (1001, v_evt2, 'IMAGE', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'robotics_lab.jpg', 1, 1),
    (1001, v_evt2, 'YOUTUBE', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL, 2, 1);

    -- Event 3: Independence Day Cultural Gala (COMPLETED, PUBLISHED)
    INSERT INTO school.event_master (
        org_id,
        event_title,
        event_short_description,
        event_description,
        event_type,
        event_status,
        publish_status,
        event_start_date,
        event_end_date,
        thumbnail_image_url,
        created_by,
        created_at,
        is_deleted
    ) VALUES (
        1001,
        'Independence Day Cultural Gala',
        'Flag hoisting ceremony accompanied by patriotic cultural songs, dance, and drama performances.',
        'A patriotic celebration honouring national heroes with musical choir, classical dance drama, and speech competitions across all houses.',
        'CULTURAL',
        'COMPLETED',
        'PUBLISHED',
        '2026-08-15 08:30:00',
        '2026-08-15 12:30:00',
        'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
        1,
        CURRENT_TIMESTAMP,
        FALSE
    ) RETURNING event_id INTO v_evt3;

    INSERT INTO school.event_content (
        org_id, event_id, content_type, content_url, file_name, display_order, created_by
    ) VALUES 
    (1001, v_evt3, 'IMAGE', 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80', 'flag_ceremony.jpg', 1, 1);

END $$;
