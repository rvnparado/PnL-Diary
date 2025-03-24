"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
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
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var auth_1 = require("firebase/auth");
// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBTYEt1ZwC84RaeorU6gMgK5SRr6RJ-2J0",
    authDomain: "pnl-diary.firebaseapp.com",
    projectId: "pnl-diary",
    storageBucket: "pnl-diary.firebasestorage.app",
    messagingSenderId: "242104324100",
    appId: "1:242104324100:web:0c75480cf194c5b2e9e551",
    measurementId: "G-J7RXPZSMCR"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
var auth = (0, auth_1.getAuth)();
// Sample trades data
var sampleTrades = [
    {
        pair: 'BTC/USDT',
        type: 'LONG',
        entryPrice: 65000,
        exitPrice: 67000,
        quantity: 0.5,
        status: 'CLOSED',
        strategy: ['Breakout'],
        indicators: ['RSI', 'MACD'],
        notes: 'Strong momentum breakout above resistance',
        mistakes: [],
        closedAt: new Date()
    },
    {
        pair: 'ETH/USDT',
        type: 'SHORT',
        entryPrice: 3500,
        exitPrice: 3300,
        quantity: 2,
        status: 'CLOSED',
        strategy: ['Trend Following'],
        indicators: ['Moving Average', 'Volume'],
        notes: 'Bearish divergence on RSI',
        mistakes: ['Entered too early'],
        closedAt: new Date()
    },
    {
        pair: 'SOL/USDT',
        type: 'LONG',
        entryPrice: 120,
        exitPrice: 0,
        quantity: 10,
        status: 'OPEN',
        strategy: ['Support Bounce'],
        indicators: ['Support/Resistance', 'RSI'],
        notes: 'Multiple timeframe confluence at support',
        mistakes: []
    }
];
function addSampleTrades() {
    return __awaiter(this, void 0, void 0, function () {
        var email, password, userCredential, error_1, userId, _i, sampleTrades_1, trade, tradeWithUserId, docRef, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, , 15]);
                    email = "testing@testing.com";
                    password = "testing";
                    userCredential = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 7]);
                    console.log('Creating new account...');
                    return [4 /*yield*/, (0, auth_1.createUserWithEmailAndPassword)(auth, email, password)];
                case 2:
                    userCredential = _a.sent();
                    console.log('Account created successfully');
                    return [3 /*break*/, 7];
                case 3:
                    error_1 = _a.sent();
                    if (!(error_1.code === 'auth/email-already-in-use')) return [3 /*break*/, 5];
                    console.log('Account already exists, signing in...');
                    return [4 /*yield*/, (0, auth_1.signInWithEmailAndPassword)(auth, email, password)];
                case 4:
                    userCredential = _a.sent();
                    console.log('Signed in successfully');
                    return [3 /*break*/, 6];
                case 5: throw error_1;
                case 6: return [3 /*break*/, 7];
                case 7:
                    userId = userCredential.user.uid;
                    console.log("Authenticated as user: ".concat(userId));
                    _i = 0, sampleTrades_1 = sampleTrades;
                    _a.label = 8;
                case 8:
                    if (!(_i < sampleTrades_1.length)) return [3 /*break*/, 13];
                    trade = sampleTrades_1[_i];
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    tradeWithUserId = __assign(__assign({}, trade), { userId: userId, createdAt: new Date(), updatedAt: new Date() });
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, 'trades'), tradeWithUserId)];
                case 10:
                    docRef = _a.sent();
                    console.log("Added trade with ID: ".concat(docRef.id));
                    return [3 /*break*/, 12];
                case 11:
                    error_2 = _a.sent();
                    console.error('Error adding trade:', error_2);
                    return [3 /*break*/, 12];
                case 12:
                    _i++;
                    return [3 /*break*/, 8];
                case 13:
                    console.log('Finished adding sample trades');
                    process.exit(0);
                    return [3 /*break*/, 15];
                case 14:
                    error_3 = _a.sent();
                    console.error('Error:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Run the script
addSampleTrades();

var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function (t) {
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
    var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
var app_1 = require("firebase/app");
var firestore_1 = require("firebase/firestore");
var auth_1 = require("firebase/auth");
// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBTYEt1ZwC84RaeorU6gMgK5SRr6RJ-2J0",
    authDomain: "pnl-diary.firebaseapp.com",
    projectId: "pnl-diary",
    storageBucket: "pnl-diary.firebasestorage.app",
    messagingSenderId: "242104324100",
    appId: "1:242104324100:web:0c75480cf194c5b2e9e551",
    measurementId: "G-J7RXPZSMCR"
};
// Initialize Firebase
var app = (0, app_1.initializeApp)(firebaseConfig);
var db = (0, firestore_1.getFirestore)(app);
var auth = (0, auth_1.getAuth)();
// Sample trades data
var sampleTrades = [
    {
        pair: 'BTC/USDT',
        type: 'LONG',
        entryPrice: 65000,
        exitPrice: 67000,
        quantity: 0.5,
        status: 'CLOSED',
        strategy: ['Breakout'],
        indicators: ['RSI', 'MACD'],
        notes: 'Strong momentum breakout above resistance',
        mistakes: [],
        closedAt: new Date()
    },
    {
        pair: 'ETH/USDT',
        type: 'SHORT',
        entryPrice: 3500,
        exitPrice: 3300,
        quantity: 2,
        status: 'CLOSED',
        strategy: ['Trend Following'],
        indicators: ['Moving Average', 'Volume'],
        notes: 'Bearish divergence on RSI',
        mistakes: ['Entered too early'],
        closedAt: new Date()
    },
    {
        pair: 'SOL/USDT',
        type: 'LONG',
        entryPrice: 120,
        exitPrice: 0,
        quantity: 10,
        status: 'OPEN',
        strategy: ['Support Bounce'],
        indicators: ['Support/Resistance', 'RSI'],
        notes: 'Multiple timeframe confluence at support',
        mistakes: []
    }
];
function addSampleTrades() {
    return __awaiter(this, void 0, void 0, function () {
        var email, password, userCredential, error_1, userId, _i, sampleTrades_1, trade, tradeWithUserId, docRef, error_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, , 15]);
                    email = "testing@testing.com";
                    password = "testing";
                    userCredential = void 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 7]);
                    console.log('Creating new account...');
                    return [4 /*yield*/, (0, auth_1.createUserWithEmailAndPassword)(auth, email, password)];
                case 2:
                    userCredential = _a.sent();
                    console.log('Account created successfully');
                    return [3 /*break*/, 7];
                case 3:
                    error_1 = _a.sent();
                    if (!(error_1.code === 'auth/email-already-in-use')) return [3 /*break*/, 5];
                    console.log('Account already exists, signing in...');
                    return [4 /*yield*/, (0, auth_1.signInWithEmailAndPassword)(auth, email, password)];
                case 4:
                    userCredential = _a.sent();
                    console.log('Signed in successfully');
                    return [3 /*break*/, 6];
                case 5: throw error_1;
                case 6: return [3 /*break*/, 7];
                case 7:
                    userId = userCredential.user.uid;
                    console.log("Authenticated as user: ".concat(userId));
                    _i = 0, sampleTrades_1 = sampleTrades;
                    _a.label = 8;
                case 8:
                    if (!(_i < sampleTrades_1.length)) return [3 /*break*/, 13];
                    trade = sampleTrades_1[_i];
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    tradeWithUserId = __assign(__assign({}, trade), { userId: userId, createdAt: new Date(), updatedAt: new Date() });
                    return [4 /*yield*/, (0, firestore_1.addDoc)((0, firestore_1.collection)(db, 'trades'), tradeWithUserId)];
                case 10:
                    docRef = _a.sent();
                    console.log("Added trade with ID: ".concat(docRef.id));
                    return [3 /*break*/, 12];
                case 11:
                    error_2 = _a.sent();
                    console.error('Error adding trade:', error_2);
                    return [3 /*break*/, 12];
                case 12:
                    _i++;
                    return [3 /*break*/, 8];
                case 13:
                    console.log('Finished adding sample trades');
                    process.exit(0);
                    return [3 /*break*/, 15];
                case 14:
                    error_3 = _a.sent();
                    console.error('Error:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Run the script
addSampleTrades();
