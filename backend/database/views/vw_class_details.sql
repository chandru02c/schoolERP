-- =============================================================================
-- File: backend/database/views/vw_class_details.sql
-- Description: Multi-tenant denormalized view for Class and Section reporting.
-- Schema: school
-- =============================================================================

CREATE OR REPLACE VIEW school.vw_class_details AS
SELECT 
    c.class_id,
    c.org_id,
    c.class_name,
    c.class_code,
    c.description,
    c.status AS class_status,
    c.is_active AS is_class_active,
    c.created_at AS class_created_at,
    c.updated_at AS class_updated_at,
    COUNT(s.class_section_id) FILTER (WHERE s.is_deleted = FALSE) AS total_sections,
    COUNT(s.class_section_id) FILTER (WHERE s.is_deleted = FALSE AND s.status = 'Active') AS active_sections,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'class_section_id', s.class_section_id,
                'section_name', s.section_name,
                'section_code', s.section_code,
                'description', s.description,
                'status', s.status,
                'is_active', s.is_active
            ) ORDER BY s.class_section_id ASC
        ) FILTER (WHERE s.class_section_id IS NOT NULL AND s.is_deleted = FALSE),
        '[]'::jsonb
    ) AS sections
FROM school.class_master c
LEFT JOIN school.class_section s 
    ON s.class_id = c.class_id 
   AND s.org_id = c.org_id 
   AND s.is_deleted = FALSE
WHERE c.is_deleted = FALSE
GROUP BY c.class_id, c.org_id;

COMMENT ON VIEW school.vw_class_details IS 'Denormalized multi-tenant view for Class details with section summaries.';
