"use strict";
/**
 * Simple Server to test basic setup
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.json({
        message: 'Notice API is running!',
        version: '2.0.0',
        status: 'OK'
    });
});
app.listen(PORT, () => {
    console.log(`✓ Server is running on port ${PORT}`);
    console.log(`✓ Visit http://localhost:${PORT}`);
});
//# sourceMappingURL=server-simple.js.map