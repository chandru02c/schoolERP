/**
 * File: index.mjs
 * Lambda: school_calendar
 * Runtime: Node.js 22.x — ES Modules
 * Description: School Calendar API — retrieves holidays, exams, events, and academy schedules.
 *
 * Input:
 *   - org_id (required)
 *   - academy_id (optional, defaults to active academy)
 */

import { dbExecute } from './db.mjs';
import { validateOrg, extractOrgId, getActiveAcademicYear, createStandardErrorResponse } from './orgValidator.mjs';

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, org_id, Org_Id, ORG_ID, x-user-id, X-User-Id, Accept, Origin, X-Requested-With'
};

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
                    data: { events: [] },
                    timestamp: new Date().toISOString()
                })
            };
        }

        const academicYearId = Number(queryParams.academy_id || queryParams.academic_year_id || activeYear.academic_year_id);
        const eventsList = [];

        // 1. Fetch holidays from holiday_master for org and active academic year
        const holidayRows = await dbExecute(
            `SELECT id, holiday_name, holiday_type, holiday_date, description
             FROM school.holiday_master
             WHERE org_id = $1 AND academic_id = $2 AND is_deleted = FALSE AND is_active = TRUE
             ORDER BY holiday_date ASC;`,
            [orgId, academicYearId]
        );

        if (holidayRows && holidayRows.length > 0) {
            holidayRows.forEach((h) => {
                const dateStr = typeof h.holiday_date === 'string'
                    ? h.holiday_date.split('T')[0]
                    : new Date(h.holiday_date).toISOString().split('T')[0];
                eventsList.push({
                    id: `hol-${h.id}`,
                    title: h.holiday_name,
                    date: dateStr,
                    type: 'holiday',
                    description: h.description || `${h.holiday_type || 'School'} Holiday`,
                    time: 'All Day',
                    location: 'Campus Wide'
                });
            });
        }

        // 2. Fetch academic calendar events for org and active academic year
        const calRows = await dbExecute(
            `SELECT calendar_id, title, event_type, start_date, end_date, description, is_holiday
             FROM school.academic_calendar
             WHERE org_id = $1 AND academic_year_id = $2 AND is_deleted = FALSE
             ORDER BY start_date ASC;`,
            [orgId, academicYearId]
        );

        if (calRows && calRows.length > 0) {
            calRows.forEach((c) => {
                const dateStr = typeof c.start_date === 'string'
                    ? c.start_date.split('T')[0]
                    : new Date(c.start_date).toISOString().split('T')[0];

                let evType = 'event';
                const rawType = (c.event_type || '').toUpperCase();
                if (c.is_holiday || rawType === 'HOLIDAY') evType = 'holiday';
                else if (rawType === 'EXAM') evType = 'exam';
                else if (rawType === 'PTM') evType = 'meeting';

                eventsList.push({
                    id: `cal-${c.calendar_id}`,
                    title: c.title,
                    date: dateStr,
                    type: evType,
                    description: c.description || c.title,
                    time: '09:00 AM - 04:00 PM',
                    location: 'Main Campus'
                });
            });
        }

        // Sort events by date ascending
        eventsList.sort((a, b) => a.date.localeCompare(b.date));

        return respond(200, true, 'Calendar events retrieved successfully.', {
            academic_year_id: academicYearId,
            events: eventsList
        });

    } catch (err) {
        console.error('[school_calendar] Error:', err);
        return respond(500, false, 'Internal server error while fetching calendar events.', null, { details: err.message });
    }
};
