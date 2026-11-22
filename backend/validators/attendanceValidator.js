/**
 * File: backend/validators/attendanceValidator.js
 * Description: Input validation and multi-tenant integrity rules for Attendance & Holiday operations.
 */

'use strict';

const VALID_HOLIDAY_TYPES = ['NATIONAL', 'FESTIVAL', 'SCHOOL', 'LOCAL', 'EMERGENCY'];
const VALID_HEADER_STATUSES = ['DRAFT', 'SUBMITTED'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates multi-tenant org_id matching between request header and payload.
 */
function validateTenantScoping(orgId, headerOrgId) {
    const errors = [];
    const numOrgId = Number(orgId);
    const numHeaderOrgId = Number(headerOrgId);

    if (!numOrgId || numOrgId <= 0) {
        errors.push('Organization ID (org_id) is mandatory and must be greater than 0.');
    }

    if (numHeaderOrgId && numOrgId && numHeaderOrgId !== numOrgId) {
        errors.push(`Multi-tenant violation: Header org_id (${numHeaderOrgId}) does not match payload org_id (${numOrgId}).`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates payload for Save Attendance (recording daily class attendance & exceptions).
 */
function validateSaveAttendance(payload, headers) {
    const errors = [];
    const orgId = Number(payload.org_id || headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);
    const headerOrgId = Number(headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);

    const tenantCheck = validateTenantScoping(orgId, headerOrgId);
    if (!tenantCheck.isValid) {
        errors.push(...tenantCheck.errors);
    }

    const academicId = Number(payload.academic_id || payload.academic_year_id || 0);
    if (!academicId || academicId <= 0) {
        errors.push('academic_id (or academic_year_id) is required and must be valid.');
    }

    if (!payload.class_id || Number(payload.class_id) <= 0) {
        errors.push('class_id is required and must be valid.');
    }

    if (!payload.attendance_date || !DATE_REGEX.test(String(payload.attendance_date).trim())) {
        errors.push('attendance_date is required in YYYY-MM-DD format.');
    }

    if (payload.status && !VALID_HEADER_STATUSES.includes(String(payload.status).toUpperCase())) {
        errors.push(`status must be one of: ${VALID_HEADER_STATUSES.join(', ')}.`);
    }

    // Exceptions array validation
    if (payload.exceptions !== undefined) {
        if (!Array.isArray(payload.exceptions)) {
            errors.push('exceptions must be an array of student exception objects.');
        } else {
            const seenStudentIds = new Set();

            payload.exceptions.forEach((exc, index) => {
                const studentId = Number(exc.student_id);
                if (!studentId || studentId <= 0) {
                    errors.push(`exceptions[${index}].student_id is required and must be a valid positive number.`);
                } else {
                    if (seenStudentIds.has(studentId)) {
                        errors.push(`Duplicate student exception detected for student_id ${studentId}.`);
                    }
                    seenStudentIds.add(studentId);
                }

                const statusCode = String(exc.status_code || exc.status || '').toUpperCase().trim();
                if (statusCode !== 'ABSENT' && statusCode !== 'LEAVE') {
                    errors.push(`exceptions[${index}].status_code must be ABSENT or LEAVE. PRESENT is dynamically calculated and must never be submitted as an exception.`);
                }
            });
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates payload for Create / Update Holiday.
 */
function validateHoliday(payload, headers) {
    const errors = [];
    const orgId = Number(payload.org_id || headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);
    const headerOrgId = Number(headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);

    const tenantCheck = validateTenantScoping(orgId, headerOrgId);
    if (!tenantCheck.isValid) {
        errors.push(...tenantCheck.errors);
    }

    const academicId = Number(payload.academic_id || payload.academic_year_id || 0);
    if (!academicId || academicId <= 0) {
        errors.push('academic_id (or academic_year_id) is required.');
    }

    if (!payload.holiday_name || String(payload.holiday_name).trim() === '') {
        errors.push('holiday_name is required.');
    }

    if (!payload.holiday_date || !DATE_REGEX.test(String(payload.holiday_date).trim())) {
        errors.push('holiday_date is required in YYYY-MM-DD format.');
    }

    if (payload.holiday_type) {
        const type = String(payload.holiday_type).toUpperCase().trim();
        if (!VALID_HOLIDAY_TYPES.includes(type)) {
            errors.push(`holiday_type must be one of: ${VALID_HOLIDAY_TYPES.join(', ')}.`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates query parameters for attendance queries and reports.
 */
function validateAttendanceQuery(params, headers) {
    const errors = [];
    const orgId = Number(params?.org_id || headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);
    const headerOrgId = Number(headers?.['org_id'] || headers?.['x-org-id'] || headers?.['Org_Id'] || 0);

    const tenantCheck = validateTenantScoping(orgId, headerOrgId);
    if (!tenantCheck.isValid) {
        errors.push(...tenantCheck.errors);
    }

    if (params?.start_date && !DATE_REGEX.test(String(params.start_date).trim())) {
        errors.push('start_date must be in YYYY-MM-DD format.');
    }

    if (params?.end_date && !DATE_REGEX.test(String(params.end_date).trim())) {
        errors.push('end_date must be in YYYY-MM-DD format.');
    }

    if (params?.attendance_date && !DATE_REGEX.test(String(params.attendance_date).trim())) {
        errors.push('attendance_date must be in YYYY-MM-DD format.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

const attendanceValidator = {
    validateTenantScoping,
    validateSaveAttendance,
    validateHoliday,
    validateAttendanceQuery
};

module.exports = {
    validateTenantScoping,
    validateSaveAttendance,
    validateHoliday,
    validateAttendanceQuery,
    attendanceValidator
};


