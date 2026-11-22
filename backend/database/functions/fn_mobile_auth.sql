-- =============================================================================
-- File: backend/database/functions/fn_mobile_auth.sql
-- Description: PostgreSQL functions for Mobile Authentication Module.
-- Functions:
--   1. fn_mobile_teacher_login       — Validate teacher credentials, return profile
--   2. fn_mobile_parent_login        — Validate parent credentials, return profile + children
--   3. fn_get_teacher_assigned_classes — Classes assigned to teacher via academic module
--   4. fn_get_parent_children        — Children linked to parent via mapping table
--   5. fn_get_teacher_mobile_profile  — Full teacher profile for mobile
--   6. fn_get_parent_mobile_profile   — Full parent profile for mobile
--   7. fn_validate_mobile_token      — Check JTI blacklist
--   8. fn_get_mobile_teacher_list    — Admin: list teachers with login status
--   9. fn_get_mobile_parent_list     — Admin: list parents with login status
-- Schema: school
-- =============================================================================

-- =============================================================================
-- FUNCTION 1: fn_mobile_teacher_login
-- Validates username + password_hash match for a teacher in the given org.
-- Returns teacher profile data + auth metadata.
-- NOTE: Password hashing (bcrypt) is done in the Lambda; this function
--       receives the stored hash for comparison, not the plain password.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_mobile_teacher_login(
    p_username    VARCHAR,
    p_org_id      BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth      RECORD;
    v_teacher   RECORD;
    v_result    JSONB;
BEGIN
    -- Fetch auth record
    SELECT mta.*
    INTO v_auth
    FROM school.mobile_teacher_auth mta
    WHERE mta.org_id = p_org_id
      AND mta.username = LOWER(TRIM(p_username))
      AND mta.is_deleted = FALSE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_USER_NOT_FOUND',
            'message', 'Invalid username or password.'
        );
    END IF;

    IF v_auth.status = 'Inactive' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACCOUNT_INACTIVE',
            'message', 'Your account has been deactivated. Contact your administrator.'
        );
    END IF;

    IF v_auth.status = 'Locked' AND v_auth.locked_until IS NOT NULL AND v_auth.locked_until > NOW() THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACCOUNT_LOCKED',
            'message', 'Account is temporarily locked. Try again after ' || TO_CHAR(v_auth.locked_until, 'HH12:MI AM') || '.',
            'locked_until', v_auth.locked_until
        );
    END IF;

    -- Fetch teacher master data
    SELECT td.teacher_id, td.org_id, td.teacher_code, td.full_name,
           td.first_name, td.last_name, td.email, td.phone,
           td.qualification, td.specialization, td.primary_subject,
           td.secondary_subject, td.experience_years, td.status AS teacher_status,
           td.gender
    INTO v_teacher
    FROM school.teacher_details td
    WHERE td.teacher_id = v_auth.teacher_id
      AND td.org_id = p_org_id
      AND td.is_deleted = FALSE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_TEACHER_RECORD_MISSING',
            'message', 'Teacher master record not found.'
        );
    END IF;

    -- Return auth record + teacher data (Lambda will verify bcrypt hash)
    RETURN jsonb_build_object(
        'success', TRUE,
        'auth_id', v_auth.id,
        'teacher_id', v_teacher.teacher_id,
        'org_id', v_teacher.org_id,
        'password_hash', v_auth.password_hash,
        'status', v_auth.status,
        'failed_attempts', v_auth.failed_attempts,
        'profile', jsonb_build_object(
            'teacher_id', v_teacher.teacher_id,
            'teacher_code', v_teacher.teacher_code,
            'full_name', v_teacher.full_name,
            'first_name', v_teacher.first_name,
            'last_name', v_teacher.last_name,
            'email', v_teacher.email,
            'phone', v_teacher.phone,
            'gender', v_teacher.gender,
            'qualification', v_teacher.qualification,
            'specialization', v_teacher.specialization,
            'primary_subject', v_teacher.primary_subject,
            'secondary_subject', v_teacher.secondary_subject,
            'experience_years', v_teacher.experience_years,
            'teacher_status', v_teacher.teacher_status,
            'username', v_auth.username,
            'last_login', v_auth.last_login,
            'org_id', v_teacher.org_id
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_DB',
            'message', SQLERRM
        );
END;
$$;

-- =============================================================================
-- FUNCTION 2: fn_mobile_parent_login
-- Validates parent credentials and returns profile + children list.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_mobile_parent_login(
    p_username    VARCHAR,
    p_org_id      BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth      RECORD;
    v_children  JSONB;
    v_result    JSONB;
BEGIN
    -- Fetch auth record
    SELECT mpa.*
    INTO v_auth
    FROM school.mobile_parent_auth mpa
    WHERE mpa.org_id = p_org_id
      AND mpa.username = LOWER(TRIM(p_username))
      AND mpa.is_deleted = FALSE
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_USER_NOT_FOUND',
            'message', 'Invalid username or password.'
        );
    END IF;

    IF v_auth.status = 'Inactive' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACCOUNT_INACTIVE',
            'message', 'Your account has been deactivated. Contact your administrator.'
        );
    END IF;

    IF v_auth.status = 'Locked' AND v_auth.locked_until IS NOT NULL AND v_auth.locked_until > NOW() THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_ACCOUNT_LOCKED',
            'message', 'Account is temporarily locked.',
            'locked_until', v_auth.locked_until
        );
    END IF;

    -- Fetch children
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'student_id', sm.student_id,
                'student_code', sm.student_code,
                'registration_no', sm.registration_no,
                'roll_no', sm.roll_no,
                'class_id', sm.class_id,
                'section_id', sm.section_id,
                'academic_year', sm.academic_year,
                'student_status', sm.student_status,
                'relationship_type', psm.relationship_type,
                'is_primary', psm.is_primary,
                'student_name', CONCAT(aa.student_first_name, ' ', aa.student_last_name),
                'gender', aa.gender,
                'dob', aa.dob,
                'blood_group', aa.blood_group,
                'photo', aa.student_photo
            )
            ORDER BY psm.is_primary DESC, sm.student_id
        ),
        '[]'::JSONB
    )
    INTO v_children
    FROM school.parent_student_mapping psm
    JOIN school.student_master sm ON sm.student_id = psm.student_id AND sm.org_id = psm.org_id
    JOIN school.admission_application aa ON aa.id = sm.admission_id
    WHERE psm.parent_id = v_auth.id
      AND psm.org_id = p_org_id
      AND psm.status = 'Active'
      AND sm.is_deleted = FALSE;

    RETURN jsonb_build_object(
        'success', TRUE,
        'auth_id', v_auth.id,
        'parent_id', v_auth.id,
        'org_id', v_auth.org_id,
        'password_hash', v_auth.password_hash,
        'status', v_auth.status,
        'failed_attempts', v_auth.failed_attempts,
        'profile', jsonb_build_object(
            'parent_id', v_auth.id,
            'parent_name', v_auth.parent_name,
            'phone', v_auth.phone,
            'email', v_auth.email,
            'username', v_auth.username,
            'last_login', v_auth.last_login,
            'org_id', v_auth.org_id
        ),
        'children', v_children
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- FUNCTION 3: fn_get_teacher_assigned_classes
-- Returns all classes assigned to a teacher (as class teacher OR subject teacher).
-- Uses: school.academic_set (class_teacher_id) + school.subject_teacher_assignment
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_get_teacher_assigned_classes(
    p_teacher_id  BIGINT,
    p_org_id      BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_classes   JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(DISTINCT
            jsonb_build_object(
                'class_id', cm.class_id,
                'class_name', cm.class_name,
                'class_code', cm.class_code,
                'section', aset.section,
                'academic_set_id', aset.academic_set_id,
                'academic_year_id', ay.academic_year_id,
                'academic_year', ay.year_name,
                'is_class_teacher', (aset.class_teacher_id = p_teacher_id),
                'subjects', (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object(
                            'subject_name', sta.subject_name,
                            'subject_code', sta.subject_code,
                            'periods_per_week', sta.periods_per_week
                        )
                    ), '[]'::JSONB)
                    FROM school.subject_teacher_assignment sta
                    WHERE sta.academic_set_id = aset.academic_set_id
                      AND sta.teacher_id = p_teacher_id
                      AND sta.org_id = p_org_id
                      AND sta.is_deleted = FALSE
                      AND sta.status = 'ACTIVE'
                )
            )
        ),
        '[]'::JSONB
    )
    INTO v_classes
    FROM school.academic_set aset
    JOIN school.academic_year ay ON ay.academic_year_id = aset.academic_year_id AND ay.is_deleted = FALSE
    JOIN school.class_master cm ON cm.class_id = aset.class_id AND cm.is_deleted = FALSE
    WHERE aset.org_id = p_org_id
      AND aset.is_deleted = FALSE
      AND aset.status = 'ACTIVE'
      AND ay.status IN ('ACTIVE', 'UPCOMING')
      AND (
            aset.class_teacher_id = p_teacher_id
            OR EXISTS (
                SELECT 1 FROM school.subject_teacher_assignment sta
                WHERE sta.academic_set_id = aset.academic_set_id
                  AND sta.teacher_id = p_teacher_id
                  AND sta.org_id = p_org_id
                  AND sta.is_deleted = FALSE
                  AND sta.status = 'ACTIVE'
            )
      );

    RETURN jsonb_build_object(
        'success', TRUE,
        'teacher_id', p_teacher_id,
        'org_id', p_org_id,
        'classes', v_classes
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- FUNCTION 4: fn_get_parent_children
-- Returns children + student details for a parent.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_get_parent_children(
    p_parent_id   BIGINT,
    p_org_id      BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_children  JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'student_id', sm.student_id,
                'student_code', sm.student_code,
                'registration_no', sm.registration_no,
                'roll_no', sm.roll_no,
                'class_id', sm.class_id,
                'section_id', sm.section_id,
                'academic_year', sm.academic_year,
                'student_status', sm.student_status,
                'relationship_type', psm.relationship_type,
                'is_primary', psm.is_primary,
                'student_name', CONCAT(aa.student_first_name, ' ', aa.student_last_name),
                'first_name', aa.student_first_name,
                'last_name', aa.student_last_name,
                'gender', aa.gender,
                'dob', aa.dob,
                'blood_group', aa.blood_group,
                'photo', aa.student_photo,
                'father_name', aa.father_name,
                'mother_name', aa.mother_name
            )
            ORDER BY psm.is_primary DESC, sm.student_id
        ),
        '[]'::JSONB
    )
    INTO v_children
    FROM school.parent_student_mapping psm
    JOIN school.student_master sm ON sm.student_id = psm.student_id AND sm.org_id = psm.org_id
    JOIN school.admission_application aa ON aa.id = sm.admission_id
    WHERE psm.parent_id = p_parent_id
      AND psm.org_id = p_org_id
      AND psm.status = 'Active'
      AND sm.is_deleted = FALSE;

    RETURN jsonb_build_object(
        'success', TRUE,
        'parent_id', p_parent_id,
        'org_id', p_org_id,
        'children', v_children
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- FUNCTION 5: fn_validate_mobile_token
-- Checks if a JWT JTI has been blacklisted (revoked via logout).
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_validate_mobile_token(
    p_jti   VARCHAR
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM school.mobile_token_blacklist
    WHERE jti = p_jti AND expires_at > NOW();

    IF v_count > 0 THEN
        RETURN jsonb_build_object('valid', FALSE, 'reason', 'Token has been revoked.');
    END IF;

    RETURN jsonb_build_object('valid', TRUE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('valid', FALSE, 'reason', SQLERRM);
END;
$$;

-- =============================================================================
-- FUNCTION 6: fn_get_mobile_teacher_list
-- Admin page: list teachers with their mobile login status.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_get_mobile_teacher_list(
    p_org_id        BIGINT,
    p_search        VARCHAR DEFAULT NULL,
    p_status        VARCHAR DEFAULT NULL,
    p_page          INT DEFAULT 1,
    p_limit         INT DEFAULT 20
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset    INT := ((COALESCE(p_page, 1) - 1) * COALESCE(p_limit, 20));
    v_teachers  JSONB;
    v_total     INT;
BEGIN
    -- Total count
    SELECT COUNT(*)
    INTO v_total
    FROM school.teacher_details td
    LEFT JOIN school.mobile_teacher_auth mta
           ON mta.teacher_id = td.teacher_id AND mta.org_id = td.org_id AND mta.is_deleted = FALSE
    WHERE td.org_id = p_org_id
      AND td.is_deleted = FALSE
      AND (p_status IS NULL
           OR (p_status = 'Active' AND mta.status = 'Active')
           OR (p_status = 'Inactive' AND mta.status = 'Inactive')
           OR (p_status = 'Not Created' AND mta.id IS NULL))
      AND (p_search IS NULL OR
           td.full_name ILIKE '%' || p_search || '%' OR
           td.email ILIKE '%' || p_search || '%' OR
           td.teacher_code ILIKE '%' || p_search || '%' OR
           td.phone ILIKE '%' || p_search || '%');

    -- Data
    SELECT COALESCE(jsonb_agg(row_data ORDER BY td.full_name), '[]'::JSONB)
    INTO v_teachers
    FROM (
        SELECT jsonb_build_object(
            'teacher_id', td.teacher_id,
            'teacher_code', td.teacher_code,
            'full_name', td.full_name,
            'email', td.email,
            'phone', td.phone,
            'primary_subject', td.primary_subject,
            'teacher_status', td.status,
            'has_login', (mta.id IS NOT NULL),
            'auth_id', mta.id,
            'username', mta.username,
            'login_status', COALESCE(mta.status, 'Not Created'),
            'last_login', mta.last_login
        ) AS row_data
        FROM school.teacher_details td
        LEFT JOIN school.mobile_teacher_auth mta
               ON mta.teacher_id = td.teacher_id AND mta.org_id = td.org_id AND mta.is_deleted = FALSE
        WHERE td.org_id = p_org_id
          AND td.is_deleted = FALSE
          AND (p_status IS NULL
               OR (p_status = 'Active' AND mta.status = 'Active')
               OR (p_status = 'Inactive' AND mta.status = 'Inactive')
               OR (p_status = 'Not Created' AND mta.id IS NULL))
          AND (p_search IS NULL OR
               td.full_name ILIKE '%' || p_search || '%' OR
               td.email ILIKE '%' || p_search || '%' OR
               td.teacher_code ILIKE '%' || p_search || '%' OR
               td.phone ILIKE '%' || p_search || '%')
        ORDER BY td.full_name
        LIMIT COALESCE(p_limit, 20)
        OFFSET v_offset
    ) sub;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', v_teachers,
        'pagination', jsonb_build_object(
            'total', v_total,
            'page', COALESCE(p_page, 1),
            'limit', COALESCE(p_limit, 20),
            'total_pages', CEIL(v_total::NUMERIC / COALESCE(p_limit, 20))
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;

-- =============================================================================
-- FUNCTION 7: fn_get_mobile_parent_list
-- Admin page: list parents with their mobile login status and linked children.
-- =============================================================================
CREATE OR REPLACE FUNCTION school.fn_get_mobile_parent_list(
    p_org_id        BIGINT,
    p_search        VARCHAR DEFAULT NULL,
    p_status        VARCHAR DEFAULT NULL,
    p_page          INT DEFAULT 1,
    p_limit         INT DEFAULT 20
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset    INT := ((COALESCE(p_page, 1) - 1) * COALESCE(p_limit, 20));
    v_parents   JSONB;
    v_total     INT;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM school.mobile_parent_auth mpa
    WHERE mpa.org_id = p_org_id
      AND mpa.is_deleted = FALSE
      AND (p_status IS NULL OR mpa.status = p_status)
      AND (p_search IS NULL OR
           mpa.parent_name ILIKE '%' || p_search || '%' OR
           mpa.username ILIKE '%' || p_search || '%' OR
           mpa.email ILIKE '%' || p_search || '%' OR
           mpa.phone ILIKE '%' || p_search || '%');

    SELECT COALESCE(jsonb_agg(row_data ORDER BY mpa.parent_name), '[]'::JSONB)
    INTO v_parents
    FROM (
        SELECT jsonb_build_object(
            'parent_id', mpa.id,
            'parent_name', mpa.parent_name,
            'phone', mpa.phone,
            'email', mpa.email,
            'username', mpa.username,
            'status', mpa.status,
            'last_login', mpa.last_login,
            'children_count', (
                SELECT COUNT(*) FROM school.parent_student_mapping psm
                WHERE psm.parent_id = mpa.id AND psm.org_id = p_org_id AND psm.status = 'Active'
            ),
            'children', (
                SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                        'student_id', sm.student_id,
                        'student_name', CONCAT(aa.student_first_name, ' ', aa.student_last_name),
                        'class_id', sm.class_id,
                        'section_id', sm.section_id,
                        'relationship_type', psm.relationship_type
                    )
                ), '[]'::JSONB)
                FROM school.parent_student_mapping psm
                JOIN school.student_master sm ON sm.student_id = psm.student_id
                JOIN school.admission_application aa ON aa.id = sm.admission_id
                WHERE psm.parent_id = mpa.id AND psm.org_id = p_org_id AND psm.status = 'Active'
            )
        ) AS row_data
        FROM school.mobile_parent_auth mpa
        WHERE mpa.org_id = p_org_id
          AND mpa.is_deleted = FALSE
          AND (p_status IS NULL OR mpa.status = p_status)
          AND (p_search IS NULL OR
               mpa.parent_name ILIKE '%' || p_search || '%' OR
               mpa.username ILIKE '%' || p_search || '%' OR
               mpa.email ILIKE '%' || p_search || '%' OR
               mpa.phone ILIKE '%' || p_search || '%')
        ORDER BY mpa.parent_name
        LIMIT COALESCE(p_limit, 20)
        OFFSET v_offset
    ) sub;

    RETURN jsonb_build_object(
        'success', TRUE,
        'data', v_parents,
        'pagination', jsonb_build_object(
            'total', v_total,
            'page', COALESCE(p_page, 1),
            'limit', COALESCE(p_limit, 20),
            'total_pages', CEIL(v_total::NUMERIC / COALESCE(p_limit, 20))
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', FALSE, 'error_code', 'ERR_DB', 'message', SQLERRM);
END;
$$;
