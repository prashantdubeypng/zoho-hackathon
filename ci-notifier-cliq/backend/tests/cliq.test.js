const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

describe('Cliq Action Endpoint', () => {
    let testRunId;

    beforeAll(async () => {
        // Insert a test run
        testRunId = await db.insertRun({
            repo: 'test-org/test-repo',
            workflow: 'Test Workflow',
            branch: 'main',
            commit_sha: 'abc123',
            status: 'failure',
            run_url: 'https://github.com/test-org/test-repo/actions/runs/123',
            raw_payload: {},
            logs: 'Test logs'
        });
    });

    afterAll(() => {
        db.close();
    });

    test('POST /cliq/action - rerun action', async () => {
        const response = await request(app)
            .post('/cliq/action')
            .send({
                action: 'rerun',
                data: {
                    run_id: testRunId,
                    repo: 'test-org/test-repo',
                    run_url: 'https://github.com/test-org/test-repo/actions/runs/123'
                }
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
    });

    test('POST /cliq/action - assign action', async () => {
        const response = await request(app)
            .post('/cliq/action')
            .send({
                action: 'assign',
                data: {
                    run_id: testRunId
                }
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
    });

    test('POST /cliq/action - open-run action', async () => {
        const response = await request(app)
            .post('/cliq/action')
            .send({
                action: 'open-run',
                data: {
                    run_url: 'https://github.com/test-org/test-repo/actions/runs/123'
                }
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('url');
    });

    test('POST /cliq/action - missing action returns 400', async () => {
        const response = await request(app)
            .post('/cliq/action')
            .send({})
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body).toHaveProperty('error');
    });

    test('POST /cliq/action - unknown action returns 400', async () => {
        const response = await request(app)
            .post('/cliq/action')
            .send({
                action: 'unknown-action'
            })
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body).toHaveProperty('error');
    });

    test('GET /cliq/test-card - sends test card', async () => {
        const response = await request(app)
            .get('/cliq/test-card')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success');
    });
});
