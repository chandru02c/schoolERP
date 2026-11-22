-- =============================================================================
-- File: backend/database/procedures/sp_save_teacher.sql
-- Description: Centralized Stored Procedure for managing teacher data across
--              school.teacher_details, school.teacher_employment, and
--              school.teacher_payroll with full transaction safety and multi-tenancy.
-- Schema: school
-- Actions: CREATE, UPDATE, DELETE, STATUS_UPDATE
-- =============================================================================

CREATE OR REPLACE PROCEDURE school.sp_save_teacher(
    IN p_action character varying,
    IN p_id bigint,
    IN p_org_id bigint,
    IN p_data jsonb,
    IN p_user_id bigint,
    OUT p_response jsonb
)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    v_validation_res JSONB;
    v_teacher_id BIGINT;
    v_teacher_code VARCHAR(50);
    v_first_name VARCHAR(100);
    v_middle_name VARCHAR(100);
    v_last_name VARCHAR(100);
    v_full_name VARCHAR(255);
    v_status VARCHAR(50);
    v_basic_salary NUMERIC(12,2);
    v_hra NUMERIC(12,2);
    v_da NUMERIC(12,2);
    v_medical NUMERIC(12,2);
    v_conveyance NUMERIC(12,2);
    v_special NUMERIC(12,2);
    v_other_allow NUMERIC(12,2);
    v_gross NUMERIC(12,2);
    v_pf NUMERIC(12,2);
    v_esi NUMERIC(12,2);
    v_pt NUMERIC(12,2);
    v_it NUMERIC(12,2);
    v_other_ded NUMERIC(12,2);
    v_total_ded NUMERIC(12,2);
    v_net NUMERIC(12,2);
    v_dob DATE;
    v_joining_date DATE;
