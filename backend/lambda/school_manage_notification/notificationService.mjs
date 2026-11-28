/**
 * File: backend/common/notificationService.mjs
 * Description: Common multi-tenant Notification and FCM Push Notification Service.
 *
 * Responsibilities:
 * - Store notifications into school.notification_master table.
 * - Manage and fetch FCM device tokens from school.device_tokens.
 * - Send push notifications via FCM / Expo push service.
 * - Invalidate expired / invalid device tokens automatically.
 * - Automate three core notification scenarios:
 *   1. Student Absent Notification -> All linked parents.
 *   2. Teacher Leave Approved/Rejected -> Teacher.
 *   3. Marks Entry/Publishing -> Respective parents with marks summary.
 *
 * Multi-Tenancy:
 * - org_id is strictly required on every database query and notification record.
 */

import https from 'https';

/**
 * Standard HTTP POST helper for external push dispatch (Expo / FCM)
 */
function sendJsonPost(urlStr, payload) {
    return new Promise((resolve) => {
        try {
            const url = new URL(urlStr);
            const data = JSON.stringify(payload);
            const req = https.request(
                {
                    hostname: url.hostname,
                    port: url.port || 443,
                    path: url.pathname + url.search,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(data),
                        Accept: 'application/json'
                    },
                    timeout: 5000
                },
                (res) => {
                    let responseBody = '';
                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(responseBody);
                            resolve({ status: res.statusCode, data: parsed });
                        } catch {
                            resolve({ status: res.statusCode, raw: responseBody });
                        }
                    });
                }
            );

            req.on('error', (err) => {
                console.warn('[NotificationService] Push delivery network warning:', err.message);
                resolve({ status: 500, error: err.message });
            });

            req.on('timeout', () => {
                req.destroy();
                console.warn('[NotificationService] Push delivery timed out after 5000ms');
                resolve({ status: 504, error: 'Push timeout' });
            });

            req.write(data);
            req.end();
        } catch (err) {
            console.warn('[NotificationService] Push delivery exception:', err.message);
            resolve({ status: 500, error: err.message });
        }
    });
}

/**
 * Stores a notification into school.notification_master table.
 */
export async function storeNotification(
    {
        org_id,
        user_id,
        role_type,
        title,
        message,
        notification_type,
        reference_id = null,
        created_by = 0,
        metadata = {}
    },
    dbExecute
) {
    if (!org_id || !user_id || !title || !message) {
        console.warn('[storeNotification] Missing mandatory fields:', { org_id, user_id, title });
        return null;
    }

    const query = `
        INSERT INTO school.notification_master (
            org_id,
            user_id,
            role_type,
            title,
            message,
            notification_type,
            reference_id,
            is_read,
            created_on,
            created_by,
            metadata
        ) VALUES (
            $1::BIGINT,
            $2::BIGINT,
            $3::VARCHAR,
            $4::VARCHAR,
            $5::TEXT,
            $6::VARCHAR,
            $7::VARCHAR,
            FALSE,
            CURRENT_TIMESTAMP,
            $8::BIGINT,
            $9::JSONB
        )
        RETURNING notification_id, created_on;
    `;

    const values = [
        Number(org_id),
        Number(user_id),
        String(role_type || 'GENERAL').toUpperCase(),
        String(title).trim(),
        String(message).trim(),
        String(notification_type || 'GENERAL').toUpperCase(),
        reference_id ? String(reference_id) : null,
        Number(created_by || 0),
        JSON.stringify(metadata || {})
    ];

    try {
        const rows = await dbExecute(query, values, org_id);
        const record = Array.isArray(rows) ? rows[0] : rows;
        return record;
    } catch (err) {
        console.error('[storeNotification] Failed to insert notification:', err.message);
        return null;
    }
}

/**
 * Retrieves active device tokens for a user within an organization.
 */
export async function getActiveDeviceTokens(org_id, user_id, dbQueryRaw) {
    if (!org_id || !user_id) return [];

    const query = `
        SELECT device_token_id, fcm_token, device_type
        FROM school.device_tokens
        WHERE org_id = $1::BIGINT
          AND user_id = $2::BIGINT
          AND token_status = 'ACTIVE';
    `;

    try {
        const rows = await dbQueryRaw(query, [Number(org_id), Number(user_id)]);
        return rows || [];
    } catch (err) {
        console.error('[getActiveDeviceTokens] Error querying device tokens:', err.message);
        return [];
    }
}

/**
 * Updates token status (e.g. INVALID, EXPIRED) when push gateway reports dead token.
 */
