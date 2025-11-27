const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

describe('Webhook Endpoint', () => {
    afterAll(() => {
        db.close();
    });

    test('POST /ci/webhook - GitHub Actions payload', async () => {
        const githubPayload = {
            action: 'completed',
            workflow_run: {
                id: 123456789,
                name: 'CI',
                head_branch: 'main',
                head_sha: 'abc1234567890',
                status: 'completed',
                conclusion: 'failure',
                html_url: 'https://github.com/test-org/test-repo/actions/runs/123456789',
                run_number: 42,
                event: 'push',
                actor: {
                    login: 'testuser'
                }
            },
            repository: {
                full_name: 'test-org/test-repo'
            }
        };

        const response = await request(app)
            .post('/ci/webhook')
            .send(githubPayload)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('runId');
        expect(typeof response.body.runId).toBe('number');
    });

    test('POST /ci/webhook - Generic CI payload', async () => {
        const genericPayload = {
            repo: 'test-org/another-repo',
            workflow: 'Build and Test',
            branch: 'develop',
            commit: 'xyz9876543210',
            status: 'success',
            url: 'https://ci.example.com/builds/456'
        };

        const response = await request(app)
            .post('/ci/webhook')
            .send(genericPayload)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('runId');
    });

    test('POST /ci/webhook - Missing data returns 200 with normalized fallback', async () => {
        const response = await request(app)
            .post('/ci/webhook')
            .send({})
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toHaveProperty('success', true);
    });
});