BEGIN
    p_action := UPPER(TRIM(p_action));

    -- Step 1: Execute Centralized Business Validation Function
    v_validation_res := school.fn_validate_teacher(p_action, p_org_id, p_data, p_id);
    
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
    -- ACTION 1: CREATE TEACHER
    -- =========================================================================
    IF p_action = 'CREATE' THEN
        v_first_name  := TRIM(p_data->>'first_name');
        v_middle_name := NULLIF(TRIM(p_data->>'middle_name'), '');
        v_last_name   := TRIM(p_data->>'last_name');
        v_full_name   := v_first_name || COALESCE(' ' || v_middle_name, '') || ' ' || v_last_name;
        v_status      := COALESCE(NULLIF(TRIM(p_data->>'status'), ''), 'Active');

        -- Parse dates
        IF p_data->>'date_of_birth' IS NOT NULL AND p_data->>'date_of_birth' <> '' THEN
            v_dob := (p_data->>'date_of_birth')::DATE;
        ELSIF p_data->>'dob' IS NOT NULL AND p_data->>'dob' <> '' THEN
            v_dob := (p_data->>'dob')::DATE;
        END IF;

        IF p_data->>'joining_date' IS NOT NULL AND p_data->>'joining_date' <> '' THEN
            v_joining_date := (p_data->>'joining_date')::DATE;
        ELSE
            v_joining_date := CURRENT_DATE;
        END IF;

        -- Generate Sequential Teacher Code
        v_teacher_code := COALESCE(NULLIF(TRIM(p_data->>'teacher_code'), ''), school.fn_generate_teacher_code(p_org_id));

        -- 1. Insert teacher_details
        INSERT INTO school.teacher_details (
            org_id,
            teacher_code,
            first_name,
            middle_name,
            last_name,
            full_name,
            gender,
            date_of_birth,
            marital_status,
            email,
            phone,
            address_line_1,
            address_line_2,
            city,
            state,
            country,
            postal_code,
            emergency_contact_name,
            emergency_contact_phone,
            emergency_contact_relationship,
            qualification,
            specialization,
            experience_years,
            primary_subject,
            secondary_subject,
            languages_known,
            cognito_user_id,
            login_enabled,
            role,
            user_type,
            status,
            total_leaves,
            created_by,
            updated_by,
            created_at,
            updated_at,
            is_active,
            is_deleted
        ) VALUES (
            p_org_id,
            v_teacher_code,
            v_first_name,
            v_middle_name,
            v_last_name,
            v_full_name,
            TRIM(p_data->>'gender'),
            v_dob,
            NULLIF(TRIM(p_data->>'marital_status'), ''),
            LOWER(TRIM(p_data->>'email')),
            TRIM(p_data->>'phone'),
            NULLIF(TRIM(p_data->>'address_line_1'), ''),
            NULLIF(TRIM(p_data->>'address_line_2'), ''),
            NULLIF(TRIM(p_data->>'city'), ''),
            NULLIF(TRIM(p_data->>'state'), ''),
            COALESCE(NULLIF(TRIM(p_data->>'country'), ''), 'India'),
            NULLIF(TRIM(p_data->>'postal_code'), ''),
            NULLIF(TRIM(p_data->>'emergency_contact_name'), ''),
            NULLIF(TRIM(p_data->>'emergency_contact_phone'), ''),
            NULLIF(TRIM(p_data->>'emergency_contact_relationship'), ''),
            NULLIF(TRIM(p_data->>'qualification'), ''),
            NULLIF(TRIM(p_data->>'specialization'), ''),
            COALESCE((p_data->>'experience_years')::NUMERIC, 0),
            NULLIF(TRIM(p_data->>'primary_subject'), ''),
            NULLIF(TRIM(p_data->>'secondary_subject'), ''),
            NULLIF(TRIM(p_data->>'languages_known'), ''),
            NULLIF(TRIM(p_data->>'cognito_user_id'), ''),
            COALESCE((p_data->>'login_enabled')::BOOLEAN, FALSE),
            CASE WHEN UPPER(TRIM(COALESCE(p_data->>'role', p_data->>'user_type', 'TEACHER'))) = 'ADMIN' THEN 'ADMIN' ELSE 'TEACHER' END,
            CASE WHEN UPPER(TRIM(COALESCE(p_data->>'user_type', p_data->>'role', 'TEACHER'))) = 'ADMIN' THEN 'ADMIN' ELSE 'TEACHER' END,
            v_status,
            COALESCE((p_data->>'total_leaves')::INT, 18),
            p_user_id,
            p_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            TRUE,
            FALSE
        ) RETURNING teacher_id INTO v_teacher_id;

        -- 2. Insert teacher_employment
        INSERT INTO school.teacher_employment (
            org_id,
            teacher_id,
            employee_number,
            department,
            designation,
            employment_type,
            employment_status,
            joining_date,
            confirmation_date,
            reporting_manager,
            class_teacher_of,
            house_assigned,
            previous_school_name,
            previous_designation,
            previous_experience_years,
            total_experience_years,
            work_location,
            shift_name,
            remarks,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            p_org_id,
            v_teacher_id,
            COALESCE(NULLIF(TRIM(p_data->>'employee_number'), ''), 'EMP-' || v_teacher_code),
            TRIM(p_data->>'department'),
            TRIM(p_data->>'designation'),
            COALESCE(NULLIF(TRIM(p_data->>'employment_type'), ''), 'Full-Time'),
            COALESCE(NULLIF(TRIM(p_data->>'employment_status'), ''), 'Permanent'),
            v_joining_date,
            NULLIF(p_data->>'confirmation_date', '')::DATE,
            NULLIF(TRIM(p_data->>'reporting_manager'), ''),
            NULLIF(TRIM(p_data->>'class_teacher_of'), ''),
            NULLIF(TRIM(p_data->>'house_assigned'), ''),
            NULLIF(TRIM(p_data->>'previous_school_name'), ''),
            NULLIF(TRIM(p_data->>'previous_designation'), ''),
            COALESCE((p_data->>'previous_experience_years')::NUMERIC, 0),
            COALESCE((p_data->>'total_experience_years')::NUMERIC, (p_data->>'experience_years')::NUMERIC, 0),
            NULLIF(TRIM(p_data->>'work_location'), ''),
            COALESCE(NULLIF(TRIM(p_data->>'shift_name'), ''), 'Morning'),
            NULLIF(TRIM(p_data->>'remarks'), ''),
            p_user_id,
            p_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- 3. Calculate payroll values
        v_basic_salary := COALESCE((p_data->>'basic_salary')::NUMERIC, 0);
        v_hra          := COALESCE((p_data->>'hra_amount')::NUMERIC, 0);
        v_da           := COALESCE((p_data->>'da_amount')::NUMERIC, 0);
        v_medical      := COALESCE((p_data->>'medical_allowance')::NUMERIC, 0);
        v_conveyance   := COALESCE((p_data->>'conveyance_allowance')::NUMERIC, 0);
        v_special      := COALESCE((p_data->>'special_allowance')::NUMERIC, 0);
        v_other_allow  := COALESCE((p_data->>'other_allowance')::NUMERIC, 0);
        v_gross        := COALESCE((p_data->>'gross_salary')::NUMERIC, v_basic_salary + v_hra + v_da + v_medical + v_conveyance + v_special + v_other_allow);

        v_pf           := COALESCE((p_data->>'pf_amount')::NUMERIC, 0);
        v_esi          := COALESCE((p_data->>'esi_amount')::NUMERIC, 0);
        v_pt           := COALESCE((p_data->>'professional_tax')::NUMERIC, 0);
        v_it           := COALESCE((p_data->>'income_tax')::NUMERIC, 0);
        v_other_ded    := COALESCE((p_data->>'other_deductions')::NUMERIC, 0);
        v_total_ded    := COALESCE((p_data->>'total_deductions')::NUMERIC, v_pf + v_esi + v_pt + v_it + v_other_ded);
        v_net          := COALESCE((p_data->>'net_salary')::NUMERIC, v_gross - v_total_ded);

        -- 4. Insert teacher_payroll
        INSERT INTO school.teacher_payroll (
            org_id,
            teacher_id,
            salary_structure,
            basic_salary,
            hra_amount,
            da_amount,
            medical_allowance,
            conveyance_allowance,
            special_allowance,
            other_allowance,
            gross_salary,
            pf_applicable,
            pf_amount,
            esi_applicable,
            esi_amount,
            professional_tax,
            income_tax,
            other_deductions,
            total_deductions,
            net_salary,
            bank_name,
            account_holder_name,
            account_number,
            ifsc_code,
            branch_name,
            upi_id,
            payment_mode,
            salary_effective_from,
            created_by,
            updated_by,
            created_at,
            updated_at
        ) VALUES (
            p_org_id,
            v_teacher_id,
            COALESCE(NULLIF(TRIM(p_data->>'salary_structure'), ''), 'Standard'),
            v_basic_salary,
            v_hra,
            v_da,
            v_medical,
            v_conveyance,
            v_special,
            v_other_allow,
            v_gross,
            COALESCE((p_data->>'pf_applicable')::BOOLEAN, TRUE),
            v_pf,
            COALESCE((p_data->>'esi_applicable')::BOOLEAN, FALSE),
            v_esi,
            v_pt,
            v_it,
            v_other_ded,
            v_total_ded,
            v_net,
            NULLIF(TRIM(p_data->>'bank_name'), ''),
            NULLIF(TRIM(p_data->>'account_holder_name'), ''),
            NULLIF(TRIM(p_data->>'account_number'), ''),
            NULLIF(TRIM(p_data->>'ifsc_code'), ''),
            NULLIF(TRIM(p_data->>'branch_name'), ''),
            NULLIF(TRIM(p_data->>'upi_id'), ''),
            COALESCE(NULLIF(TRIM(p_data->>'payment_mode'), ''), 'Bank Transfer'),
            COALESCE(NULLIF(p_data->>'salary_effective_from', '')::DATE, v_joining_date),
            p_user_id,
            p_user_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher record created successfully.',
            'data', jsonb_build_object(
                'teacher_id', v_teacher_id,
                'teacher_code', v_teacher_code,
                'full_name', v_full_name,
                'email', LOWER(TRIM(p_data->>'email')),
                'status', v_status
            )
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 2: UPDATE TEACHER
    -- =========================================================================
    IF p_action = 'UPDATE' THEN
        v_teacher_id := p_id;

        -- Fetch existing teacher_details for resilient fallback
        SELECT 
            first_name, middle_name, last_name, full_name, email
        INTO 
            v_first_name, v_middle_name, v_last_name, v_full_name
        FROM school.teacher_details
        WHERE teacher_id = v_teacher_id AND org_id = p_org_id AND is_deleted = FALSE;

        IF NOT FOUND THEN
            p_response := jsonb_build_object(
                'success', FALSE,
                'error_code', 'ERR_RECORD_NOT_FOUND',
                'message', 'Teacher record not found for update.',
                'timestamp', CURRENT_TIMESTAMP
            );
            RETURN;
        END IF;

        IF p_data ? 'first_name' AND TRIM(p_data->>'first_name') <> '' THEN
            v_first_name := TRIM(p_data->>'first_name');
        END IF;

        IF p_data ? 'middle_name' THEN
            v_middle_name := NULLIF(TRIM(p_data->>'middle_name'), '');
        END IF;

        IF p_data ? 'last_name' AND TRIM(p_data->>'last_name') <> '' THEN
            v_last_name := TRIM(p_data->>'last_name');
        END IF;

        v_full_name := v_first_name || COALESCE(' ' || v_middle_name, '') || ' ' || v_last_name;

        IF p_data->>'date_of_birth' IS NOT NULL AND p_data->>'date_of_birth' <> '' THEN
            v_dob := (p_data->>'date_of_birth')::DATE;
        ELSIF p_data->>'dob' IS NOT NULL AND p_data->>'dob' <> '' THEN
            v_dob := (p_data->>'dob')::DATE;
        END IF;

        -- 1. Update teacher_details
        UPDATE school.teacher_details
        SET
            first_name                     = v_first_name,
            middle_name                    = v_middle_name,
            last_name                      = v_last_name,
            full_name                      = v_full_name,
            gender                         = COALESCE(NULLIF(TRIM(p_data->>'gender'), ''), gender),
            date_of_birth                  = COALESCE(v_dob, date_of_birth),
            marital_status                 = CASE WHEN p_data ? 'marital_status' THEN NULLIF(TRIM(p_data->>'marital_status'), '') ELSE marital_status END,
            email                          = COALESCE(NULLIF(LOWER(TRIM(p_data->>'email')), ''), email),
            phone                          = COALESCE(NULLIF(TRIM(p_data->>'phone'), ''), phone),
            address_line_1                 = CASE WHEN p_data ? 'address_line_1' THEN NULLIF(TRIM(p_data->>'address_line_1'), '') ELSE address_line_1 END,
            address_line_2                 = CASE WHEN p_data ? 'address_line_2' THEN NULLIF(TRIM(p_data->>'address_line_2'), '') ELSE address_line_2 END,
            city                           = CASE WHEN p_data ? 'city' THEN NULLIF(TRIM(p_data->>'city'), '') ELSE city END,
            state                          = CASE WHEN p_data ? 'state' THEN NULLIF(TRIM(p_data->>'state'), '') ELSE state END,
            country                        = CASE WHEN p_data ? 'country' THEN COALESCE(NULLIF(TRIM(p_data->>'country'), ''), 'India') ELSE country END,
            postal_code                    = CASE WHEN p_data ? 'postal_code' THEN NULLIF(TRIM(p_data->>'postal_code'), '') ELSE postal_code END,
            emergency_contact_name         = CASE WHEN p_data ? 'emergency_contact_name' THEN NULLIF(TRIM(p_data->>'emergency_contact_name'), '') ELSE emergency_contact_name END,
            emergency_contact_phone        = CASE WHEN p_data ? 'emergency_contact_phone' THEN NULLIF(TRIM(p_data->>'emergency_contact_phone'), '') ELSE emergency_contact_phone END,
            emergency_contact_relationship = CASE WHEN p_data ? 'emergency_contact_relationship' THEN NULLIF(TRIM(p_data->>'emergency_contact_relationship'), '') ELSE emergency_contact_relationship END,
            qualification                  = CASE WHEN p_data ? 'qualification' THEN NULLIF(TRIM(p_data->>'qualification'), '') ELSE qualification END,
            specialization                 = CASE WHEN p_data ? 'specialization' THEN NULLIF(TRIM(p_data->>'specialization'), '') ELSE specialization END,
            experience_years               = CASE WHEN p_data ? 'experience_years' THEN COALESCE((p_data->>'experience_years')::NUMERIC, experience_years) ELSE experience_years END,
            primary_subject                = CASE WHEN p_data ? 'primary_subject' THEN NULLIF(TRIM(p_data->>'primary_subject'), '') ELSE primary_subject END,
            secondary_subject              = CASE WHEN p_data ? 'secondary_subject' THEN NULLIF(TRIM(p_data->>'secondary_subject'), '') ELSE secondary_subject END,
            languages_known                = CASE WHEN p_data ? 'languages_known' THEN NULLIF(TRIM(p_data->>'languages_known'), '') ELSE languages_known END,
            cognito_user_id                = CASE WHEN p_data ? 'cognito_user_id' THEN COALESCE(NULLIF(TRIM(p_data->>'cognito_user_id'), ''), cognito_user_id) ELSE cognito_user_id END,
            login_enabled                  = CASE WHEN p_data ? 'login_enabled' THEN COALESCE((p_data->>'login_enabled')::BOOLEAN, login_enabled) ELSE login_enabled END,
            role                           = CASE WHEN p_data ? 'role' OR p_data ? 'user_type' THEN (CASE WHEN UPPER(TRIM(COALESCE(p_data->>'role', p_data->>'user_type'))) = 'ADMIN' THEN 'ADMIN' ELSE 'TEACHER' END) ELSE role END,
            user_type                      = CASE WHEN p_data ? 'user_type' OR p_data ? 'role' THEN (CASE WHEN UPPER(TRIM(COALESCE(p_data->>'user_type', p_data->>'role'))) = 'ADMIN' THEN 'ADMIN' ELSE 'TEACHER' END) ELSE user_type END,
            status                         = CASE WHEN p_data ? 'status' THEN COALESCE(NULLIF(TRIM(p_data->>'status'), ''), status) ELSE status END,
            total_leaves                   = CASE WHEN p_data ? 'total_leaves' THEN COALESCE((p_data->>'total_leaves')::INT, total_leaves) ELSE total_leaves END,
            updated_by                     = p_user_id,
            updated_at                     = CURRENT_TIMESTAMP
        WHERE teacher_id = v_teacher_id AND org_id = p_org_id;

        -- 2. Upsert / Update teacher_employment
        IF EXISTS (SELECT 1 FROM school.teacher_employment WHERE teacher_id = v_teacher_id AND org_id = p_org_id) THEN
            UPDATE school.teacher_employment
            SET
                employee_number           = CASE WHEN p_data ? 'employee_number' THEN COALESCE(NULLIF(TRIM(p_data->>'employee_number'), ''), employee_number) ELSE employee_number END,
                department                = CASE WHEN p_data ? 'department' THEN COALESCE(NULLIF(TRIM(p_data->>'department'), ''), department) ELSE department END,
                designation               = CASE WHEN p_data ? 'designation' THEN COALESCE(NULLIF(TRIM(p_data->>'designation'), ''), designation) ELSE designation END,
                employment_type           = CASE WHEN p_data ? 'employment_type' THEN COALESCE(NULLIF(TRIM(p_data->>'employment_type'), ''), employment_type) ELSE employment_type END,
                employment_status         = CASE WHEN p_data ? 'employment_status' THEN COALESCE(NULLIF(TRIM(p_data->>'employment_status'), ''), employment_status) ELSE employment_status END,
                joining_date              = CASE WHEN p_data ? 'joining_date' THEN COALESCE(NULLIF(p_data->>'joining_date', '')::DATE, joining_date) ELSE joining_date END,
                confirmation_date         = CASE WHEN p_data ? 'confirmation_date' THEN NULLIF(p_data->>'confirmation_date', '')::DATE ELSE confirmation_date END,
                reporting_manager         = CASE WHEN p_data ? 'reporting_manager' THEN NULLIF(TRIM(p_data->>'reporting_manager'), '') ELSE reporting_manager END,
                class_teacher_of          = CASE WHEN p_data ? 'class_teacher_of' THEN NULLIF(TRIM(p_data->>'class_teacher_of'), '') ELSE class_teacher_of END,
                house_assigned            = CASE WHEN p_data ? 'house_assigned' THEN NULLIF(TRIM(p_data->>'house_assigned'), '') ELSE house_assigned END,
                previous_school_name      = CASE WHEN p_data ? 'previous_school_name' THEN NULLIF(TRIM(p_data->>'previous_school_name'), '') ELSE previous_school_name END,
                previous_designation      = CASE WHEN p_data ? 'previous_designation' THEN NULLIF(TRIM(p_data->>'previous_designation'), '') ELSE previous_designation END,
                previous_experience_years = CASE WHEN p_data ? 'previous_experience_years' THEN COALESCE((p_data->>'previous_experience_years')::NUMERIC, previous_experience_years) ELSE previous_experience_years END,
                total_experience_years    = CASE WHEN p_data ? 'total_experience_years' THEN COALESCE((p_data->>'total_experience_years')::NUMERIC, total_experience_years) ELSE total_experience_years END,
                work_location             = CASE WHEN p_data ? 'work_location' THEN NULLIF(TRIM(p_data->>'work_location'), '') ELSE work_location END,
                shift_name                = CASE WHEN p_data ? 'shift_name' THEN COALESCE(NULLIF(TRIM(p_data->>'shift_name'), ''), shift_name) ELSE shift_name END,
                last_working_date         = CASE WHEN p_data ? 'last_working_date' THEN NULLIF(p_data->>'last_working_date', '')::DATE ELSE last_working_date END,
                exit_reason               = CASE WHEN p_data ? 'exit_reason' THEN NULLIF(TRIM(p_data->>'exit_reason'), '') ELSE exit_reason END,
                remarks                   = CASE WHEN p_data ? 'remarks' THEN NULLIF(TRIM(p_data->>'remarks'), '') ELSE remarks END,
                updated_by                = p_user_id,
                updated_at                = CURRENT_TIMESTAMP
            WHERE teacher_id = v_teacher_id AND org_id = p_org_id;
        ELSE
            INSERT INTO school.teacher_employment (
                org_id, teacher_id, employee_number, department, designation, employment_type,
                employment_status, joining_date, reporting_manager, created_by, updated_by
            ) VALUES (
                p_org_id, v_teacher_id,
                COALESCE(NULLIF(TRIM(p_data->>'employee_number'), ''), 'EMP-' || v_teacher_id::TEXT),
                COALESCE(NULLIF(TRIM(p_data->>'department'), ''), 'General'),
                COALESCE(NULLIF(TRIM(p_data->>'designation'), ''), 'Teacher'),
                COALESCE(NULLIF(TRIM(p_data->>'employment_type'), ''), 'Full-Time'),
                COALESCE(NULLIF(TRIM(p_data->>'employment_status'), ''), 'Permanent'),
                COALESCE(NULLIF(p_data->>'joining_date', '')::DATE, CURRENT_DATE),
                NULLIF(TRIM(p_data->>'reporting_manager'), ''),
                p_user_id, p_user_id
            );
        END IF;

        -- 3. Calculate & Update payroll
        v_basic_salary := COALESCE((p_data->>'basic_salary')::NUMERIC, 0);
        v_hra          := COALESCE((p_data->>'hra_amount')::NUMERIC, 0);
        v_da           := COALESCE((p_data->>'da_amount')::NUMERIC, 0);
        v_medical      := COALESCE((p_data->>'medical_allowance')::NUMERIC, 0);
        v_conveyance   := COALESCE((p_data->>'conveyance_allowance')::NUMERIC, 0);
        v_special      := COALESCE((p_data->>'special_allowance')::NUMERIC, 0);
        v_other_allow  := COALESCE((p_data->>'other_allowance')::NUMERIC, 0);
        v_gross        := COALESCE((p_data->>'gross_salary')::NUMERIC, v_basic_salary + v_hra + v_da + v_medical + v_conveyance + v_special + v_other_allow);

        v_pf           := COALESCE((p_data->>'pf_amount')::NUMERIC, 0);
        v_esi          := COALESCE((p_data->>'esi_amount')::NUMERIC, 0);
        v_pt           := COALESCE((p_data->>'professional_tax')::NUMERIC, 0);
        v_it           := COALESCE((p_data->>'income_tax')::NUMERIC, 0);
        v_other_ded    := COALESCE((p_data->>'other_deductions')::NUMERIC, 0);
        v_total_ded    := COALESCE((p_data->>'total_deductions')::NUMERIC, v_pf + v_esi + v_pt + v_it + v_other_ded);
        v_net          := COALESCE((p_data->>'net_salary')::NUMERIC, v_gross - v_total_ded);

        IF EXISTS (SELECT 1 FROM school.teacher_payroll WHERE teacher_id = v_teacher_id AND org_id = p_org_id) THEN
            UPDATE school.teacher_payroll
            SET
                salary_structure      = CASE WHEN p_data ? 'salary_structure' THEN COALESCE(NULLIF(TRIM(p_data->>'salary_structure'), ''), salary_structure) ELSE salary_structure END,
                basic_salary          = CASE WHEN p_data ? 'basic_salary' THEN v_basic_salary ELSE basic_salary END,
                hra_amount            = CASE WHEN p_data ? 'hra_amount' THEN v_hra ELSE hra_amount END,
                da_amount             = CASE WHEN p_data ? 'da_amount' THEN v_da ELSE da_amount END,
                medical_allowance     = CASE WHEN p_data ? 'medical_allowance' THEN v_medical ELSE medical_allowance END,
                conveyance_allowance  = CASE WHEN p_data ? 'conveyance_allowance' THEN v_conveyance ELSE conveyance_allowance END,
                special_allowance     = CASE WHEN p_data ? 'special_allowance' THEN v_special ELSE special_allowance END,
                other_allowance       = CASE WHEN p_data ? 'other_allowance' THEN v_other_allow ELSE other_allowance END,
                gross_salary          = CASE WHEN p_data ? 'gross_salary' OR p_data ? 'basic_salary' THEN v_gross ELSE gross_salary END,
                pf_applicable         = CASE WHEN p_data ? 'pf_applicable' THEN COALESCE((p_data->>'pf_applicable')::BOOLEAN, pf_applicable) ELSE pf_applicable END,
                pf_amount             = CASE WHEN p_data ? 'pf_amount' THEN v_pf ELSE pf_amount END,
                esi_applicable        = CASE WHEN p_data ? 'esi_applicable' THEN COALESCE((p_data->>'esi_applicable')::BOOLEAN, esi_applicable) ELSE esi_applicable END,
                esi_amount            = CASE WHEN p_data ? 'esi_amount' THEN v_esi ELSE esi_amount END,
                professional_tax      = CASE WHEN p_data ? 'professional_tax' THEN v_pt ELSE professional_tax END,
                income_tax            = CASE WHEN p_data ? 'income_tax' THEN v_it ELSE income_tax END,
                other_deductions      = CASE WHEN p_data ? 'other_deductions' THEN v_other_ded ELSE other_deductions END,
                total_deductions      = CASE WHEN p_data ? 'total_deductions' OR p_data ? 'pf_amount' THEN v_total_ded ELSE total_deductions END,
                net_salary            = CASE WHEN p_data ? 'net_salary' OR p_data ? 'basic_salary' THEN v_net ELSE net_salary END,
                bank_name             = CASE WHEN p_data ? 'bank_name' THEN NULLIF(TRIM(p_data->>'bank_name'), '') ELSE bank_name END,
                account_holder_name   = CASE WHEN p_data ? 'account_holder_name' THEN NULLIF(TRIM(p_data->>'account_holder_name'), '') ELSE account_holder_name END,
                account_number        = CASE WHEN p_data ? 'account_number' THEN NULLIF(TRIM(p_data->>'account_number'), '') ELSE account_number END,
                ifsc_code             = CASE WHEN p_data ? 'ifsc_code' THEN NULLIF(TRIM(p_data->>'ifsc_code'), '') ELSE ifsc_code END,
                branch_name           = CASE WHEN p_data ? 'branch_name' THEN NULLIF(TRIM(p_data->>'branch_name'), '') ELSE branch_name END,
                upi_id                = CASE WHEN p_data ? 'upi_id' THEN NULLIF(TRIM(p_data->>'upi_id'), '') ELSE upi_id END,
                payment_mode          = CASE WHEN p_data ? 'payment_mode' THEN COALESCE(NULLIF(TRIM(p_data->>'payment_mode'), ''), payment_mode) ELSE payment_mode END,
                salary_effective_from = CASE WHEN p_data ? 'salary_effective_from' THEN COALESCE(NULLIF(p_data->>'salary_effective_from', '')::DATE, salary_effective_from) ELSE salary_effective_from END,
                updated_by            = p_user_id,
                updated_at            = CURRENT_TIMESTAMP
            WHERE teacher_id = v_teacher_id AND org_id = p_org_id;
        ELSE
            INSERT INTO school.teacher_payroll (
                org_id, teacher_id, salary_structure, basic_salary, gross_salary, net_salary,
                bank_name, account_number, ifsc_code, created_by, updated_by
            ) VALUES (
                p_org_id, v_teacher_id, 'Standard', v_basic_salary, v_gross, v_net,
                NULLIF(TRIM(p_data->>'bank_name'), ''), NULLIF(TRIM(p_data->>'account_number'), ''),
                NULLIF(TRIM(p_data->>'ifsc_code'), ''), p_user_id, p_user_id
            );
        END IF;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher record updated successfully.',
            'data', jsonb_build_object(
                'teacher_id', v_teacher_id,
                'full_name', v_full_name,
                'email', LOWER(TRIM(COALESCE(p_data->>'email', v_first_name)))
            )
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 3: DELETE TEACHER (SOFT DELETE)
    -- =========================================================================
    IF p_action = 'DELETE' THEN
        v_teacher_id := p_id;

        UPDATE school.teacher_details
        SET
            is_deleted = TRUE,
            is_active  = FALSE,
            status     = 'Inactive',
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE teacher_id = v_teacher_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher record deleted successfully.',
            'data', jsonb_build_object('teacher_id', v_teacher_id)
        );
        RETURN;
    END IF;

    -- =========================================================================
    -- ACTION 4: STATUS UPDATE
    -- =========================================================================
    IF p_action = 'STATUS_UPDATE' THEN
        v_teacher_id := p_id;
        v_status     := TRIM(COALESCE(p_data->>'status', p_data->>'teacher_status'));

        UPDATE school.teacher_details
        SET
            status     = v_status,
            is_active  = (UPPER(v_status) = 'ACTIVE'),
            updated_by = p_user_id,
            updated_at = CURRENT_TIMESTAMP
        WHERE teacher_id = v_teacher_id AND org_id = p_org_id;

        p_response := jsonb_build_object(
            'success', TRUE,
            'message', 'Teacher status updated successfully.',
            'data', jsonb_build_object(
                'teacher_id', v_teacher_id,
                'status', v_status
            )
        );
        RETURN;
    END IF;

END;
$BODY$;

COMMENT ON PROCEDURE school.sp_save_teacher(VARCHAR, BIGINT, BIGINT, JSONB, BIGINT, OUT JSONB) IS 
'Transactional procedure supporting CREATE, UPDATE, DELETE, and STATUS_UPDATE for teacher master and linked records.';
