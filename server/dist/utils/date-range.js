"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipToDate = void 0;
const clipToDate = (start, end) => {
    const s = start ? String(start).substring(0, 10) : undefined;
    const e = end ? String(end).substring(0, 10) : undefined;
    return { start: s, end: e };
};
exports.clipToDate = clipToDate;
//# sourceMappingURL=date-range.js.map