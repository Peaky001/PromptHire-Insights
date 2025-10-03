/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// Background script for LinkedIn Profile Scraper extension

// Extension installation/startup
chrome.runtime.onInstalled.addListener(function () {
  console.log('LinkedIn Profile Scraper extension installed');
});

// Clear job selection when extension is disabled/uninstalled
chrome.runtime.onSuspend.addListener(function () {
  console.log('Extension is being suspended, clearing job selection');
  chrome.storage.sync.remove(['selectedJobOpening'], function () {
    console.log('Job selection cleared on extension suspend');
  });
});

// Clear job selection when extension is disabled
chrome.management.onDisabled.addListener(function (extensionInfo) {
  if (extensionInfo.id === chrome.runtime.id) {
    console.log('Extension is being disabled, clearing job selection');
    chrome.storage.sync.remove(['selectedJobOpening'], function () {
      console.log('Job selection cleared on extension disable');
    });
  }
});

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'scrapeProfile') {
    // Forward the message to the active tab's content script
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, function (response) {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              error: 'Content script not available. Please refresh the LinkedIn page.'
            });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({
          success: false,
          error: 'No active tab found'
        });
      }
    });
    return true; // Will respond asynchronously
  }
  if (request.action === 'sendToAPI') {
    // Handle API call
    handleAPICall(request.data, request.apiUrl).then(function (response) {
      return sendResponse({
        success: true,
        response: response
      });
    })["catch"](function (error) {
      return sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Will respond asynchronously
  }
  if (request.action === 'fetchJobOpenings') {
    // Fetch job openings from PromptHire API
    fetchJobOpenings().then(function (data) {
      return sendResponse({
        success: true,
        data: data
      });
    })["catch"](function (error) {
      return sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Will respond asynchronously
  }
  if (request.action === 'sendApplicant') {
    // Send applicant data to PromptHire API
    sendApplicant(request.data).then(function (response) {
      return sendResponse({
        success: true,
        response: response
      });
    })["catch"](function (error) {
      return sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Will respond asynchronously
  }
});

// PromptHire API configuration
var PROMPTHIRE_API_BASE = 'https://prompthire.org/api';
var PROMPTHIRE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhkZjdlYjNkNDQ1NWJlNTM5ZWVhMDdiIiwidXNlcl9uYW1lIjoicGhsaW5rZWRpbiIsInVzZXJfZW1haWwiOiJzaHJleWFzaEBwcm9tcHRoaXJlLmFpIiwib3JnX2lkcyI6WyI2NzNmNjU0NzExZmJlN2U1ZWQxZjM5MmUiXSwiZXhwIjoxNzYwNzczNDUyfQ.lCZEYRd0BNdLz8d96vwJHf7ZLEAUbAdSt6XOMgPGTnY';

// Function to fetch job openings
function fetchJobOpenings() {
  return _fetchJobOpenings.apply(this, arguments);
} // Function to send applicant data
function _fetchJobOpenings() {
  _fetchJobOpenings = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
    var response, errorText, result, _t2;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.p = _context2.n) {
        case 0:
          _context2.p = 0;
          console.log('Fetching job openings from:', "".concat(PROMPTHIRE_API_BASE, "/jobopenings"));
          _context2.n = 1;
          return fetch("".concat(PROMPTHIRE_API_BASE, "/jobopenings"), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': "Bearer ".concat(PROMPTHIRE_TOKEN)
            }
          });
        case 1:
          response = _context2.v;
          console.log('Job openings response status:', response.status);
          if (response.ok) {
            _context2.n = 3;
            break;
          }
          _context2.n = 2;
          return response.text();
        case 2:
          errorText = _context2.v;
          console.error('Job openings API error:', errorText);
          throw new Error("Failed to fetch job openings: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
        case 3:
          _context2.n = 4;
          return response.json();
        case 4:
          result = _context2.v;
          console.log('Job openings result:', result);
          return _context2.a(2, result);
        case 5:
          _context2.p = 5;
          _t2 = _context2.v;
          console.error('Fetch job openings error:', _t2);
          throw _t2;
        case 6:
          return _context2.a(2);
      }
    }, _callee2, null, [[0, 5]]);
  }));
  return _fetchJobOpenings.apply(this, arguments);
}
function sendApplicant(_x) {
  return _sendApplicant.apply(this, arguments);
} // Function to handle API calls
function _sendApplicant() {
  _sendApplicant = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(applicantData) {
    var response, errorText, result, _t3;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.p = _context3.n) {
        case 0:
          _context3.p = 0;
          console.log('Sending applicant to:', "".concat(PROMPTHIRE_API_BASE, "/applicants"));
          console.log('Applicant data:', applicantData);
          _context3.n = 1;
          return fetch("".concat(PROMPTHIRE_API_BASE, "/applicants"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': "Bearer ".concat(PROMPTHIRE_TOKEN)
            },
            body: JSON.stringify(applicantData)
          });
        case 1:
          response = _context3.v;
          console.log('Send applicant response status:', response.status);
          if (response.ok) {
            _context3.n = 3;
            break;
          }
          _context3.n = 2;
          return response.text();
        case 2:
          errorText = _context3.v;
          console.error('Send applicant API error:', errorText);
          throw new Error("Failed to send applicant: ".concat(response.status, " ").concat(response.statusText, " - ").concat(errorText));
        case 3:
          _context3.n = 4;
          return response.json();
        case 4:
          result = _context3.v;
          console.log('Send applicant result:', result);
          return _context3.a(2, result);
        case 5:
          _context3.p = 5;
          _t3 = _context3.v;
          console.error('Send applicant error:', _t3);
          throw _t3;
        case 6:
          return _context3.a(2);
      }
    }, _callee3, null, [[0, 5]]);
  }));
  return _sendApplicant.apply(this, arguments);
}
function handleAPICall(_x2, _x3) {
  return _handleAPICall.apply(this, arguments);
} // Check if current tab is LinkedIn
function _handleAPICall() {
  _handleAPICall = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(profileData, apiUrl) {
    var response, result, _t4;
    return _regenerator().w(function (_context4) {
      while (1) switch (_context4.p = _context4.n) {
        case 0:
          _context4.p = 0;
          if (apiUrl) {
            _context4.n = 1;
            break;
          }
          throw new Error('API URL is required');
        case 1:
          _context4.n = 2;
          return fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              profileData: profileData,
              timestamp: new Date().toISOString(),
              source: 'linkedin-scraper-extension'
            })
          });
        case 2:
          response = _context4.v;
          if (response.ok) {
            _context4.n = 3;
            break;
          }
          throw new Error("API call failed with status: ".concat(response.status));
        case 3:
          _context4.n = 4;
          return response.json();
        case 4:
          result = _context4.v;
          return _context4.a(2, result);
        case 5:
          _context4.p = 5;
          _t4 = _context4.v;
          console.error('API call error:', _t4);
          throw _t4;
        case 6:
          return _context4.a(2);
      }
    }, _callee4, null, [[0, 5]]);
  }));
  return _handleAPICall.apply(this, arguments);
}
chrome.tabs.onActivated.addListener(/*#__PURE__*/function () {
  var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(activeInfo) {
    var tab, _t;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.p = _context.n) {
        case 0:
          _context.p = 0;
          _context.n = 1;
          return chrome.tabs.get(activeInfo.tabId);
        case 1:
          tab = _context.v;
          if (tab.url && (tab.url.includes('linkedin.com/in/') || tab.url.includes('www.linkedin.com/in/'))) {
            // Enable the extension icon when on LinkedIn profile page
            chrome.action.enable(activeInfo.tabId);
          } else {
            // Optionally disable on non-LinkedIn pages
            // chrome.action.disable(activeInfo.tabId);
          }
          _context.n = 3;
          break;
        case 2:
          _context.p = 2;
          _t = _context.v;
          console.error('Error checking tab:', _t);
        case 3:
          return _context.a(2);
      }
    }, _callee, null, [[0, 2]]);
  }));
  return function (_x4) {
    return _ref.apply(this, arguments);
  };
}());
console.log('LinkedIn Profile Scraper background script loaded');
/******/ })()
;
//# sourceMappingURL=background.js.map