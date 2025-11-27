const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

describe('API Endpoints', () => {
    let testRunIds = [];

    beforeAll(async () => {
        // Insert test runs
        for (let i = 0; i < 5; i++) {
            const runId = await db.insertRun({
                repo: `test-org/repo-${i}`,
                workflow: `Workflow ${i}`,
                branch: 'main',
                commit_sha: `commit${i}`,
                status: i % 2 === 0 ? 'failure' : 'success',
                run_url: `https://github.com/test-org/repo-${i}/actions/runs/${i}`,
                raw_payload: {},
                logs: `Logs for run ${i}`
            });
            testRunIds.push(runId);
        }
    });

    afterAll(() => {
        db.close();
    });

    test('GET /api/runs - returns paginated runs', async () => {
        const response = await request(app)
            .get('/api/runs')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('runs');
        expect(response.body).toHaveProperty('pagination');
        expect(Array.isArray(response.body.runs)).toBe(true);
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('total');
    });

    test('GET /api/runs?status=failure - filters by status', async () => {
        const response = await request(app)
            .get('/api/runs?status=failure')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.runs.length).toBeGreaterThan(0);
        response.body.runs.forEach(run => {
            expect(run.status).toBe('failure');
        });
    });

    test('GET /api/runs/:id - returns single run', async () => {
        const runId = testRunIds[0];
        const response = await request(app)
            .get(`/api/runs/${runId}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('id', runId);
        expect(response.body).toHaveProperty('repo');
        expect(response.body).toHaveProperty('workflow');
    });

    test('GET /api/runs/:id - returns 404 for non-existent run', async () => {
        const response = await request(app)
            .get('/api/runs/99999')
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toHaveProperty('error');
    });

    test('GET /api/stats - returns statistics', async () => {
        const response = await request(app)
            .get('/api/stats')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('totalRuns');
        expect(response.body).toHaveProperty('failuresLast7Days');
        expect(response.body).toHaveProperty('topFailingWorkflows');
        expect(typeof response.body.totalRuns).toBe('number');
        expect(Array.isArray(response.body.topFailingWorkflows)).toBe(true);
    });

    test('GET /api/runs with pagination', async () => {
        const response = await request(app)
            .get('/api/runs?page=1&limit=2')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.runs.length).toBeLessThanOrEqual(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(2);
    });
});