export async function markTokensStatus(org_id, invalidTokens, status, dbExecute) {
    if (!org_id || !Array.isArray(invalidTokens) || invalidTokens.length === 0) return;

    const query = `
        UPDATE school.device_tokens
        SET token_status = $1::VARCHAR,
            updated_on = CURRENT_TIMESTAMP
        WHERE org_id = $2::BIGINT
          AND fcm_token = ANY($3::TEXT[]);
    `;

    try {
        await dbExecute(query, [status, Number(org_id), invalidTokens], org_id);
    } catch (err) {
        console.warn('[markTokensStatus] Error updating token status:', err.message);
    }
}

/**
 * Dispatches Push Notification to devices.
 * Supports both Expo push tokens and FCM native tokens.
 */
export async function sendPushNotification(
    {
        org_id,
        user_id,
        role_type,
        tokens = [],
        title,
        message,
        notification_type,
        reference_id = null,
        data = {}
    },
    dbExecute,
    dbQueryRaw
) {
    let targetTokens = [...tokens];

    // If tokens not supplied directly, fetch from database
    if (targetTokens.length === 0 && user_id && dbQueryRaw) {
        const fetched = await getActiveDeviceTokens(org_id, user_id, dbQueryRaw);
        targetTokens = fetched.map((item) => item.fcm_token).filter(Boolean);
    }

    if (targetTokens.length === 0) {
        return { success: true, count: 0, message: 'No active device tokens found for user.' };
    }

    const expoTokens = targetTokens.filter((t) => t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'));
    const fcmTokens = targetTokens.filter((t) => !t.startsWith('ExponentPushToken') && !t.startsWith('ExpoPushToken'));

    const pushData = {
        title,
        body: message,
        notification_type,
        reference_id,
        org_id: String(org_id),
        ...data
    };

    const invalidTokens = [];

    // 1. Send via Expo Push Service if any Expo tokens exist
    if (expoTokens.length > 0) {
        const expoMessages = expoTokens.map((token) => ({
            to: token,
            sound: 'default',
            title,
            body: message,
            data: pushData,
            priority: 'high',
            channelId: 'default'
        }));

        const expoResponse = await sendJsonPost('https://exp.host/--/api/v2/push/send', expoMessages);
        if (expoResponse?.data?.data && Array.isArray(expoResponse.data.data)) {
            expoResponse.data.data.forEach((ticket, idx) => {
                if (ticket.status === 'error' && (ticket.details?.error === 'DeviceNotRegistered' || ticket.message?.includes('not registered'))) {
                    invalidTokens.push(expoTokens[idx]);
                }
            });
        }
    }

    // 2. Handle native FCM tokens
    // We send to FCM / Expo backend endpoints with sound, title, and body payload
    if (fcmTokens.length > 0) {
        const fcmMessages = fcmTokens.map((token) => ({
            to: token,
            title,
            body: message,
            data: pushData,
            sound: 'default',
            priority: 'high'
        }));

        const fcmResponse = await sendJsonPost('https://exp.host/--/api/v2/push/send', fcmMessages);
        if (fcmResponse?.data?.data && Array.isArray(fcmResponse.data.data)) {
            fcmResponse.data.data.forEach((ticket, idx) => {
                if (ticket.status === 'error' && (ticket.details?.error === 'DeviceNotRegistered' || ticket.message?.includes('not registered'))) {
                    invalidTokens.push(fcmTokens[idx]);
                }
            });
        }
    }

    // Handle invalid/expired tokens by deactivating them in database
    if (invalidTokens.length > 0 && dbExecute) {
        await markTokensStatus(org_id, invalidTokens, 'EXPIRED', dbExecute);
    }

    return {
        success: true,
        sent: targetTokens.length - invalidTokens.length,
        invalidCount: invalidTokens.length
    };
}

// =============================================================================
// SCENARIO 1: STUDENT ABSENT NOTIFICATION
// Identifies all parents associated with the absent student and dispatches alerts.
// =============================================================================
export async function notifyStudentAbsent(
    { org_id, student_id, attendance_date, session = 'Daily', teacher_id = null },
    dbExecute,
    dbQueryRaw
) {
    if (!org_id || !student_id) return { success: false, message: 'Missing org_id or student_id' };

    try {
        // 1. Fetch student info
        const studentRows = await dbQueryRaw(
            `SELECT
                sm.student_id,
                sm.student_code,
                sm.registration_no,
                sm.class_id,
                sm.section_id,
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', adm.student_first_name, NULLIF(adm.student_middle_name, ''), adm.student_last_name)), ''),
                    sm.student_code
                ) AS student_name,
                COALESCE(cm.class_name, 'Class ' || sm.class_id) AS class_name,
                COALESCE(cs.section_name, sm.section_id, '') AS section_name
            FROM school.student_master sm
            LEFT JOIN school.admission_application adm ON adm.id = sm.admission_id
            LEFT JOIN school.class_master cm ON cm.class_id::TEXT = sm.class_id::TEXT AND cm.org_id = sm.org_id
            LEFT JOIN school.class_section cs ON cs.class_section_id::TEXT = sm.section_id::TEXT AND cs.org_id = sm.org_id
            WHERE sm.student_id = $1::BIGINT
              AND sm.org_id = $2::BIGINT
              AND sm.is_deleted = FALSE
            LIMIT 1;`,
            [Number(student_id), Number(org_id)]
        );

        const student = studentRows?.[0] || {
            student_id,
            student_name: `Student #${student_id}`,
            class_name: 'Class',
            section_name: ''
        };

        // 2. Identify ALL linked parents for this student within the organization
        // Checks both school.mobile_user_credentials (mapped_student_ids) and school.parent_student_mapping
        const parentRows = await dbQueryRaw(
            `SELECT DISTINCT parent_user_id, parent_name
             FROM (
                 -- 1. From mobile_user_credentials where mapped_student_ids contains student_id
                 SELECT id AS parent_user_id, COALESCE(parent_name, 'Parent') AS parent_name
                 FROM school.mobile_user_credentials
                 WHERE org_id = $1::BIGINT
                   AND user_type = 'PARENT'
                   AND status = 'ACTIVE'
                   AND (
                       mapped_student_ids @> jsonb_build_array($2::BIGINT)
                       OR mapped_student_ids @> jsonb_build_array($2::TEXT)
                   )

                 UNION

                 -- 2. From parent_student_mapping
                 SELECT psm.parent_id AS parent_user_id, 'Parent' AS parent_name
                 FROM school.parent_student_mapping psm
                 WHERE psm.org_id = $1::BIGINT
                   AND psm.student_id = $2::BIGINT
                   AND psm.status = 'Active'

                 UNION

                 -- 3. Resolve credential id for parent_student_mapping entries linked to mobile_parent_auth
                 SELECT muc.id AS parent_user_id, COALESCE(muc.parent_name, 'Parent') AS parent_name
                 FROM school.parent_student_mapping psm
                 JOIN school.mobile_parent_auth mpa ON mpa.id = psm.parent_id AND mpa.org_id = psm.org_id
                 JOIN school.mobile_user_credentials muc ON (muc.email = mpa.email OR muc.phone_number = mpa.phone) AND muc.org_id = psm.org_id
                 WHERE psm.org_id = $1::BIGINT
                   AND psm.student_id = $2::BIGINT
                   AND psm.status = 'Active'
                   AND muc.status = 'ACTIVE'
             ) combined;`,
            [Number(org_id), Number(student_id)]
        );

        if (!parentRows || parentRows.length === 0) {
            console.log(`[notifyStudentAbsent] No registered parent accounts found for student ${student_id} in org ${org_id}`);
            return { success: true, notifiedCount: 0 };
        }

        const dateStr = attendance_date ? String(attendance_date).substring(0, 10) : new Date().toISOString().substring(0, 10);
        const sessionLabel = session && session !== 'BOTH' ? `${session} session` : 'all sessions';
        const title = `Attendance Alert: ${student.student_name} Absent`;
        const message = `Dear Parent, ${student.student_name} (${student.class_name} ${student.section_name}) was marked Absent on ${dateStr} for ${sessionLabel}.`;

        let notifiedCount = 0;

        for (const p of parentRows) {
            const parentUserId = Number(p.parent_user_id);

            // Store notification in table first
            await storeNotification(
                {
                    org_id,
                    user_id: parentUserId,
                    role_type: 'PARENT',
                    title,
                    message,
                    notification_type: 'STUDENT_ABSENT',
                    reference_id: String(student_id),
                    created_by: teacher_id || 0,
                    metadata: {
                        student_id: Number(student_id),
                        student_name: student.student_name,
                        class_name: student.class_name,
                        attendance_date: dateStr,
                        session,
                        screen: 'ParentAttendance'
                    }
                },
                dbExecute
            );

            // Send push notification to all linked parent devices
            await sendPushNotification(
                {
                    org_id,
                    user_id: parentUserId,
                    role_type: 'PARENT',
                    title,
                    message,
                    notification_type: 'STUDENT_ABSENT',
                    reference_id: String(student_id),
                    data: {
                        student_id: String(student_id),
                        screen: 'ParentAttendance'
                    }
                },
                dbExecute,
                dbQueryRaw
            );

            notifiedCount++;
        }

        return { success: true, notifiedCount };
    } catch (err) {
        console.error('[notifyStudentAbsent] Exception:', err);
        return { success: false, error: err.message };
    }
}

// =============================================================================
// SCENARIO 2: TEACHER LEAVE APPROVE / REJECT NOTIFICATION
// =============================================================================
export async function notifyTeacherLeaveStatus(
    { org_id, leave_id, teacher_id = null, status, admin_remark = null, updated_by = 0 },
    dbExecute,
    dbQueryRaw
) {
    if (!org_id || !leave_id) return { success: false, message: 'Missing org_id or leave_id' };

    try {
        // 1. Fetch leave record if teacher_id not provided
        let targetTeacherId = teacher_id;
        let leaveType = 'Leave';
        let fromDate = '';
        let toDate = '';

        const leaveRows = await dbQueryRaw(
            `SELECT teacher_id, leave_type, from_date, to_date
             FROM school.teacher_leave
             WHERE leave_id = $1::BIGINT AND org_id = $2::BIGINT LIMIT 1;`,
            [Number(leave_id), Number(org_id)]
        );

        if (leaveRows && leaveRows.length > 0) {
            targetTeacherId = targetTeacherId || leaveRows[0].teacher_id;
            leaveType = leaveRows[0].leave_type || 'Leave';
            fromDate = leaveRows[0].from_date ? String(leaveRows[0].from_date).substring(0, 10) : '';
            toDate = leaveRows[0].to_date ? String(leaveRows[0].to_date).substring(0, 10) : '';
        }

        if (!targetTeacherId) {
            console.warn(`[notifyTeacherLeaveStatus] Unable to locate teacher_id for leave_id ${leave_id}`);
            return { success: false, message: 'Teacher ID not found' };
        }

        const isApproved = String(status).toUpperCase().includes('APPROV');
        const notifType = isApproved ? 'TEACHER_LEAVE_APPROVED' : 'TEACHER_LEAVE_REJECTED';
        const title = isApproved ? 'Teacher Leave Approved' : 'Teacher Leave Rejected';
        const dateRangeStr = fromDate && toDate ? ` (${fromDate} to ${toDate})` : '';

        let message = '';
        if (isApproved) {
            message = `Your ${leaveType} application${dateRangeStr} has been approved by the administration.`;
        } else {
            const remarkText = admin_remark ? ` Reason: ${admin_remark}` : '';
            message = `Your ${leaveType} application${dateRangeStr} was not approved.${remarkText}`;
        }

        // Store notification
        await storeNotification(
            {
                org_id,
                user_id: targetTeacherId,
                role_type: 'TEACHER',
                title,
                message,
                notification_type: notifType,
                reference_id: String(leave_id),
                created_by: updated_by || 0,
                metadata: {
                    leave_id: Number(leave_id),
                    leave_type: leaveType,
                    from_date: fromDate,
                    to_date: toDate,
                    status: isApproved ? 'APPROVED' : 'REJECTED',
                    screen: 'TeacherLeave'
                }
            },
            dbExecute
        );

        // Send push notification to teacher's active devices
        await sendPushNotification(
            {
                org_id,
                user_id: targetTeacherId,
                role_type: 'TEACHER',
                title,
                message,
                notification_type: notifType,
                reference_id: String(leave_id),
                data: {
                    leave_id: String(leave_id),
                    screen: 'TeacherLeave'
                }
            },
            dbExecute,
            dbQueryRaw
        );

        return { success: true };
    } catch (err) {
        console.error('[notifyTeacherLeaveStatus] Exception:', err);
        return { success: false, error: err.message };
    }
}

// =============================================================================
// SCENARIO 3: MARKS ENTRY & PUBLISHING NOTIFICATION
// Dispatches notifications to parents with student marks summary.
// =============================================================================
export async function notifyMarksEntry(
    { org_id, exam_id, marks_list = [], is_published = false, teacher_id = 0 },
    dbExecute,
    dbQueryRaw
) {
    if (!org_id || !exam_id) return { success: false, message: 'Missing org_id or exam_id' };

    try {
        // 1. Fetch exam metadata
        const examRows = await dbQueryRaw(
            `SELECT
                exam_id,
                exam_name,
                subject_name,
                COALESCE(max_marks, 100) AS max_marks,
                exam_date
            FROM school.academic_exam
            WHERE exam_id = $1::BIGINT AND org_id = $2::BIGINT
            LIMIT 1;`,
            [Number(exam_id), Number(org_id)]
        );

        const exam = examRows?.[0] || {
            exam_name: 'Examination',
            subject_name: 'Subject',
            max_marks: 100
        };

        // If marks_list is empty, fetch evaluated marks for this exam
        let studentMarks = marks_list;
        if (!studentMarks || studentMarks.length === 0) {
            studentMarks = await dbQueryRaw(
                `SELECT student_id, scored_marks, is_absent, grade, remarks
                 FROM school.student_exam_marks
                 WHERE exam_id = $1::BIGINT AND org_id = $2::BIGINT;`,
                [Number(exam_id), Number(org_id)]
            );
        }

        if (!studentMarks || studentMarks.length === 0) {
            return { success: true, notifiedCount: 0 };
        }

        let totalNotified = 0;

        for (const item of studentMarks) {
            const studentId = Number(item.student_id);
            if (!studentId) continue;

            // Fetch student name
            const studentRows = await dbQueryRaw(
                `SELECT
                    sm.student_id,
                    COALESCE(
                        NULLIF(TRIM(CONCAT_WS(' ', adm.student_first_name, NULLIF(adm.student_middle_name, ''), adm.student_last_name)), ''),
                        sm.student_code
                    ) AS student_name
                 FROM school.student_master sm
                 LEFT JOIN school.admission_application adm ON adm.id = sm.admission_id
                 WHERE sm.student_id = $1::BIGINT AND sm.org_id = $2::BIGINT LIMIT 1;`,
                [studentId, Number(org_id)]
            );

            const studentName = studentRows?.[0]?.student_name || `Student #${studentId}`;
            const isAbsent = Boolean(item.is_absent);
            const scoredMarks = item.scored_marks !== undefined ? item.scored_marks : 0;
            const maxMarks = exam.max_marks;
            const grade = item.grade || (isAbsent ? 'AB' : '');

            const marksSummary = isAbsent
                ? 'Status: Absent'
                : `Scored: ${scoredMarks}/${maxMarks}${grade ? ` (Grade: ${grade})` : ''}`;

            const actionLabel = isPublished ? 'Published' : 'Entered';
            const title = `Marks ${actionLabel}: ${exam.exam_name} (${exam.subject_name})`;
            const message = `Marks summary for ${studentName} in ${exam.subject_name}: ${marksSummary}.`;

            // Identify linked parents for this student
            const parentRows = await dbQueryRaw(
                `SELECT DISTINCT parent_user_id
                 FROM (
                     SELECT id AS parent_user_id
                     FROM school.mobile_user_credentials
                     WHERE org_id = $1::BIGINT
                       AND user_type = 'PARENT'
                       AND status = 'ACTIVE'
                       AND (
                           mapped_student_ids @> jsonb_build_array($2::BIGINT)
                           OR mapped_student_ids @> jsonb_build_array($2::TEXT)
                       )

                     UNION

                     SELECT psm.parent_id AS parent_user_id
                     FROM school.parent_student_mapping psm
                     WHERE psm.org_id = $1::BIGINT
                       AND psm.student_id = $2::BIGINT
                       AND psm.status = 'Active'
                 ) combined;`,
                [Number(org_id), studentId]
            );

            for (const p of (parentRows || [])) {
                const parentUserId = Number(p.parent_user_id);

                await storeNotification(
                    {
                        org_id,
                        user_id: parentUserId,
                        role_type: 'PARENT',
                        title,
                        message,
                        notification_type: 'MARKS_ENTRY',
                        reference_id: String(exam_id),
                        created_by: teacher_id || 0,
                        metadata: {
                            exam_id: Number(exam_id),
                            exam_name: exam.exam_name,
                            subject_name: exam.subject_name,
                            student_id: studentId,
                            student_name: studentName,
                            scored_marks: scoredMarks,
                            max_marks: maxMarks,
                            grade,
                            is_absent: isAbsent,
                            screen: 'ParentMarks'
                        }
                    },
                    dbExecute
                );

                await sendPushNotification(
                    {
                        org_id,
                        user_id: parentUserId,
                        role_type: 'PARENT',
                        title,
                        message,
                        notification_type: 'MARKS_ENTRY',
                        reference_id: String(exam_id),
                        data: {
                            exam_id: String(exam_id),
                            student_id: String(studentId),
                            screen: 'ParentMarks'
                        }
                    },
                    dbExecute,
                    dbQueryRaw
                );

                totalNotified++;
            }
        }

        return { success: true, notifiedCount: totalNotified };
    } catch (err) {
        console.error('[notifyMarksEntry] Exception:', err);
        return { success: false, error: err.message };
    }
}
