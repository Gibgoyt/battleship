globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as componentQrl, i as inlinedQrl, u as useSignal, e as useVisibleTaskQrl, f as _noopQrl, _ as _jsxQ, b as useLexicalScope } from './server_DL1pyFlX.mjs';

const s_v33tTBhKvLc = (dark) => {
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};
const s_RIEMi9ZVdkM = () => {
  const [isDark, updateDarkMode] = useLexicalScope();
  const newDarkMode = !isDark.value;
  isDark.value = newDarkMode;
  localStorage.setItem("darkMode", newDarkMode.toString());
  updateDarkMode(newDarkMode);
};
const s_LtNQoBY7DZo = () => {
  const isDark = useSignal(false);
  const updateDarkMode = /* @__PURE__ */ inlinedQrl(s_v33tTBhKvLc, "s_v33tTBhKvLc");
  useVisibleTaskQrl(/* @__PURE__ */ _noopQrl("s_iCE2ezTkjPg", [
    isDark,
    updateDarkMode
  ]));
  const toggleDarkMode = /* @__PURE__ */ inlinedQrl(s_RIEMi9ZVdkM, "s_RIEMi9ZVdkM", [
    isDark,
    updateDarkMode
  ]);
  return /* @__PURE__ */ _jsxQ("button", null, {
    class: "fixed bottom-6 right-6 p-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg z-50",
    "aria-label": "Toggle dark mode",
    onClick$: toggleDarkMode
  }, isDark.value ? /* @__PURE__ */ _jsxQ("svg", null, {
    class: "w-5 h-5 text-yellow-500",
    fill: "currentColor",
    viewBox: "0 0 20 20"
  }, /* @__PURE__ */ _jsxQ("path", null, {
    d: "M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
  }, null, 3, null), 3, "5z_0") : /* @__PURE__ */ _jsxQ("svg", null, {
    class: "w-5 h-5 text-gray-700",
    fill: "currentColor",
    viewBox: "0 0 20 20"
  }, /* @__PURE__ */ _jsxQ("path", null, {
    d: "M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
  }, null, 3, null), 3, null), 1, "5z_1");
};
const DarkModeToggle = /* @__PURE__ */ componentQrl(/* @__PURE__ */ inlinedQrl(s_LtNQoBY7DZo, "s_LtNQoBY7DZo"));

export { DarkModeToggle as D };
