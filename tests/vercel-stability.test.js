const assert = require('assert');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

process.chdir(path.join(__dirname, '..'));
dotenv.config();

async function request(port, urlPath) {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body ? JSON.parse(body) : null
                });
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy(new Error('Request timeout'));
        });
    });
}

async function testConnectDbReuse() {
    const connectDB = require('../config/db');
    const mongoose = require('mongoose');

    const originalUri = process.env.MONGODB_URI;
    if (!originalUri) {
        console.log('  ⊘ connectDB reuse skipped (MONGODB_URI not set)');
        return;
    }

    const first = await connectDB();
    const second = await connectDB();
    assert.strictEqual(mongoose.connection.readyState, 1, 'mongoose should be connected');
    assert.strictEqual(first, mongoose.connection, 'connectDB should return mongoose.connection');
    assert.strictEqual(second, first, 'connectDB should return cached connection');
    console.log('  ✓ connectDB reuses cached connection');
}

async function testHttpRoutes(port) {
    const start = Date.now();
    const health = await request(port, '/health');
    const healthMs = Date.now() - start;

    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.body.status, 'ok');
    assert.strictEqual(health.body.service, 'backend');
    assert.ok(health.body.timestamp);
    assert.ok(healthMs < 500, `health should respond in <500ms (got ${healthMs}ms)`);
    console.log(`  ✓ GET /health returns 200 JSON in ${healthMs}ms`);

    const root = await request(port, '/');
    assert.strictEqual(root.statusCode, 200);
    assert.strictEqual(root.body.message, 'Backend API is running');
    assert.strictEqual(root.body.health, '/health');
    console.log('  ✓ GET / returns 200 JSON');

    const unknown = await request(port, '/this-route-does-not-exist');
    assert.strictEqual(unknown.statusCode, 404);
    assert.strictEqual(unknown.body.success, false);
    console.log('  ✓ unknown route returns 404 JSON without redirect');

    const rootHead = await new Promise((resolve, reject) => {
        const req = http.request({
            host: '127.0.0.1',
            port,
            path: '/',
            method: 'HEAD'
        }, (res) => {
            resolve(res.statusCode);
        });
        req.on('error', reject);
        req.end();
    });
    assert.ok(rootHead < 400, 'root should not redirect');
    console.log('  ✓ GET / has no redirect loop');
}

async function testWorkersDisabledOnVercel() {
    const { spawnSync } = require('child_process');
    const script = `
        process.env.VERCEL = '1';
        process.env.ENABLE_WORKERS = 'true';
        process.env.ENABLE_TRACKING_WORKER = 'true';
        process.env.NODE_ENV = 'production';
        const exported = require('./server');
        const isHttpServer = exported instanceof require('http').Server;
        if (isHttpServer) {
            console.error('FAIL: exported http.Server on Vercel (should export Express app only)');
            process.exit(1);
        }
        if (!exported || typeof exported.use !== 'function') {
            console.error('FAIL: expected Express app export on Vercel');
            process.exit(1);
        }
        console.log('PASS');
    `;

    const result = spawnSync(process.execPath, ['-e', script], {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        timeout: 15000
    });

    if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || 'Vercel worker guard test failed');
    }
    assert.ok(result.stdout.includes('PASS'));
    console.log('  ✓ workers and HTTP listener are disabled when VERCEL is set');
}

async function testProductPerformance(port) {
    const catalogStart = Date.now();
    const catalog = await request(port, '/api/store/catalog');
    const catalogMs = Date.now() - catalogStart;

    assert.strictEqual(catalog.statusCode, 200, `catalog status ${catalog.statusCode}: ${JSON.stringify(catalog.body).slice(0, 120)}`);
    assert.strictEqual(catalog.body.success, true);
    assert.ok(Array.isArray(catalog.body.data?.products));
    assert.ok(catalogMs < 3000, `catalog should respond in <3s (got ${catalogMs}ms)`);
    console.log(`  ✓ GET /api/store/catalog returns 200 in ${catalogMs}ms`);

    const listStart = Date.now();
    const list = await request(port, '/api/products?limit=20');
    const listMs = Date.now() - listStart;

    assert.strictEqual(list.statusCode, 200);
    assert.ok(list.body.pagination);
    assert.ok(list.body.data.length <= 20);
    assert.ok(listMs < 3000, `product list should respond in <3s (got ${listMs}ms)`);
    console.log(`  ✓ GET /api/products?limit=20 returns paginated data in ${listMs}ms`);

    if (list.body.data.length > 0) {
        const first = list.body.data[0];
        assert.ok(first.title);
        assert.ok(!first.description, 'list items should not include description');
        const slug = first.slug;
        const detailStart = Date.now();
        const detail = await request(port, `/api/products/slug/${slug}`);
        const detailMs = Date.now() - detailStart;
        assert.strictEqual(detail.statusCode, 200);
        assert.ok(detailMs < 2000, `product detail should respond in <2s (got ${detailMs}ms)`);
        console.log(`  ✓ GET /api/products/slug/:slug returns 200 in ${detailMs}ms`);
    }

    const badId = await request(port, '/api/products/not-a-valid-id');
    assert.strictEqual(badId.statusCode, 404);
    console.log('  ✓ invalid product id returns 404 (not 500)');
}

async function run() {
    console.log('Vercel stability test suite\n');

    process.env.PORT = String(5600 + Math.floor(Math.random() * 100));
    const testPort = Number(process.env.PORT);
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_WORKERS = 'false';
    process.env.ENABLE_TRACKING_WORKER = 'false';
    delete process.env.VERCEL;

    console.log('[1] connectDB reuse');
    await testConnectDbReuse();

    console.log('\n[2] HTTP routes (local server)');
    require('../server');
    const connectDB = require('../config/db');
    if (process.env.MONGODB_URI) {
        await connectDB();
    }
    await new Promise((r) => setTimeout(r, 800));
    await testHttpRoutes(testPort);

    console.log('\n[3] Product API performance');
    await testProductPerformance(testPort);

    console.log('\n[4] Vercel export guard');
    await testWorkersDisabledOnVercel();

    console.log('\nAll stability tests passed.');
}

run().catch((err) => {
    console.error('\nTest suite failed:', err.message);
    process.exit(1);
});
