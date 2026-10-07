import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000/api";
const ACCESS_SECRET = process.env.ACCESS_SECRET;

const unique = Date.now();

const users = {
    reporter: {
        email: `test-reporter-${unique}@example.com`,
        password: "Test1234!",
        role: "reporter",
    },
    maintainer: {
        email: `test-maintainer-${unique}@example.com`,
        password: "Test1234!",
        role: "maintainer",
    },
};

let reporter;
let maintainer;
let bugId;

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const text = await response.text();

    let body = null;

    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }
    }

    return {
        status: response.status,
        body,
    };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ ${message}`);
    }

    console.log(`✅ ${message}`);
}

async function registerAndLogin(user) {
    const register = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(user),
    });

    assert(
        register.status === 201,
        `Register ${user.role} (${register.status})`
    );

    const login = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: user.email,
            password: user.password,
        }),
    });

    assert(
        login.status === 200,
        `Login ${user.role} (${login.status})`
    );

    assert(login.body?.accessToken, "Access token returned");
    assert(login.body?.refreshToken, "Refresh token returned");

    assert(
        login.body.accessToken !== login.body.refreshToken,
        "Access and refresh tokens are distinct"
    );

    return login.body;
}

async function main() {
    console.log("\n🚀 Starting auth/RBAC tests...\n");

    // --------------------------------------------------
    // 1. Register + Login
    // --------------------------------------------------

    reporter = await registerAndLogin(users.reporter);
    maintainer = await registerAndLogin(users.maintainer);

    // --------------------------------------------------
    // Create a test bug
    // --------------------------------------------------

    const createBug = await request("/bugs", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${maintainer.accessToken}`,
        },
        body: JSON.stringify({
            title: `Automated Test Bug ${unique}`,
            description: "Created by automated authentication test",
            status: "open",
            reportedBy: maintainer.id,
        }),
    });

    assert(
        createBug.status === 201,
        `Create test bug (${createBug.status})`
    );

    bugId = createBug.body?._id || createBug.body?.id;

    assert(bugId, "Test bug has an ID");

    // --------------------------------------------------
    // 2. Protected route with NO token -> 401
    // --------------------------------------------------

    const noToken = await request(`/bugs/${bugId}`, {
        method: "PATCH",
        body: JSON.stringify({
            status: "closed",
        }),
    });

    assert(
        noToken.status === 401,
        `No token returns 401 (got ${noToken.status})`
    );

    // --------------------------------------------------
    // 3. Valid token but wrong role -> 403
    // Reporter attempts admin-only DELETE
    // --------------------------------------------------

    const wrongRole = await request(`/bugs/${bugId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${reporter.accessToken}`,
        },
    });

    assert(
        wrongRole.status === 403,
        `Reporter DELETE returns 403 (got ${wrongRole.status})`
    );

    // --------------------------------------------------
    // 4. Expired access token -> 401
    // --------------------------------------------------

    const payload = jwt.decode(maintainer.accessToken);

    assert(
        payload?.userId,
        "Access token contains userId"
    );

    const expiredAccessToken = jwt.sign(
        {
            userId: payload.userId,
        },
        ACCESS_SECRET,
        {
            expiresIn: -10,
        }
    );

    const expiredRequest = await request(`/bugs/${bugId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${expiredAccessToken}`,
        },
        body: JSON.stringify({
            status: "closed",
        }),
    });

    assert(
        expiredRequest.status === 401,
        `Expired access token returns 401 (got ${expiredRequest.status})`
    );

    // --------------------------------------------------
    // 5. Refresh -> new access token
    // --------------------------------------------------

    const refresh = await request("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({
            refreshToken: maintainer.refreshToken,
        }),
    });

    assert(
        refresh.status === 200,
        `Refresh returns 200 (got ${refresh.status})`
    );

    assert(
        refresh.body?.accessToken,
        "Refresh returns new access token"
    );

    assert(
        refresh.body.accessToken !== maintainer.accessToken,
        "New access token differs from old access token"
    );

    maintainer.accessToken = refresh.body.accessToken;

    // --------------------------------------------------
    // Retry original request with new access token
    // --------------------------------------------------

    const retry = await request(`/bugs/${bugId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${maintainer.accessToken}`,
        },
        body: JSON.stringify({
            status: "open",
        }),
    });

    assert(
        retry.status === 200,
        `Retry with new access token succeeds (got ${retry.status})`
    );

    // --------------------------------------------------
    // 6. Logout
    // --------------------------------------------------

    const logout = await request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({
            refreshToken: maintainer.refreshToken,
        }),
    });

    assert(
        logout.status === 200,
        `Logout returns 200 (got ${logout.status})`
    );

    // --------------------------------------------------
    // 7. Refresh after logout -> 401
    // --------------------------------------------------

    const refreshAfterLogout = await request("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({
            refreshToken: maintainer.refreshToken,
        }),
    });

    assert(
        refreshAfterLogout.status === 401,
        `Refresh after logout returns 401 (got ${refreshAfterLogout.status})`
    );

    console.log("\n🎉 ALL TESTS PASSED!\n");
}

main().catch((error) => {
    console.error("\n", error.message);
    process.exit(1);
});