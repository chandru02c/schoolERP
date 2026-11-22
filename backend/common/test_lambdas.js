/**
 * Automated Verification Test Script for Refactored Lambdas & Common Helpers
 */
'use strict';

const requestHelper = require('./request');
const responseHelper = require('./response');
const createHandler = require('../lambda/school_create_admission/index').handler;
const deleteHandler = require('../lambda/school_delete_admission/index').handler;
const getHandler = require('../lambda/school_get_admission/index').handler;
const updateHandler = require('../lambda/school_update_admission/index').handler;

async function runTests() {
    console.log('--- STARTING LAMBDA REFACTORING VERIFICATION TESTS ---\n');
    let passed = 0;
    let failed = 0;

    function assertEqual(actual, expected, testName) {
        if (actual === expected) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName} - Expected: ${expected}, Got: ${actual}`);
            failed++;
        }
    }

    // Test 1: Request Helper - Header Variations
    const eventHeadersOrgId = { headers: { 'org_id': '101' } };
    const context1 = requestHelper.extractContext(eventHeadersOrgId);
    assertEqual(context1.orgId, 101, 'Request Helper - Extract org_id from lowercase header');

    const eventHeadersOrgIdCaps = { headers: { 'Org_Id': '202' } };
    const context2 = requestHelper.extractContext(eventHeadersOrgIdCaps);
    assertEqual(context2.orgId, 202, 'Request Helper - Extract org_id from capitalized header');

    const eventClaimsOrgId = {
        headers: {},
        requestContext: { authorizer: { claims: { 'custom:org_id': '303', 'custom:user_id': '50' } } }
    };
    const context3 = requestHelper.extractContext(eventClaimsOrgId);
    assertEqual(context3.orgId, 303, 'Request Helper - Extract org_id from authorizer claims');
    assertEqual(context3.userId, 50, 'Request Helper - Extract user_id from authorizer claims');

    const eventMissingOrgId = { headers: {} };
    const context4 = requestHelper.extractContext(eventMissingOrgId);
    assertEqual(context4.orgId, null, 'Request Helper - Return null orgId when missing');

    // Test 2: CORS Preflight across all 4 Lambdas
    const optionsEvent = { httpMethod: 'OPTIONS' };
    const resCreateOptions = await createHandler(optionsEvent, {});
    assertEqual(resCreateOptions.statusCode, 200, 'school_create_admission - OPTIONS CORS approved');

    const resDeleteOptions = await deleteHandler(optionsEvent, {});
    assertEqual(resDeleteOptions.statusCode, 200, 'school_delete_admission - OPTIONS CORS approved');

    const resGetOptions = await getHandler(optionsEvent, {});
    assertEqual(resGetOptions.statusCode, 200, 'school_get_admission - OPTIONS CORS approved');

    const resUpdateOptions = await updateHandler(optionsEvent, {});
    assertEqual(resUpdateOptions.statusCode, 200, 'school_update_admission - OPTIONS CORS approved');

    // Test 3: Unauthorized response when org_id missing across all 4 Lambdas
    const noOrgEvent = { headers: {} };

    const resCreateNoOrg = await createHandler(noOrgEvent, {});
    assertEqual(resCreateNoOrg.statusCode, 401, 'school_create_admission - Missing org_id returns 401');

    const resDeleteNoOrg = await deleteHandler(noOrgEvent, {});
    assertEqual(resDeleteNoOrg.statusCode, 401, 'school_delete_admission - Missing org_id returns 401');

    const resGetNoOrg = await getHandler(noOrgEvent, {});
    assertEqual(resGetNoOrg.statusCode, 401, 'school_get_admission - Missing org_id returns 401');

    const resUpdateNoOrg = await updateHandler(noOrgEvent, {});
    assertEqual(resUpdateNoOrg.statusCode, 401, 'school_update_admission - Missing org_id returns 401');

    console.log(`\n--- VERIFICATION TEST SUMMARY ---`);
    console.log(`Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
