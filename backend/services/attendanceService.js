/**
 * File: backend/services/attendanceService.js
 * Description: Business Service Layer for Attendance, Holiday, and Report operations.
 * Enforces multi-tenant isolation, exception-based calculations, and input validation.
 */

const attendanceRepository = require('../repositories/attendanceRepository');
const {
    validateTenantScoping,
    validateSaveAttendance,
    validateHoliday,
    validateAttendanceQuery
} = require('../validators/attendanceValidator');

class AttendanceService {
    constructor(repo = null) {
        this.repo = repo || attendanceRepository;
    }

    // =========================================================================
    // ATTENDANCE CORE & EXCEPTION OPERATIONS
    // =========================================================================

    /**
     * Records or updates daily attendance and student exceptions (ABSENT/LEAVE).
     * PRESENT status is dynamically calculated and never persisted.
     */
    async saveAttendance(orgId, payload, userId, headers) {
        const validation = validateSaveAttendance({ ...payload, org_id: orgId }, headers);
        if (!validation.isValid) {
            return {
                success: false,
                statusCode: 400,
                error_code: 'ERR_VALIDATION_FAILED',
                message: validation.errors.join(' ')
            };
        }

        try {
            const result = await this.repo.executeManageProcedure('SAVE_ATTENDANCE', orgId, payload, userId);
            return {
                statusCode: result?.success !== false ? 200 : 400,
                ...result
            };
        } catch (err) {
            console.error('[AttendanceService.saveAttendance] Error:', err);
            return {
                success: false,
                statusCode: 500,
                message: 'Failed to save attendance record.',
                error: err.message
            };
        }
    }

    async createAttendanceHeader(orgId, payload, userId, headers) {
        return await this.saveAttendance(orgId, payload, userId, headers);
    }

    async updateAttendanceHeader(attendanceId, orgId, payload, userId, headers) {
        return await this.saveAttendance(orgId, { ...payload, header_id: attendanceId }, userId, headers);
    }

    async getAttendanceHeader(attendanceId, orgId) {
        if (!attendanceId || !orgId) {
            return { success: false, statusCode: 400, message: 'attendanceId and orgId are required.' };
        }
        try {
            const data = await this.repo.getAttendanceHeader(attendanceId, orgId);
            if (!data) {
                return { success: false, statusCode: 404, message: 'Attendance header not found.' };
            }
            return { success: true, statusCode: 200, data };
        } catch (err) {
            console.error('[AttendanceService.getAttendanceHeader] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getAttendanceDetails(attendanceId, orgId) {
        if (!attendanceId || !orgId) {
            return { success: false, statusCode: 400, message: 'attendanceId and orgId are required.' };
        }
        try {
            const data = await this.repo.getAttendanceDetails(attendanceId, orgId);
            return { success: true, statusCode: 200, data };
        } catch (err) {
            console.error('[AttendanceService.getAttendanceDetails] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async deleteAttendanceDetails(attendanceId, orgId) {
        if (!attendanceId || !orgId) {
            return { success: false, statusCode: 400, message: 'attendanceId and orgId are required.' };
        }
        try {
            const result = await this.repo.deleteAttendanceDetails(attendanceId, orgId);
            return { success: true, statusCode: 200, ...result };
        } catch (err) {
            console.error('[AttendanceService.deleteAttendanceDetails] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getDailySheet(orgId, params, headers) {
        const validation = validateAttendanceQuery({ ...params, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_DAILY_SHEET', orgId, params);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getDailySheet] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getAttendanceHistory(orgId, params, headers) {
        const validation = validateAttendanceQuery({ ...params, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_HISTORY', orgId, params);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getAttendanceHistory] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    // =========================================================================
    // HOLIDAY MANAGEMENT
    // =========================================================================

    async createHoliday(orgId, payload, userId, headers) {
        const validation = validateHoliday({ ...payload, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.executeManageProcedure('CREATE_HOLIDAY', orgId, payload, userId);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.createHoliday] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async updateHoliday(holidayId, orgId, payload, userId, headers) {
        const data = { ...payload, holiday_id: holidayId, org_id: orgId };
        const validation = validateHoliday(data, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.executeManageProcedure('UPDATE_HOLIDAY', orgId, data, userId);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.updateHoliday] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async deleteHoliday(holidayId, orgId, userId) {
        if (!holidayId || !orgId) {
            return { success: false, statusCode: 400, message: 'holiday_id and org_id are required.' };
        }
        try {
            const result = await this.repo.executeManageProcedure('DELETE_HOLIDAY', orgId, { holiday_id: holidayId }, userId);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.deleteHoliday] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getHoliday(holidayId, orgId) {
        if (!holidayId || !orgId) {
            return { success: false, statusCode: 400, message: 'holiday_id and org_id are required.' };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_HOLIDAY', orgId, { holiday_id: holidayId });
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getHoliday] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async listHolidays(orgId, academicId) {
        if (!orgId) {
            return { success: false, statusCode: 400, message: 'org_id is required.' };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_HOLIDAYS', orgId, { academic_id: academicId });
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.listHolidays] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    // =========================================================================
    // REPORTS & DASHBOARD
    // =========================================================================

    async getClassAttendanceReport(orgId, params, headers) {
        const validation = validateAttendanceQuery({ ...params, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_CLASS_REPORT', orgId, params);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getClassAttendanceReport] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getStudentAttendanceReport(orgId, params, headers) {
        const validation = validateAttendanceQuery({ ...params, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_STUDENT_REPORT', orgId, params);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getStudentAttendanceReport] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getAttendanceSummary(orgId, params, headers) {
        const validation = validateAttendanceQuery({ ...params, org_id: orgId }, headers);
        if (!validation.isValid) {
            return { success: false, statusCode: 400, message: validation.errors.join(' ') };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_SUMMARY', orgId, params);
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getAttendanceSummary] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    async getDashboardMetrics(orgId) {
        if (!orgId) {
            return { success: false, statusCode: 400, message: 'org_id is required.' };
        }
        try {
            const result = await this.repo.queryAttendanceFunction('GET_DASHBOARD_METRICS', orgId, {});
            return { statusCode: result?.success !== false ? 200 : 400, ...result };
        } catch (err) {
            console.error('[AttendanceService.getDashboardMetrics] Error:', err);
            return { success: false, statusCode: 500, message: err.message };
        }
    }

    /**
     * Utility method for dynamic calculations in reports:
     * Working Days = Total Days - Holidays
     * Present Days = Working Days - Absent Days - Leave Days
     * Attendance % = (Present Days / Working Days) * 100
     */
    calculateAttendanceStats(totalAcademicDays, totalHolidays, absentDays, leaveDays) {
        const workingDays = Math.max(0, (totalAcademicDays || 0) - (totalHolidays || 0));
        const absent = absentDays || 0;
        const leave = leaveDays || 0;
        const presentDays = Math.max(0, workingDays - absent - leave);
        const attendancePercentage = workingDays > 0 ? Number(((presentDays / workingDays) * 100).toFixed(2)) : 0;

        return {
            totalAcademicDays,
            totalHolidays,
            workingDays,
            absentDays: absent,
            leaveDays: leave,
            presentDays,
            attendancePercentage
        };
    }
}

const defaultInstance = new AttendanceService();

module.exports = defaultInstance;
module.exports.AttendanceService = AttendanceService;
module.exports.attendanceService = defaultInstance;

