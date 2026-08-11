"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = void 0;
exports.refreshAccessToken = refreshAccessToken;
exports.refreshAccessTokenWithRetry = refreshAccessTokenWithRetry;
exports.post = post;
exports.get = get;
exports.apiPost = apiPost;
exports.apiPostForm = apiPostForm;
exports.apiPutForm = apiPutForm;
exports.apiPut = apiPut;
exports.apiDelete = apiDelete;
exports.apiGet = apiGet;
var NEXT_PUBLIC_API_BASE = ((_a = process.env.NEXT_PUBLIC_API_GATEWAY_URL) !== null && _a !== void 0 ? _a : '').trim();
var SERVER_API_GATEWAY_URL = ((_b = process.env.API_GATEWAY_URL) !== null && _b !== void 0 ? _b : '').trim();
var API_BASE = SERVER_API_GATEWAY_URL || NEXT_PUBLIC_API_BASE;
var USE_API_PROXY = Boolean(API_BASE);
// Skip ngrok's browser warning page for local gateway requests.
var NGROK_HEADERS = { 'ngrok-skip-browser-warning': 'true' };
function buildUrl(path) {
    // When the gateway URL is configured in Next.js, `/api/*` is rewritten by
    // next.config.mjs through the dev server to the real backend. Keep browser
    // requests same-origin so httpOnly cookies like erp_refresh can be sent.
    if (USE_API_PROXY && path.startsWith('/api/'))
        return path;
    if (!API_BASE)
        return path;
    return "".concat(API_BASE).concat(path);
}
var AuthError = /** @class */ (function (_super) {
    __extends(AuthError, _super);
    function AuthError(code, message) {
        var _this = _super.call(this, message !== null && message !== void 0 ? message : code) || this;
        _this.code = code;
        _this.name = 'AuthError';
        return _this;
    }
    return AuthError;
}(Error));
exports.AuthError = AuthError;
// These auth routes should not trigger a refresh loop.
var AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];
function isAuthEndpoint(path) {
    return AUTH_ENDPOINTS.some(function (endpoint) { return path.includes(endpoint); });
}
// Prevent duplicate refresh calls when several requests fail at once.
// This only dedupes calls made *within this tab* — every caller that needs
// a fresh access token (both the reactive 401 handler below and
// src/lib/auth.ts's refreshSession(), used on layout mount) must go through
// this same function rather than posting to /auth/refresh directly, or the
// dedup silently stops covering them.
var refreshInFlight = null;
function refreshAccessToken() {
    if (!refreshInFlight) {
        refreshInFlight = apiPost('/api/v1/users/auth/refresh', {})
            .then(function (data) { return data !== null && data !== void 0 ? data : {}; })
            .finally(function () {
            refreshInFlight = null;
        });
    }
    return refreshInFlight;
}
function redirectToLogin(triggeredBy, cause) {
    // Logged before navigating away — once the redirect fires, the tab reloads
    // and this context would otherwise be lost, making a "why did I get logged
    // out on this page" report impossible to root-cause after the fact.
    if (typeof window !== 'undefined') {
        console.warn("[auth] Redirecting to /login \u2014 refresh failed after a 401 from \"".concat(triggeredBy, "\"."), cause);
        window.location.href = '/login';
    }
}
// Only a real refresh failure should log the user out. The backend's
// erp_refresh cookie is single-use (rotates on every call, confirmed via a
// real concurrent-request test: two /auth/refresh calls with the same
// still-valid token raced 200/401) — so a 401 here doesn't necessarily mean
// the session is actually gone. If the user has a second tab open (each tab
// runs its own independent proactive refresh timer — see the module
// layouts' SESSION_REFRESH_INTERVAL_MS — so this isn't a rare edge case),
// or an unrelated refresh from elsewhere in this same tab slipped past the
// dedup above, it may have already rotated the cookie a moment before this
// attempt reached the server. Give that a brief window to land in the
// browser's cookie store and try once more before concluding the session is
// genuinely gone. Shared by both the reactive 401 handler below AND the
// proactive keep-alive (via refreshSession() in auth.ts) — every caller
// needs this same tolerance, not just the reactive path; a previous version
// of the proactive timer skipped it and logged users out on the very first
// racy collision instead of retrying, which is exactly the failure this was
// built to prevent.
function refreshAccessTokenWithRetry() {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 5]);
                    return [4 /*yield*/, refreshAccessToken()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_1 = _a.sent();
                    if (!(err_1 instanceof AuthError))
                        throw err_1;
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, refreshAccessToken()];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// `triggeredBy` is the path of the original request whose 401 kicked this
// off — purely for diagnostics, see redirectToLogin() above.
function handleUnauthorized(triggeredBy) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, refreshAccessTokenWithRetry()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    if (err_2 instanceof AuthError)
                        redirectToLogin(triggeredBy, err_2);
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Some auth endpoints still use the older plain JSON format.
function post(path_1, body_1) {
    return __awaiter(this, arguments, void 0, function (path, body, retried) {
        var res, err;
        var _a;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'POST',
                        headers: __assign({ 'Content-Type': 'application/json' }, NGROK_HEADERS),
                        credentials: 'include',
                        body: JSON.stringify(body),
                    })];
                case 1:
                    res = _b.sent();
                    if (!(res.status === 401 && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 3];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 2:
                    _b.sent();
                    return [2 /*return*/, post(path, body, true)];
                case 3:
                    if (!!res.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.json().catch(function () { return ({ code: 'unknown' }); })];
                case 4:
                    err = _b.sent();
                    throw new AuthError((_a = err.code) !== null && _a !== void 0 ? _a : 'unknown', err.message);
                case 5:
                    if (res.status === 204)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, res.json()];
            }
        });
    });
}
function get(path_1) {
    return __awaiter(this, arguments, void 0, function (path, retried) {
        var res, err;
        var _a;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'GET',
                        headers: NGROK_HEADERS,
                        credentials: 'include',
                    })];
                case 1:
                    res = _b.sent();
                    if (!(res.status === 401 && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 3];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 2:
                    _b.sent();
                    return [2 /*return*/, get(path, true)];
                case 3:
                    if (!!res.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, res.json().catch(function () { return ({ code: 'unknown' }); })];
                case 4:
                    err = _b.sent();
                    throw new AuthError((_a = err.code) !== null && _a !== void 0 ? _a : 'unknown', err.message);
                case 5:
                    if (res.status === 204)
                        return [2 /*return*/, undefined];
                    return [2 /*return*/, res.json()];
            }
        });
    });
}
// A raw ASP.NET model-binding failure (e.g. a Guid?-typed field getting an
// empty string, caught by the framework before the controller — and one's
// own custom validation — ever runs) returns its built-in
// ValidationProblemDetails shape instead: { title, errors: { field: [msg] } }.
// `errors` there is a DICTIONARY keyed by field name, not the app's own
// `string[]`, and there's no `code` at all. Without this fallback, every
// such failure surfaced as a bare `AuthError('unknown')` with no usable
// message — confirmed on a real 400 from program-master's update-complete
// where an empty-string UnitTypeGuid/UnitCatGuid hit exactly this shape.
function extractErrorInfo(envelope) {
    var _a, _b, _c, _d, _e, _f;
    var e = envelope;
    if (!e)
        return { code: 'unknown' };
    if (e.code)
        return { code: e.code, message: (_b = (_a = (Array.isArray(e.errors) ? e.errors[0] : undefined)) !== null && _a !== void 0 ? _a : e.message) !== null && _b !== void 0 ? _b : undefined };
    if (e.errors && !Array.isArray(e.errors) && typeof e.errors === 'object') {
        var fieldErrors = e.errors;
        var firstField = Object.keys(fieldErrors)[0];
        return { code: 'validation_error', message: (_e = (_d = (firstField ? (_c = fieldErrors[firstField]) === null || _c === void 0 ? void 0 : _c[0] : undefined)) !== null && _d !== void 0 ? _d : e.title) !== null && _e !== void 0 ? _e : undefined };
    }
    return { code: 'unknown', message: (_f = e.title) !== null && _f !== void 0 ? _f : undefined };
}
function apiPost(path_1, body_1) {
    return __awaiter(this, arguments, void 0, function (path, body, retried) {
        var res, envelope, unauthorized, _a, code, message;
        var _b, _c, _d, _e;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'POST',
                        headers: __assign({ 'Content-Type': 'application/json' }, NGROK_HEADERS),
                        credentials: 'include',
                        body: JSON.stringify(body),
                    })];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 2:
                    envelope = (_f.sent());
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, apiPost(path, body, true)];
                case 4:
                    if (res.ok) {
                        // Some endpoints (e.g. login) authenticate purely via Set-Cookie and
                        // respond 2xx with no parseable JSON body — that's a legitimate success,
                        // not an error, so resolve with null data rather than throwing.
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_b = envelope.code) !== null && _b !== void 0 ? _b : 'unknown', (_e = (_d = (_c = envelope.errors) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : envelope.message) !== null && _e !== void 0 ? _e : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _a = extractErrorInfo(envelope), code = _a.code, message = _a.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
// multipart/form-data variant of apiPost — for endpoints that accept a file
// alongside regular fields (e.g. course unit syllabus upload). No
// Content-Type header: the browser sets the multipart boundary itself when
// FormData is passed straight through to fetch.
function apiPostForm(path_1, formData_1) {
    return __awaiter(this, arguments, void 0, function (path, formData, retried) {
        var _i, _a, key, value, res, responseText, envelope, unauthorized, _b, code, message;
        var _c, _d, _e, _f;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    // Debug: log FormData keys before sending
                    console.log("\uD83D\uDCE1 apiPostForm to ".concat(path));
                    console.log('📦 FormData entries:');
                    for (_i = 0, _a = formData.keys(); _i < _a.length; _i++) {
                        key = _a[_i];
                        value = formData.get(key);
                        if (value instanceof File) {
                            console.log("   ".concat(key, ": [File] ").concat(value.name, " (").concat(value.size, " bytes, ").concat(value.type, ")"));
                        }
                        else {
                            console.log("   ".concat(key, ": \"").concat(value, "\""));
                        }
                    }
                    return [4 /*yield*/, fetch(buildUrl(path), {
                            method: 'POST',
                            headers: NGROK_HEADERS,
                            credentials: 'include',
                            body: formData,
                        })];
                case 1:
                    res = _g.sent();
                    console.log("\uD83D\uDCE5 Response status: ".concat(res.status));
                    return [4 /*yield*/, res.text()];
                case 2:
                    responseText = _g.sent();
                    console.log("\uD83D\uDCC4 Response body: ".concat(responseText || '(empty)'));
                    envelope = responseText ? JSON.parse(responseText) : null;
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _g.sent();
                    return [2 /*return*/, apiPostForm(path, formData, true)];
                case 4:
                    if (res.ok) {
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_c = envelope.code) !== null && _c !== void 0 ? _c : 'unknown', (_f = (_e = (_d = envelope.errors) === null || _d === void 0 ? void 0 : _d[0]) !== null && _e !== void 0 ? _e : envelope.message) !== null && _f !== void 0 ? _f : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _b = extractErrorInfo(envelope), code = _b.code, message = _b.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
// multipart/form-data variant of apiPut — mirrors apiPostForm for endpoints
// that accept an optional file on update too (e.g. course unit syllabus
// replace).
function apiPutForm(path_1, formData_1) {
    return __awaiter(this, arguments, void 0, function (path, formData, retried) {
        var res, envelope, unauthorized, _a, code, message;
        var _b, _c, _d, _e;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'PUT',
                        headers: NGROK_HEADERS,
                        credentials: 'include',
                        body: formData,
                    })];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 2:
                    envelope = (_f.sent());
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, apiPutForm(path, formData, true)];
                case 4:
                    if (res.ok) {
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_b = envelope.code) !== null && _b !== void 0 ? _b : 'unknown', (_e = (_d = (_c = envelope.errors) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : envelope.message) !== null && _e !== void 0 ? _e : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _a = extractErrorInfo(envelope), code = _a.code, message = _a.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
function apiPut(path_1, body_1) {
    return __awaiter(this, arguments, void 0, function (path, body, retried) {
        var res, envelope, unauthorized, _a, code, message;
        var _b, _c, _d, _e;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'PUT',
                        headers: __assign({ 'Content-Type': 'application/json' }, NGROK_HEADERS),
                        credentials: 'include',
                        body: JSON.stringify(body),
                    })];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 2:
                    envelope = (_f.sent());
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, apiPut(path, body, true)];
                case 4:
                    if (res.ok) {
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_b = envelope.code) !== null && _b !== void 0 ? _b : 'unknown', (_e = (_d = (_c = envelope.errors) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : envelope.message) !== null && _e !== void 0 ? _e : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _a = extractErrorInfo(envelope), code = _a.code, message = _a.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
function apiDelete(path_1) {
    return __awaiter(this, arguments, void 0, function (path, retried) {
        var res, envelope, unauthorized, _a, code, message;
        var _b, _c, _d, _e;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'DELETE',
                        headers: NGROK_HEADERS,
                        credentials: 'include',
                    })];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 2:
                    envelope = (_f.sent());
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, apiDelete(path, true)];
                case 4:
                    if (res.ok) {
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_b = envelope.code) !== null && _b !== void 0 ? _b : 'unknown', (_e = (_d = (_c = envelope.errors) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : envelope.message) !== null && _e !== void 0 ? _e : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _a = extractErrorInfo(envelope), code = _a.code, message = _a.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
function apiGet(path_1) {
    return __awaiter(this, arguments, void 0, function (path, retried) {
        var res, envelope, unauthorized, _a, code, message;
        var _b, _c, _d, _e;
        if (retried === void 0) { retried = false; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, fetch(buildUrl(path), {
                        method: 'GET',
                        headers: NGROK_HEADERS,
                        credentials: 'include',
                    })];
                case 1:
                    res = _f.sent();
                    return [4 /*yield*/, res.json().catch(function () { return null; })];
                case 2:
                    envelope = (_f.sent());
                    unauthorized = res.status === 401 || (envelope != null && !envelope.success && envelope.code === 'unauthorized');
                    if (!(unauthorized && !isAuthEndpoint(path) && !retried)) return [3 /*break*/, 4];
                    return [4 /*yield*/, handleUnauthorized(path)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, apiGet(path, true)];
                case 4:
                    if (res.ok) {
                        if (!envelope)
                            return [2 /*return*/, null];
                        if (!envelope.success) {
                            throw new AuthError((_b = envelope.code) !== null && _b !== void 0 ? _b : 'unknown', (_e = (_d = (_c = envelope.errors) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : envelope.message) !== null && _e !== void 0 ? _e : undefined);
                        }
                        return [2 /*return*/, envelope.data];
                    }
                    _a = extractErrorInfo(envelope), code = _a.code, message = _a.message;
                    throw new AuthError(code, message);
            }
        });
    });
}
