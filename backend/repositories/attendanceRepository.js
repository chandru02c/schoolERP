/**
 * File: backend/repositories/attendanceRepository.js
 * Description: Data Access & Repository Layer for Attendance, Holiday, and Report operations.
 * Calls PostgreSQL schema 'school' procedures and query functions with strict org_id multi-tenancy.
 */

const { getPool } = require('../common/dbPool');

class AttendanceRepository {
    constructor(dbClient = null) {
        this.customDb = dbClient;
    }

    _getDb() {
        return this.customDb || getPool();
    }

    /**
     * Generic invocation of school.sp_manage_attendance.
     */
    async executeManageProcedure(action, orgId, payload, userId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `CALL school.sp_manage_attendance($1::VARCHAR, $2::BIGINT, $3::JSONB, $4::BIGINT, NULL);`;
            const values = [action, orgId, JSON.stringify(payload || {}), userId || 0];

            const res = await client.query(queryText, values);
            await client.query('COMMIT');

            const rawResponse = res.rows?.[0]?.p_result;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : (rawResponse || { success: true });
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(`[AttendanceRepository.executeManageProcedure] Error (${action}):`, err);
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Generic invocation of school.fn_get_attendance.
     */
    async queryAttendanceFunction(action, orgId, params) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            await client.query('SET LOCAL app.current_org_id = $1', [String(orgId)]);

            const queryText = `SELECT school.fn_get_attendance($1::VARCHAR, $2::BIGINT, $3::JSONB) AS result;`;
            const values = [action, orgId, JSON.stringify(params || {})];

            const res = await client.query(queryText, values);
            const rawResponse = res.rows?.[0]?.result;
            return typeof rawResponse === 'string' ? JSON.parse(rawResponse) : (rawResponse || { success: false, message: 'Empty response' });
        } catch (err) {
            console.error(`[AttendanceRepository.queryAttendanceFunction] Error (${action}):`, err);
            throw err;
        } finally {
            client.release();
        }
    }

    // =========================================================================
    // HOLIDAY REPOSITORY METHODS
    // =========================================================================

    async createHoliday(orgId, data, userId) {
        return await this.executeManageProcedure('CREATE_HOLIDAY', orgId, data, userId);
    }

    async updateHoliday(holidayId, orgId, data, userId) {
        return await this.executeManageProcedure('UPDATE_HOLIDAY', orgId, { ...data, holiday_id: holidayId }, userId);
    }

    async deleteHoliday(holidayId, orgId, userId) {
        return await this.executeManageProcedure('DELETE_HOLIDAY', orgId, { holiday_id: holidayId }, userId);
    }

    async getHoliday(holidayId, orgId) {
        return await this.queryAttendanceFunction('GET_HOLIDAY', orgId, { holiday_id: holidayId });
    }

    async listHolidays(orgId, academicId) {
        return await this.queryAttendanceFunction('GET_HOLIDAYS', orgId, { academic_id: academicId });
    }

    // =========================================================================
    // ATTENDANCE REPOSITORY METHODS
    // =========================================================================

    async createAttendanceHeader(orgId, data, userId) {
        return await this.executeManageProcedure('SAVE_ATTENDANCE', orgId, data, userId);
    }

    async updateAttendanceHeader(attendanceId, orgId, data, userId) {
        return await this.executeManageProcedure('SAVE_ATTENDANCE', orgId, { ...data, header_id: attendanceId }, userId);
    }

    async getAttendanceHeader(attendanceId, orgId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            const queryText = `
                SELECT h.*, t.full_name AS teacher_name, c.class_name, s.section_name
                FROM school.attendance_header h
                LEFT JOIN school.teacher_details t ON t.teacher_id = h.teacher_id AND t.org_id = h.org_id
                LEFT JOIN school.class_master c ON c.class_id = h.class_id AND c.org_id = h.org_id
                LEFT JOIN school.class_section s ON (s.class_section_id = h.section_id OR s.section_name = h.section_id::TEXT) AND s.org_id = h.org_id
                WHERE h.id = $1 AND h.org_id = $2 AND h.is_deleted = FALSE;
            `;
            const res = await client.query(queryText, [attendanceId, orgId]);
            return res.rows?.[0] || null;
        } finally {
            client.release();
        }
    }

    async saveAttendanceDetails(attendanceId, orgId, exceptions, userId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Delete existing
            await client.query(
                `DELETE FROM school.attendance_details WHERE attendance_header_id = $1 AND org_id = $2`,
                [attendanceId, orgId]
            );

            for (const item of (exceptions || [])) {
                const statusCode = String(item.status_code || item.status || '').toUpperCase();
                const statusId = statusCode === 'ABSENT' ? 2 : statusCode === 'LEAVE' ? 3 : null;
                if (statusId) {
                    await client.query(
                        `INSERT INTO school.attendance_details (
                            org_id, attendance_header_id, student_id, status_id, remarks, created_by, updated_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $6)`,
                        [orgId, attendanceId, item.student_id, statusId, item.remarks || null, userId || 1]
                    );
                }
            }
            await client.query('COMMIT');
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async deleteAttendanceDetails(attendanceId, orgId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            await client.query(
                `DELETE FROM school.attendance_details WHERE attendance_header_id = $1 AND org_id = $2`,
                [attendanceId, orgId]
            );
            return { success: true };
        } finally {
            client.release();
        }
    }

    async getAttendanceDetails(attendanceId, orgId) {
        const pool = this._getDb();
        const client = await pool.connect();
        try {
            const queryText = `
                SELECT d.*, m.status_code, m.status_name, a.student_first_name, a.student_last_name,
                       CONCAT_WS(' ', a.student_first_name, NULLIF(a.student_middle_name, ''), a.student_last_name) AS student_name,
                       s.roll_no, a.application_no AS admission_no
                FROM school.attendance_details d
                JOIN school.attendance_status_master m ON m.id = d.status_id
                JOIN school.student_master s ON s.student_id = d.student_id AND s.org_id = d.org_id
                JOIN school.admission_application a ON a.id = s.admission_id AND a.org_id = s.org_id
                WHERE d.attendance_header_id = $1 AND d.org_id = $2 AND d.is_deleted = FALSE;
            `;
            const res = await client.query(queryText, [attendanceId, orgId]);
            return res.rows || [];
        } finally {
            client.release();
        }
    }

    async getAttendanceHistory(orgId, filters) {
        return await this.queryAttendanceFunction('GET_HISTORY', orgId, filters);
    }

    async getDailySheet(orgId, filters) {
        return await this.queryAttendanceFunction('GET_DAILY_SHEET', orgId, filters);
    }

    // =========================================================================
    // REPORTS REPOSITORY METHODS
    // =========================================================================

    async getStudentAttendanceReport(orgId, filters) {
        return await this.queryAttendanceFunction('GET_STUDENT_REPORT', orgId, filters);
    }

    async getClassAttendanceReport(orgId, filters) {
        return await this.queryAttendanceFunction('GET_CLASS_REPORT', orgId, filters);
    }

    async getAttendanceSummary(orgId, filters) {
        return await this.queryAttendanceFunction('GET_SUMMARY', orgId, filters);
    }

    async getDashboardMetrics(orgId) {
        return await this.queryAttendanceFunction('GET_DASHBOARD_METRICS', orgId, {});
    }
}

const defaultInstance = new AttendanceRepository();

module.exports = defaultInstance;
module.exports.AttendanceRepository = AttendanceRepository;
module.exports.attendanceRepository = defaultInstance;
