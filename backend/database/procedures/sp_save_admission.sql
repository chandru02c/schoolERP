-- PROCEDURE: school.sp_save_admission(character varying, bigint, bigint, jsonb, bigint)

-- DROP PROCEDURE IF EXISTS school.sp_save_admission(character varying, bigint, bigint, jsonb, bigint);

CREATE OR REPLACE PROCEDURE school.sp_save_admission(
	IN p_action character varying,
	IN p_id bigint,
	IN p_org_id bigint,
	IN p_data jsonb,
	IN p_user_id bigint,
	OUT p_response jsonb)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    v_validation_res JSONB;
    v_app_id BIGINT;
    v_application_no VARCHAR(50);
    v_academic_year VARCHAR(20);
    v_old_status VARCHAR(50);
    v_new_status VARCHAR(50);
    v_remarks TEXT;
    v_doc JSONB;
BEGIN
    p_action := UPPER(TRIM(p_action));

    -- Step 1: Execute Centralized Business Validation Function
    v_validation_res := school.fn_validate_admission(p_action, p_org_id, p_data, p_id);
    
    IF NOT (v_validation_res->>'is_valid')::BOOLEAN THEN
        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', v_validation_res->>'error_code',
            'message', v_validation_res->>'error_message',
            'timestamp', CURRENT_TIMESTAMP
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 1: CREATE ADMISSION APPLICATION
    -- =========================================================================
    IF p_action = 'CREATE' THEN
        v_academic_year := COALESCE(TRIM(p_data->>'academic_year'), TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || (TO_CHAR(CURRENT_DATE, 'YY')::INT + 1)::TEXT);
        v_new_status    := UPPER(COALESCE(TRIM(p_data->>'admission_status'), TRIM(p_data->>'status'), 'SUBMITTED'));
        v_remarks       := COALESCE(p_data->>'remarks', 'Initial application submission.');

        -- Generate Sequential Organization-Wise Application Number
        v_application_no := school.fn_generate_application_no(p_org_id, v_academic_year);

        -- Insert Application Record (All 53 Columns Mapped)
        INSERT INTO school.admission_application (
            org_id,
            application_no,
            academic_year,
            application_date,
            admission_type,
            admission_class,
            section,
            student_first_name,
            student_middle_name,
            student_last_name,
            gender,
            dob,
            blood_group,
            nationality,
            religion,
            caste,
            category,
            mother_tongue,
            aadhaar_no,
            previous_school,
            previous_class,
            student_photo,
            father_name,
            father_mobile,
            father_email,
            father_occupation,
            mother_name,
            mother_mobile,
            mother_email,
            mother_occupation,
            guardian_name,
            guardian_mobile,
            relationship,
            address_line1,
            address_line2,
            city,
            district,
            state,
            country,
            pincode,
            transport_required,
            hostel_required,
            special_child,
            medical_condition,
            remarks,
            admission_status,
            created_by,
            updated_by,
            created_at,
            updated_at,
            is_active,
            is_deleted
        ) VALUES (
            p_org_id,
            v_application_no,
            v_academic_year,
            COALESCE((p_data->>'application_date')::DATE, CURRENT_DATE),
            COALESCE(TRIM(p_data->>'admission_type'), 'NEW'),
            TRIM(COALESCE(p_data->>'admission_class', p_data->>'applying_for_class_id')),
            TRIM(p_data->>'section'),
            TRIM(p_data->>'student_first_name'),
            TRIM(p_data->>'student_middle_name'),
            TRIM(p_data->>'student_last_name'),
            TRIM(p_data->>'gender'),
            (p_data->>'dob')::DATE,
            TRIM(p_data->>'blood_group'),
            COALESCE(TRIM(p_data->>'nationality'), 'Indian'),
            TRIM(p_data->>'religion'),
            TRIM(p_data->>'caste'),
            TRIM(p_data->>'category'),
            TRIM(p_data->>'mother_tongue'),
            TRIM(p_data->>'aadhaar_no'),
            TRIM(p_data->>'previous_school'),
            TRIM(p_data->>'previous_class'),
            TRIM(p_data->>'student_photo'),
            TRIM(COALESCE(p_data->>'father_name', p_data->>'parent_name')),
            TRIM(COALESCE(p_data->>'father_mobile', p_data->>'parent_mobile')),
            LOWER(TRIM(COALESCE(p_data->>'father_email', p_data->>'parent_email'))),
            TRIM(p_data->>'father_occupation'),
            TRIM(p_data->>'mother_name'),
            TRIM(p_data->>'mother_mobile'),
            LOWER(TRIM(p_data->>'mother_email')),
            TRIM(p_data->>'mother_occupation'),
            TRIM(p_data->>'guardian_name'),
            TRIM(p_data->>'guardian_mobile'),
            TRIM(p_data->>'relationship'),
            TRIM(COALESCE(p_data->>'address_line1', p_data->>'address')),
            TRIM(p_data->>'address_line2'),
            TRIM(p_data->>'city'),
            TRIM(p_data->>'district'),
            TRIM(p_data->>'state'),
            COALESCE(TRIM(p_data->>'country'), 'India'),
            TRIM(p_data->>'pincode'),
            COALESCE((p_data->>'transport_required')::BOOLEAN, FALSE),
            COALESCE((p_data->>'hostel_required')::BOOLEAN, FALSE),
            COALESCE((p_data->>'special_child')::BOOLEAN, FALSE),
            TRIM(p_data->>'medical_condition'),
            v_remarks,
            v_new_status,
            p_user_id,
            p_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            TRUE,
            FALSE
        )
        RETURNING id INTO v_app_id;

        -- Insert Initial Status History Record
        INSERT INTO school.admission_status_history (
            org_id,
            admission_id,
            old_status,
            new_status,
            remarks,
            changed_by,
            created_at
        ) VALUES (
            p_org_id,
            v_app_id,
            NULL,
            v_new_status,
            'Application Created: ' || v_remarks,
            p_user_id,
            CURRENT_TIMESTAMP
        );

        -- Insert Documents Array
        IF p_data ? 'documents' AND jsonb_array_length(p_data->'documents') > 0 THEN
            FOR v_doc IN SELECT * FROM jsonb_array_elements(p_data->'documents')
            LOOP
                INSERT INTO school.admission_document (
                    org_id,
                    admission_id,
                    document_name,
                    document_type,
                    s3_key,
                    verified,
                    verified_by,
                    verified_at,
                    created_at
                ) VALUES (
                    p_org_id,
                    v_app_id,
                    TRIM(v_doc->>'document_name'),
                    TRIM(v_doc->>'document_type'),
                    TRIM(COALESCE(v_doc->>'s3_key', v_doc->>'document_url')),
                    COALESCE((v_doc->>'verified')::BOOLEAN, FALSE),
                    (v_doc->>'verified_by')::BIGINT,
                    (v_doc->>'verified_at')::TIMESTAMPTZ,
                    CURRENT_TIMESTAMP
                );
            END LOOP;
        END IF;

        -- Retrieve full created record for response payload (inline to avoid fn_get_admission arg-count dependency)
        SELECT jsonb_build_object(
            'success', TRUE,
            'message', 'Admission application created successfully.',
            'data',
                to_jsonb(a)
                || jsonb_build_object(
                    'student_full_name',
                    concat_ws(' ', a.student_first_name, a.student_middle_name, a.student_last_name)
                )
                || jsonb_build_object(
                    'documents',
                    COALESCE(
                        (SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', d.id,
                                'org_id', d.org_id,
                                'admission_id', d.admission_id,
                                'document_name', d.document_name,
                                'document_type', d.document_type,
                                's3_key', d.s3_key,
                                'verified', d.verified,
                                'verified_by', d.verified_by,
                                'verified_at', d.verified_at,
                                'created_at', d.created_at
                            )
                        )
                        FROM school.admission_document d
                        WHERE d.admission_id = a.id AND d.org_id = a.org_id),
                        '[]'::jsonb
                    )
                )
                || jsonb_build_object(
                    'status_history',
                    COALESCE(
                        (SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', h.id,
                                'org_id', h.org_id,
                                'admission_id', h.admission_id,
                                'old_status', h.old_status,
                                'new_status', h.new_status,
                                'remarks', h.remarks,
                                'changed_by', h.changed_by,
                                'created_at', h.created_at
                            )
                            ORDER BY h.created_at DESC
                        )
                        FROM school.admission_status_history h
                        WHERE h.admission_id = a.id AND h.org_id = a.org_id),
                        '[]'::jsonb
                    )
                )
        )
        INTO p_response
        FROM school.admission_application a
        WHERE a.id = v_app_id AND a.org_id = p_org_id AND a.is_deleted = FALSE;
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 2: UPDATE ADMISSION APPLICATION
    -- =========================================================================
    IF p_action = 'UPDATE' THEN
        SELECT admission_status INTO v_old_status
        FROM school.admission_application
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        v_new_status := UPPER(COALESCE(TRIM(p_data->>'admission_status'), TRIM(p_data->>'status'), v_old_status));
        v_remarks    := COALESCE(p_data->>'remarks', 'Application updated.');

        UPDATE school.admission_application
        SET academic_year        = COALESCE(TRIM(p_data->>'academic_year'), academic_year),
            application_date     = COALESCE((p_data->>'application_date')::DATE, application_date),
            admission_type       = COALESCE(TRIM(p_data->>'admission_type'), admission_type),
            admission_class      = COALESCE(TRIM(p_data->>'admission_class'), admission_class),
            section              = COALESCE(TRIM(p_data->>'section'), section),
            student_first_name   = COALESCE(TRIM(p_data->>'student_first_name'), student_first_name),
            student_middle_name  = COALESCE(TRIM(p_data->>'student_middle_name'), student_middle_name),
            student_last_name    = COALESCE(TRIM(p_data->>'student_last_name'), student_last_name),
            gender               = COALESCE(TRIM(p_data->>'gender'), gender),
            dob                  = COALESCE((p_data->>'dob')::DATE, dob),
            blood_group          = COALESCE(TRIM(p_data->>'blood_group'), blood_group),
            nationality          = COALESCE(TRIM(p_data->>'nationality'), nationality),
            religion             = COALESCE(TRIM(p_data->>'religion'), religion),
            caste                = COALESCE(TRIM(p_data->>'caste'), caste),
            category             = COALESCE(TRIM(p_data->>'category'), category),
            mother_tongue        = COALESCE(TRIM(p_data->>'mother_tongue'), mother_tongue),
            aadhaar_no           = COALESCE(TRIM(p_data->>'aadhaar_no'), aadhaar_no),
            previous_school      = COALESCE(TRIM(p_data->>'previous_school'), previous_school),
            previous_class       = COALESCE(TRIM(p_data->>'previous_class'), previous_class),
            student_photo        = COALESCE(TRIM(p_data->>'student_photo'), student_photo),
            father_name          = COALESCE(TRIM(p_data->>'father_name'), father_name),
            father_mobile        = COALESCE(TRIM(p_data->>'father_mobile'), father_mobile),
            father_email         = COALESCE(LOWER(TRIM(p_data->>'father_email')), father_email),
            father_occupation    = COALESCE(TRIM(p_data->>'father_occupation'), father_occupation),
            mother_name          = COALESCE(TRIM(p_data->>'mother_name'), mother_name),
            mother_mobile        = COALESCE(TRIM(p_data->>'mother_mobile'), mother_mobile),
            mother_email         = COALESCE(LOWER(TRIM(p_data->>'mother_email')), mother_email),
            mother_occupation    = COALESCE(TRIM(p_data->>'mother_occupation'), mother_occupation),
            guardian_name        = COALESCE(TRIM(p_data->>'guardian_name'), guardian_name),
            guardian_mobile      = COALESCE(TRIM(p_data->>'guardian_mobile'), guardian_mobile),
            relationship         = COALESCE(TRIM(p_data->>'relationship'), relationship),
            address_line1        = COALESCE(TRIM(p_data->>'address_line1'), address_line1),
            address_line2        = COALESCE(TRIM(p_data->>'address_line2'), address_line2),
            city                 = COALESCE(TRIM(p_data->>'city'), city),
            district             = COALESCE(TRIM(p_data->>'district'), district),
            state                = COALESCE(TRIM(p_data->>'state'), state),
            country              = COALESCE(TRIM(p_data->>'country'), country),
            pincode              = COALESCE(TRIM(p_data->>'pincode'), pincode),
            transport_required   = COALESCE((p_data->>'transport_required')::BOOLEAN, transport_required),
            hostel_required      = COALESCE((p_data->>'hostel_required')::BOOLEAN, hostel_required),
            special_child        = COALESCE((p_data->>'special_child')::BOOLEAN, special_child),
            medical_condition    = COALESCE(TRIM(p_data->>'medical_condition'), medical_condition),
            remarks              = v_remarks,
            admission_status     = v_new_status,
            updated_by           = p_user_id,
            updated_at           = CURRENT_TIMESTAMP
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        -- Record Status History if status changed
        IF v_old_status <> v_new_status THEN
            INSERT INTO school.admission_status_history (
                org_id,
                admission_id,
                old_status,
                new_status,
                remarks,
                changed_by,
                created_at
            ) VALUES (
                p_org_id,
                p_id,
                v_old_status,
                v_new_status,
                'Status changed during application update: ' || v_remarks,
                p_user_id,
                CURRENT_TIMESTAMP
            );
        END IF;

        -- Retrieve full updated record for response payload (inline to avoid fn_get_admission arg-count dependency)
        SELECT jsonb_build_object(
            'success', TRUE,
            'message', 'Admission application updated successfully.',
            'data',
                to_jsonb(a)
                || jsonb_build_object(
                    'student_full_name',
                    concat_ws(' ', a.student_first_name, a.student_middle_name, a.student_last_name)
                )
                || jsonb_build_object(
                    'documents',
                    COALESCE(
                        (SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', d.id,
                                'org_id', d.org_id,
                                'admission_id', d.admission_id,
                                'document_name', d.document_name,
                                'document_type', d.document_type,
                                's3_key', d.s3_key,
                                'verified', d.verified,
                                'verified_by', d.verified_by,
                                'verified_at', d.verified_at,
                                'created_at', d.created_at
                            )
                        )
                        FROM school.admission_document d
                        WHERE d.admission_id = a.id AND d.org_id = a.org_id),
                        '[]'::jsonb
                    )
                )
                || jsonb_build_object(
                    'status_history',
                    COALESCE(
                        (SELECT jsonb_agg(
                            jsonb_build_object(
                                'id', h.id,
                                'org_id', h.org_id,
                                'admission_id', h.admission_id,
                                'old_status', h.old_status,
                                'new_status', h.new_status,
                                'remarks', h.remarks,
                                'changed_by', h.changed_by,
                                'created_at', h.created_at
                            )
                            ORDER BY h.created_at DESC
                        )
                        FROM school.admission_status_history h
                        WHERE h.admission_id = a.id AND h.org_id = a.org_id),
                        '[]'::jsonb
                    )
                )
        )
        INTO p_response
        FROM school.admission_application a
        WHERE a.id = p_id AND a.org_id = p_org_id AND a.is_deleted = FALSE;
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 3: DELETE (SOFT DELETE ONLY)
    -- =========================================================================
    IF p_action = 'DELETE' THEN
        SELECT admission_status INTO v_old_status
        FROM school.admission_application
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        UPDATE school.admission_application
        SET is_deleted       = TRUE,
            is_active        = FALSE,
            admission_status = 'CANCELLED',
            updated_by       = p_user_id,
            updated_at       = CURRENT_TIMESTAMP
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        -- Log status history for cancellation
        INSERT INTO school.admission_status_history (
            org_id,
            admission_id,
            old_status,
            new_status,
            remarks,
            changed_by,
            created_at
        ) VALUES (
            p_org_id,
            p_id,
            v_old_status,
            'CANCELLED',
            COALESCE(p_data->>'remarks', 'Soft deleted / cancelled by user request.'),
            p_user_id,
            CURRENT_TIMESTAMP
        );

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Admission application record successfully soft-deleted.',
            'id', p_id
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 4: STATUS_UPDATE WORKFLOW
    -- =========================================================================
    IF p_action = 'STATUS_UPDATE' THEN
        SELECT admission_status INTO v_old_status
        FROM school.admission_application
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        v_new_status := UPPER(TRIM(COALESCE(p_data->>'admission_status', p_data->>'status')));
        v_remarks    := COALESCE(p_data->>'remarks', 'Status updated.');

        UPDATE school.admission_application
        SET admission_status = v_new_status,
            remarks          = v_remarks,
            updated_by       = p_user_id,
            updated_at       = CURRENT_TIMESTAMP
        WHERE id = p_id AND org_id = p_org_id AND is_deleted = FALSE;

        -- Record Audit History
        INSERT INTO school.admission_status_history (
            org_id,
            admission_id,
            old_status,
            new_status,
            remarks,
            changed_by,
            created_at
        ) VALUES (
            p_org_id,
            p_id,
            v_old_status,
            v_new_status,
            v_remarks,
            p_user_id,
            CURRENT_TIMESTAMP
        );

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Admission status updated from ' || v_old_status || ' to ' || v_new_status || '.',
            'data', jsonb_build_object(
                'id', p_id,
                'old_status', v_old_status,
                'new_status', v_new_status,
                'updated_at', CURRENT_TIMESTAMP
            )
        );
        RETURN;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'SQLSTATE: %, SQLERRM: %', SQLSTATE, SQLERRM;

        p_response := jsonb_build_object(
            'success', FALSE,
            'error_code', 'ERR_INTERNAL_DATABASE',
            'message', SQLERRM,
            'detail', SQLSTATE,
            'timestamp', CURRENT_TIMESTAMP
        );
END;
$BODY$;
ALTER PROCEDURE school.sp_save_admission(character varying, bigint, bigint, jsonb, bigint)
    OWNER TO neondb_owner;

COMMENT ON PROCEDURE school.sp_save_admission(character varying, bigint, bigint, jsonb, bigint)
    IS 'Centralized stored procedure mapping all 53 columns of school.admission_application, document verification, and status history.';
