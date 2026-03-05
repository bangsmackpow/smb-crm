import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
function App() {
    const [count, setCount] = useState(0);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h1", { children: "SMB CRM" }), _jsx("p", { children: "A modern CRM for freelancers, SMBs, and non-profits" })] }), _jsxs("div", { className: "card", children: [_jsxs("button", { onClick: () => setCount((count) => count + 1), children: ["count is ", count] }), _jsxs("p", { children: ["Edit ", _jsx("code", { children: "src/App.tsx" }), " and save to test HMR"] })] }), _jsx("p", { className: "read-the-docs", children: "Click on the Vite and React logos to learn more" })] }));
}
export default App;
