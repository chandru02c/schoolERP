/**
 * File: index.mjs
 * Lambda: school_teacher_timetable
 * Runtime: Node.js 22.x — ES Modules
 * Description: Teacher Timetable & Today Schedule API for School ERP Mobile.
 *
 * Requirements:
 * - Fetch timetable based on: org_id, academy_id, teacher_id, selected class (if applicable)
 * - Returns timetable periods accurately formatted for the mobile timetable and home schedule.
 */

import { dbExecute } from './db.mjs';
import {
    validateOrg,
    extractOrgId,
    getActiveAcademicYear,
    validateTeacherClassAssignment,
    createStandardErrorResponse
} from './orgValidator.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SLOTS = [
    { periodNumber: 1, time: '09:00 AM - 09:45 AM', color: '#FF6B35' },
    { periodNumber: 2, time: '09:50 AM - 10:35 AM', color: '#3B82F6' },
    { periodNumber: 3, time: '10:50 AM - 11:35 AM', color: '#10B981' },
    { periodNumber: 4, time: '11:40 AM - 12:25 PM', color: '#8B5CF6' },
    { periodNumber: 5, time: '01:15 PM - 02:00 PM', color: '#F59E0B' },
    { periodNumber: 6, time: '02:05 PM - 02:50 PM', color: '#EC4899' },
];

function respond(statusCode, success, message, data = null, error = null) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({
            success,
            message,
            timestamp: new Date().toISOString(),
            ...(data !== null && { data }),
            ...(error !== null && { error })
        })
    };
}

export const handler = async (event) => {
    const method = (event.httpMethod || event.requestContext?.http?.method || 'GET').toUpperCase();
    if (method === 'OPTIONS') return respond(200, true, 'CORS preflight approved.');

    const headers = event.headers || {};
    const queryParams = event.queryStringParameters || {};

    let body = {};
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch {}
    }

    const orgId = extractOrgId(event, body);
    const orgValidation = await validateOrg(dbExecute, orgId);
    if (!orgValidation.valid) {
        return orgValidation.response;
    }

    const teacherId = Number(
        queryParams.teacher_id ||
        queryParams.teacherId ||
        headers['x-user-id'] ||
        headers['X-User-Id'] ||
        0
    );

    const classIdFilter = queryParams.class_id || queryParams.classId || queryParams.academic_set_id || null;
    const requestedDay = queryParams.day || null;
    const isTodayOnly = queryParams.today === 'true' || queryParams.action === 'TODAY_SCHEDULE';

    if (!teacherId && !classIdFilter) {
        return respond(400, false, 'teacher_id or class_id/academic_set_id is required.');
    }

    try {
        const activeYear = await getActiveAcademicYear(dbExecute, orgId);
        if (!activeYear) {
            return {
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    status: false,
                    success: false,
                    message: 'No Active Academic Year Available.',
                    timestamp: new Date().toISOString()
                })
            };
        }

        const academicYearId = Number(queryParams.academy_id || queryParams.academic_year_id || activeYear.academic_year_id);

        let validatedAssignment = null;
        // Verify class assignment if classIdFilter and teacherId are both provided
        if (teacherId && classIdFilter && classIdFilter !== 'all' && classIdFilter !== '') {
            validatedAssignment = await validateTeacherClassAssignment(dbExecute, orgId, academicYearId, teacherId, classIdFilter);
            if (!validatedAssignment) {
                return {
                    statusCode: 403,
                    headers: CORS_HEADERS,
                    body: JSON.stringify({
                        status: false,
                        success: false,
                        message: 'Unauthorized Class Access',
                        timestamp: new Date().toISOString()
                    })
                };
            }
        }

        // Query assignments for teacher or specific class
        let query = `
            SELECT
                a.assignment_id,
                a.academic_set_id,
                a.subject_name,
                a.subject_code,
                a.periods_per_week,
                a.teacher_id,
                COALESCE(td.full_name, TRIM(CONCAT(td.first_name, ' ', td.last_name)), 'Faculty') AS teacher_name,
                s.class_id,
                s.section,
                s.room_number,
                COALESCE(cm.class_name, 'Class ' || s.class_id) AS class_name
            FROM school.subject_teacher_assignment a
            JOIN school.academic_set s ON a.academic_set_id = s.academic_set_id AND a.org_id = s.org_id
            LEFT JOIN school.class_master cm ON s.class_id = cm.class_id AND s.org_id = cm.org_id
            LEFT JOIN school.teacher_details td ON a.teacher_id = td.teacher_id AND a.org_id = td.org_id
            WHERE a.org_id = $1
              AND a.academic_year_id = $2
              AND a.is_deleted = FALSE
              AND a.status = 'ACTIVE'
              AND s.is_deleted = FALSE
              AND s.status = 'ACTIVE'
        `;
        const params = [orgId, academicYearId];

        if (teacherId > 0) {
            query += ` AND a.teacher_id = $${params.length + 1}`;
            params.push(teacherId);
        }

        if (validatedAssignment) {
            query += ` AND (s.academic_set_id = $${params.length + 1} OR s.class_id = $${params.length + 2})`;
            params.push(Number(validatedAssignment.academic_set_id), Number(validatedAssignment.class_id));
        } else if (classIdFilter && classIdFilter !== 'all' && classIdFilter !== '') {
            const cleanClassId = String(classIdFilter).match(/\d+/)?.[0] || String(classIdFilter);
            query += ` AND (s.class_id::TEXT = $${params.length + 1} OR s.academic_set_id::TEXT = $${params.length + 1} OR s.class_id::TEXT = $${params.length + 2} OR s.academic_set_id::TEXT = $${params.length + 2})`;
            params.push(String(classIdFilter), String(cleanClassId));
        }

        const rows = await dbExecute(query, params);

        // Build week timetable
        const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timetableByDay = {};

        workingDays.forEach((dayName, dayIndex) => {
            const dayPeriods = [];
            if (rows && rows.length > 0) {
                // Distribute assigned subjects across slots
                rows.forEach((r, idx) => {
                    const slot = DEFAULT_SLOTS[(idx + dayIndex) % DEFAULT_SLOTS.length];
                    dayPeriods.push({
                        id: `period-${r.academic_set_id}-${slot.periodNumber}-${dayName}`,
                        periodNumber: slot.periodNumber,
                        subject: r.subject_name,
                        subjectCode: r.subject_code,
                        className: `${r.class_name} - ${r.section}`,
                        classId: String(r.class_id),
                        academic_set_id: String(r.academic_set_id),
                        section: r.section,
                        teacherName: r.teacher_name,
                        room: r.room_number || `Room ${100 + Number(r.class_id || 1)}`,
                        time: slot.time,
                        color: slot.color,
                        day: dayName
                    });
                });
            }

            // Sort periods by periodNumber
            dayPeriods.sort((a, b) => a.periodNumber - b.periodNumber);
            timetableByDay[dayName] = dayPeriods;
        });

        const todayName = DAYS_OF_WEEK[new Date().getDay()] || 'Monday';
        const effectiveToday = workingDays.includes(todayName) ? todayName : 'Monday';

        if (!rows || rows.length === 0) {
            return respond(200, true, 'No Records Found.', {
                today: effectiveToday,
                todaySchedule: [],
                weeklyTimetable: timetableByDay
            });
        }

        if (isTodayOnly) {
            return respond(200, true, "Today's schedule retrieved successfully.", {
                day: effectiveToday,
                periods: timetableByDay[effectiveToday] || []
            });
        }

        if (requestedDay && timetableByDay[requestedDay]) {
            return respond(200, true, `${requestedDay} schedule retrieved successfully.`, {
                day: requestedDay,
                periods: timetableByDay[requestedDay]
            });
        }

        return respond(200, true, 'Weekly timetable retrieved successfully.', {
            today: effectiveToday,
            todaySchedule: timetableByDay[effectiveToday] || [],
            weeklyTimetable: timetableByDay
        });

    } catch (err) {
        console.error('[school_teacher_timetable] Error:', err);
        return respond(500, false, 'Internal server error while fetching timetable.', null, { details: err.message });
    }
};
