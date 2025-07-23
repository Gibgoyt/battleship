globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createComponent, a as createAstro, e as addAttribute, f as renderHead, r as renderComponent, d as renderTemplate } from '../../chunks/astro/server_CzDYtiW_.mjs';
import { c as componentQrl, i as inlinedQrl, _ as _jsxQ, a as _fnSignal, u as useSignal, b as useLexicalScope, d as _jsxBranch, e as useVisibleTaskQrl, f as _noopQrl, g as _wrapSignal, h as _jsxC, j as _IMMUTABLE } from '../../chunks/server_DL1pyFlX.mjs';
/* empty css                                    */
import { j as jwtValidator } from '../../chunks/jwt-validator_BY4779SR.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_DEYiRc3l.mjs';

const s_YpbvDIGcfwI = (props) => {
  return /* @__PURE__ */ _jsxQ("div", null, {
    class: "min-h-[calc(100vh-2rem)]"
  }, [
    /* @__PURE__ */ _jsxQ("div", null, {
      class: "mb-8"
    }, [
      /* @__PURE__ */ _jsxQ("h1", null, {
        class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
          props
        ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
      }, "Dashboard", 3, null),
      /* @__PURE__ */ _jsxQ("p", null, {
        class: _fnSignal((p0) => `mt-2 ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
          props
        ], '`mt-2 ${p0.isDark?"text-gray-400":"text-gray-600"}`')
      }, "Welcome to your Qwik application", 3, null)
    ], 3, null),
    /* @__PURE__ */ _jsxQ("div", null, {
      class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    }, [
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `p-6 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"}`, [
          props
        ], '`p-6 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"}`')
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center justify-between mb-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, null, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "Total Users", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "1,234", 3, null)
          ], 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-6 h-6 text-blue-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          }, null, 3, null), 3, null), 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "text-sm text-green-600"
        }, "+8% from last week", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `p-6 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"}`, [
          props
        ], '`p-6 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"}`')
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center justify-between mb-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, null, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "Active Sessions", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "423", 3, null)
          ], 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-6 h-6 text-green-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M13 10V3L4 14h7v7l9-11h-7z"
          }, null, 3, null), 3, null), 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "text-sm text-green-600"
        }, "+15% from yesterday", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `p-6 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"}`, [
          props
        ], '`p-6 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"}`')
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center justify-between mb-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, null, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "Performance", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "98.5%", 3, null)
          ], 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-6 h-6 text-purple-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          }, null, 3, null), 3, null), 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "text-sm text-green-600"
        }, "+2.3% from last hour", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `p-6 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"}`, [
          props
        ], '`p-6 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"}`')
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center justify-between mb-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, null, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "Errors", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "12", 3, null)
          ], 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-6 h-6 text-red-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          }, null, 3, null), 3, null), 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "text-sm text-red-600"
        }, "-25% from last hour", 3, null)
      ], 3, null)
    ], 3, null),
    /* @__PURE__ */ _jsxQ("div", null, {
      class: _fnSignal((p0) => `p-6 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"} mb-8`, [
        props
      ], '`p-6 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"} mb-8`')
    }, [
      /* @__PURE__ */ _jsxQ("h2", null, {
        class: _fnSignal((p0) => `text-xl font-bold mb-4 ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
          props
        ], '`text-xl font-bold mb-4 ${p0.isDark?"text-gray-100":"text-gray-900"}`')
      }, "Recent Activity", 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: "space-y-4"
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center gap-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-5 h-5 text-blue-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          }, null, 3, null), 3, null), 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "flex-1"
          }, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "System health check completed", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "2 minutes ago", 3, null)
          ], 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center gap-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-10 h-10 bg-green-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-5 h-5 text-green-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          }, null, 3, null), 3, null), 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "flex-1"
          }, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "New user feedback received", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "15 minutes ago", 3, null)
          ], 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center gap-4"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-5 h-5 text-purple-600",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          }, null, 3, null), 3, null), 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "flex-1"
          }, [
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
                props
              ], '`${p0.isDark?"text-gray-100":"text-gray-900"}`')
            }, "Database backup completed", 3, null),
            /* @__PURE__ */ _jsxQ("p", null, {
              class: _fnSignal((p0) => `text-sm ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
                props
              ], '`text-sm ${p0.isDark?"text-gray-400":"text-gray-600"}`')
            }, "1 hour ago", 3, null)
          ], 3, null)
        ], 3, null)
      ], 3, null)
    ], 3, null),
    /* @__PURE__ */ _jsxQ("div", null, {
      class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    }, [
      /* @__PURE__ */ _jsxQ("button", {
        class: `p-4 rounded-lg shadow-md transition-all duration-200 ${props.isDark ? "bg-zinc-800 hover:bg-zinc-700 text-gray-100" : "bg-white hover:bg-gray-50 text-gray-900"}`
      }, null, [
        /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-8 h-8 text-blue-600 mb-2",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M12 6v6m0 0v6m0-6h6m-6 0H6"
        }, null, 3, null), 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "font-medium"
        }, "New Project", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("button", {
        class: `p-4 rounded-lg shadow-md transition-all duration-200 ${props.isDark ? "bg-zinc-800 hover:bg-zinc-700 text-gray-100" : "bg-white hover:bg-gray-50 text-gray-900"}`
      }, null, [
        /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-8 h-8 text-green-600 mb-2",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        }, null, 3, null), 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "font-medium"
        }, "Reports", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("button", {
        class: `p-4 rounded-lg shadow-md transition-all duration-200 ${props.isDark ? "bg-zinc-800 hover:bg-zinc-700 text-gray-100" : "bg-white hover:bg-gray-50 text-gray-900"}`
      }, null, [
        /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-8 h-8 text-purple-600 mb-2",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, [
          /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          }, null, 3, null),
          /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          }, null, 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "font-medium"
        }, "Settings", 3, null)
      ], 3, null),
      /* @__PURE__ */ _jsxQ("button", {
        class: `p-4 rounded-lg shadow-md transition-all duration-200 ${props.isDark ? "bg-zinc-800 hover:bg-zinc-700 text-gray-100" : "bg-white hover:bg-gray-50 text-gray-900"}`
      }, null, [
        /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-8 h-8 text-red-600 mb-2",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        }, null, 3, null), 3, null),
        /* @__PURE__ */ _jsxQ("p", null, {
          class: "font-medium"
        }, "Support", 3, null)
      ], 3, null)
    ], 1, null)
  ], 1, "qa_0");
};
const DashboardPage = /* @__PURE__ */ componentQrl(/* @__PURE__ */ inlinedQrl(s_YpbvDIGcfwI, "s_YpbvDIGcfwI"));

const s_aBZ4dSZDVF4 = () => {
  const [count] = useLexicalScope();
  count.value++;
};
const s_glbgUBcJ0UM = () => {
  const [count] = useLexicalScope();
  count.value--;
};
const s_AST4cuPJhLk = () => {
  const [count] = useLexicalScope();
  count.value = 0;
};
const s_ob6dVgL9jQo = (props) => {
  const count = useSignal(0);
  const increment = /* @__PURE__ */ inlinedQrl(s_aBZ4dSZDVF4, "s_aBZ4dSZDVF4", [
    count
  ]);
  const decrement = /* @__PURE__ */ inlinedQrl(s_glbgUBcJ0UM, "s_glbgUBcJ0UM", [
    count
  ]);
  const reset = /* @__PURE__ */ inlinedQrl(s_AST4cuPJhLk, "s_AST4cuPJhLk", [
    count
  ]);
  return /* @__PURE__ */ _jsxQ("div", null, {
    class: "min-h-[calc(100vh-2rem)]"
  }, [
    /* @__PURE__ */ _jsxQ("div", null, {
      class: "mb-8"
    }, [
      /* @__PURE__ */ _jsxQ("h1", null, {
        class: _fnSignal((p0) => `text-3xl font-bold ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
          props
        ], '`text-3xl font-bold ${p0.isDark?"text-gray-100":"text-gray-900"}`')
      }, "Counter", 3, null),
      /* @__PURE__ */ _jsxQ("p", null, {
        class: _fnSignal((p0) => `mt-2 ${p0.isDark ? "text-gray-400" : "text-gray-600"}`, [
          props
        ], '`mt-2 ${p0.isDark?"text-gray-400":"text-gray-600"}`')
      }, "A simple counter demonstration with Qwik", 3, null)
    ], 3, null),
    /* @__PURE__ */ _jsxQ("div", null, {
      class: _fnSignal((p0) => `max-w-md mx-auto p-8 rounded-xl shadow-lg ${p0.isDark ? "bg-zinc-800" : "bg-white"}`, [
        props
      ], '`max-w-md mx-auto p-8 rounded-xl shadow-lg ${p0.isDark?"bg-zinc-800":"bg-white"}`')
    }, /* @__PURE__ */ _jsxQ("div", null, {
      class: "text-center"
    }, [
      /* @__PURE__ */ _jsxQ("h2", null, {
        class: _fnSignal((p0) => `text-2xl font-semibold mb-8 ${p0.isDark ? "text-gray-100" : "text-gray-900"}`, [
          props
        ], '`text-2xl font-semibold mb-8 ${p0.isDark?"text-gray-100":"text-gray-900"}`')
      }, "Counter Value", 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `text-6xl font-bold mb-8 ${p0.isDark ? "text-blue-400" : "text-blue-600"}`, [
          props
        ], '`text-6xl font-bold mb-8 ${p0.isDark?"text-blue-400":"text-blue-600"}`')
      }, _fnSignal((p0) => p0.value, [
        count
      ], "p0.value"), 3, null),
      /* @__PURE__ */ _jsxQ("div", null, {
        class: "flex gap-4 justify-center"
      }, [
        /* @__PURE__ */ _jsxQ("button", null, {
          class: _fnSignal((p0) => `px-6 py-3 rounded-lg font-medium transition-colors ${p0.isDark ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`, [
            props
          ], '`px-6 py-3 rounded-lg font-medium transition-colors ${p0.isDark?"bg-red-600 hover:bg-red-700 text-white":"bg-red-500 hover:bg-red-600 text-white"}`'),
          onClick$: decrement
        }, "Decrement", 3, null),
        /* @__PURE__ */ _jsxQ("button", {
          class: `px-6 py-3 rounded-lg font-medium transition-colors ${props.isDark ? "bg-zinc-700 hover:bg-zinc-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`
        }, {
          onClick$: reset
        }, "Reset", 3, null),
        /* @__PURE__ */ _jsxQ("button", {
          class: `px-6 py-3 rounded-lg font-medium transition-colors ${props.isDark ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`
        }, {
          onClick$: increment
        }, "Increment", 3, null)
      ], 1, null)
    ], 1, null), 1, null)
  ], 1, "VD_0");
};
const CounterPage = /* @__PURE__ */ componentQrl(/* @__PURE__ */ inlinedQrl(s_ob6dVgL9jQo, "s_ob6dVgL9jQo"));

const getInitialDarkMode = () => {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark") || localStorage.getItem("darkMode") === "true" || !localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches;
};
const s_FfOWEgYY90U = (path) => {
  const [currentPath, isMobile, sidebarOpen] = useLexicalScope();
  currentPath.value = path;
  if (typeof window !== "undefined") {
    const fullPath = `/profile${path}`;
    window.history.pushState({}, "", fullPath);
  }
  if (isMobile.value) sidebarOpen.value = false;
};
const s_Y3JZGnF1Kaw = () => {
  const [sidebarOpen] = useLexicalScope();
  sidebarOpen.value = !sidebarOpen.value;
};
const s_20Dtgg2dPx4 = () => {
  const [isMobile, sidebarOpen] = useLexicalScope();
  if (isMobile.value) sidebarOpen.value = false;
};
const s_BaDEqT4bFro = (dark) => {
  const [isDark] = useLexicalScope();
  isDark.value = dark;
  localStorage.setItem("darkMode", dark.toString());
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
};
const s_SAOE79kCdy8 = () => {
  const [isDark, updateTheme] = useLexicalScope();
  updateTheme(!isDark.value);
};
const s_FxY30v92Dk4 = () => {
  _jsxBranch();
  const currentPath = useSignal("/dashboard");
  const isDark = useSignal(getInitialDarkMode());
  const sidebarOpen = useSignal(false);
  const isMobile = useSignal(false);
  const navigate = /* @__PURE__ */ inlinedQrl(s_FfOWEgYY90U, "s_FfOWEgYY90U", [
    currentPath,
    isMobile,
    sidebarOpen
  ]);
  const toggleSidebar = /* @__PURE__ */ inlinedQrl(s_Y3JZGnF1Kaw, "s_Y3JZGnF1Kaw", [
    sidebarOpen
  ]);
  const closeSidebar = /* @__PURE__ */ inlinedQrl(s_20Dtgg2dPx4, "s_20Dtgg2dPx4", [
    isMobile,
    sidebarOpen
  ]);
  useVisibleTaskQrl(/* @__PURE__ */ _noopQrl("s_3rGnwyQiEkY", [
    currentPath,
    isMobile,
    sidebarOpen
  ]));
  useVisibleTaskQrl(/* @__PURE__ */ _noopQrl("s_fidoRWlU0C4", [
    isDark
  ]));
  const updateTheme = /* @__PURE__ */ inlinedQrl(s_BaDEqT4bFro, "s_BaDEqT4bFro", [
    isDark
  ]);
  const toggleTheme = /* @__PURE__ */ inlinedQrl(s_SAOE79kCdy8, "s_SAOE79kCdy8", [
    isDark,
    updateTheme
  ]);
  const navigationItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      label: "Dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    },
    {
      id: "counter",
      path: "/counter",
      label: "Counter",
      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    }
  ];
  return /* @__PURE__ */ _jsxQ("div", null, {
    class: _fnSignal((p0) => `min-h-screen flex ${p0.value ? "bg-zinc-900 text-gray-100" : "bg-gray-50"}`, [
      isDark
    ], '`min-h-screen flex ${p0.value?"bg-zinc-900 text-gray-100":"bg-gray-50"}`')
  }, [
    isMobile.value && sidebarOpen.value && /* @__PURE__ */ _jsxQ("div", null, {
      class: "fixed inset-0 z-40 lg:hidden",
      style: "backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); background-color: rgba(0, 0, 0, 0.3);",
      onClick$: closeSidebar
    }, null, 3, "xY_0"),
    /* @__PURE__ */ _jsxQ("div", {
      class: `w-64 min-h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen.value ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 ${isDark.value ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"} border-r shadow-lg ${!sidebarOpen.value && !isMobile.value ? "lg:w-16" : "lg:w-64"}`
    }, null, [
      /* @__PURE__ */ _jsxQ("div", null, {
        class: _fnSignal((p0) => `p-6 border-b ${p0.value ? "border-zinc-700" : "border-gray-200"}`, [
          isDark
        ], '`p-6 border-b ${p0.value?"border-zinc-700":"border-gray-200"}`')
      }, [
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center justify-between"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, {
            class: _fnSignal((p0, p1) => `flex items-center space-x-3 ${!p1.value && !p0.value ? "lg:justify-center lg:space-x-0" : ""}`, [
              isMobile,
              sidebarOpen
            ], '`flex items-center space-x-3 ${!p1.value&&!p0.value?"lg:justify-center lg:space-x-0":""}`')
          }, [
            /* @__PURE__ */ _jsxQ("div", null, {
              class: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"
            }, /* @__PURE__ */ _jsxQ("svg", null, {
              class: "w-5 h-5 text-white",
              fill: "none",
              stroke: "currentColor",
              viewBox: "0 0 24 24"
            }, /* @__PURE__ */ _jsxQ("path", null, {
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
              "stroke-width": "2",
              d: "M13 10V3L4 14h7v7l9-11h-7z"
            }, null, 3, null), 3, null), 3, null),
            /* @__PURE__ */ _jsxQ("h1", null, {
              class: _fnSignal((p0, p1, p2) => `text-lg font-bold ${p0.value ? "text-gray-100" : "text-gray-800"} ${!p2.value && !p1.value ? "lg:hidden" : ""}`, [
                isDark,
                isMobile,
                sidebarOpen
              ], '`text-lg font-bold ${p0.value?"text-gray-100":"text-gray-800"} ${!p2.value&&!p1.value?"lg:hidden":""}`')
            }, "Qwik App", 3, null)
          ], 3, null),
          /* @__PURE__ */ _jsxQ("div", null, {
            class: _fnSignal((p0, p1) => `flex items-center gap-2 ${!p1.value && !p0.value ? "lg:hidden" : ""}`, [
              isMobile,
              sidebarOpen
            ], '`flex items-center gap-2 ${!p1.value&&!p0.value?"lg:hidden":""}`')
          }, /* @__PURE__ */ _jsxQ("button", null, {
            class: _fnSignal((p0) => `p-2 rounded-lg transition-colors ${p0.value ? "bg-zinc-700 hover:bg-zinc-600 text-yellow-400" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`, [
              isDark
            ], '`p-2 rounded-lg transition-colors ${p0.value?"bg-zinc-700 hover:bg-zinc-600 text-yellow-400":"bg-gray-100 hover:bg-gray-200 text-gray-700"}`'),
            title: "Toggle theme",
            onClick$: toggleTheme
          }, isDark.value ? /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-4 h-4",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          }, null, 3, null), 3, "xY_1") : /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-4 h-4",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          }, null, 3, null), 3, null), 1, null), 1, null)
        ], 1, null),
        /* @__PURE__ */ _jsxQ("a", {
          class: `flex items-center gap-2 mt-4 px-3 py-2 rounded-lg transition-colors text-sm ${isDark.value ? "bg-zinc-700 hover:bg-zinc-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} ${!sidebarOpen.value && !isMobile.value ? "lg:justify-center lg:px-2" : ""}`
        }, {
          href: "/app"
        }, [
          /* @__PURE__ */ _jsxQ("span", null, null, "←", 3, null),
          /* @__PURE__ */ _jsxQ("span", null, {
            class: _fnSignal((p0, p1) => `font-medium ${!p1.value && !p0.value ? "lg:hidden" : ""}`, [
              isMobile,
              sidebarOpen
            ], '`font-medium ${!p1.value&&!p0.value?"lg:hidden":""}`')
          }, "Back to App", 3, null)
        ], 3, null)
      ], 1, null),
      /* @__PURE__ */ _jsxQ("nav", null, {
        class: "p-4"
      }, /* @__PURE__ */ _jsxQ("div", null, {
        class: "space-y-1"
      }, navigationItems.map((item) => /* @__PURE__ */ _jsxQ("button", {
        class: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-left ${currentPath.value === item.path ? "bg-blue-600 text-white shadow-md" : isDark.value ? "text-gray-300 hover:text-blue-400 hover:bg-zinc-700" : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"} ${!sidebarOpen.value && !isMobile.value ? "lg:justify-center lg:px-2" : ""}`,
        title: !sidebarOpen.value && !isMobile.value ? item.label : "",
        onClick$: /* @__PURE__ */ _noopQrl("s_36ereE51STE", [
          item,
          navigate
        ])
      }, null, [
        /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-5 h-5 flex-shrink-0",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", {
          d: _wrapSignal(item, "icon")
        }, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2"
        }, null, 3, null), 1, null),
        /* @__PURE__ */ _jsxQ("span", null, {
          class: _fnSignal((p0, p1) => !p1.value && !p0.value ? "lg:hidden" : "", [
            isMobile,
            sidebarOpen
          ], '!p1.value&&!p0.value?"lg:hidden":""')
        }, _wrapSignal(item, "label"), 1, null)
      ], 0, item.id)), 1, null), 1, null)
    ], 1, null),
    /* @__PURE__ */ _jsxQ("div", null, {
      class: _fnSignal((p0, p1) => `flex-1 transition-all duration-300 ease-in-out ${p1.value || p0.value ? "lg:ml-64" : "lg:ml-16"}`, [
        isMobile,
        sidebarOpen
      ], '`flex-1 transition-all duration-300 ease-in-out ${p1.value||p0.value?"lg:ml-64":"lg:ml-16"}`')
    }, [
      /* @__PURE__ */ _jsxQ("div", {
        class: `lg:hidden sticky top-0 z-30 ${isDark.value ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"} border-b px-4 py-3 flex items-center justify-between`
      }, null, [
        /* @__PURE__ */ _jsxQ("button", null, {
          class: _fnSignal((p0) => `p-2 rounded-lg transition-colors ${p0.value ? "bg-zinc-700 hover:bg-zinc-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`, [
            isDark
          ], '`p-2 rounded-lg transition-colors ${p0.value?"bg-zinc-700 hover:bg-zinc-600 text-gray-300":"bg-gray-100 hover:bg-gray-200 text-gray-600"}`'),
          onClick$: toggleSidebar
        }, /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-6 h-6",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M4 6h16M4 12h16M4 18h16"
        }, null, 3, null), 3, null), 3, null),
        /* @__PURE__ */ _jsxQ("div", null, {
          class: "flex items-center gap-3"
        }, [
          /* @__PURE__ */ _jsxQ("div", null, {
            class: "w-6 h-6 bg-blue-600 rounded flex items-center justify-center"
          }, /* @__PURE__ */ _jsxQ("svg", null, {
            class: "w-4 h-4 text-white",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24"
          }, /* @__PURE__ */ _jsxQ("path", null, {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M13 10V3L4 14h7v7l9-11h-7z"
          }, null, 3, null), 3, null), 3, null),
          /* @__PURE__ */ _jsxQ("h1", null, {
            class: _fnSignal((p0) => `text-lg font-bold ${p0.value ? "text-gray-100" : "text-gray-800"}`, [
              isDark
            ], '`text-lg font-bold ${p0.value?"text-gray-100":"text-gray-800"}`')
          }, "Qwik App", 3, null)
        ], 3, null),
        /* @__PURE__ */ _jsxQ("button", null, {
          class: _fnSignal((p0) => `p-2 rounded-lg transition-colors ${p0.value ? "bg-zinc-700 hover:bg-zinc-600 text-yellow-400" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`, [
            isDark
          ], '`p-2 rounded-lg transition-colors ${p0.value?"bg-zinc-700 hover:bg-zinc-600 text-yellow-400":"bg-gray-100 hover:bg-gray-200 text-gray-700"}`'),
          onClick$: toggleTheme
        }, isDark.value ? /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        }, null, 3, null), 3, "xY_2") : /* @__PURE__ */ _jsxQ("svg", null, {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24"
        }, /* @__PURE__ */ _jsxQ("path", null, {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        }, null, 3, null), 3, null), 1, null)
      ], 1, null),
      /* @__PURE__ */ _jsxQ("button", {
        class: `hidden lg:block fixed top-4 z-40 p-2 rounded-lg transition-all duration-300 ${sidebarOpen.value ? "left-60" : "left-12"} ${isDark.value ? "bg-zinc-700 hover:bg-zinc-600 text-gray-300 border-zinc-600" : "bg-white hover:bg-gray-50 text-gray-600 border-gray-300"} border shadow-md`
      }, {
        onClick$: toggleSidebar
      }, /* @__PURE__ */ _jsxQ("svg", null, {
        class: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24"
      }, /* @__PURE__ */ _jsxQ("path", null, {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": "2",
        d: _fnSignal((p0) => p0.value ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M9 5l7 7-7 7", [
          sidebarOpen
        ], 'p0.value?"M11 19l-7-7 7-7m8 14l-7-7 7-7":"M9 5l7 7-7 7"')
      }, null, 3, null), 3, null), 3, null),
      /* @__PURE__ */ _jsxQ("main", null, {
        class: "p-4 lg:p-8"
      }, [
        (currentPath.value === "/dashboard" || currentPath.value === "/") && /* @__PURE__ */ _jsxC(DashboardPage, {
          get isDark() {
            return isDark.value;
          },
          [_IMMUTABLE]: {
            isDark: _fnSignal((p0) => p0.value, [
              isDark
            ], "p0.value")
          }
        }, 3, "xY_3"),
        currentPath.value === "/counter" && /* @__PURE__ */ _jsxC(CounterPage, {
          get isDark() {
            return isDark.value;
          },
          [_IMMUTABLE]: {
            isDark: _fnSignal((p0) => p0.value, [
              isDark
            ], "p0.value")
          }
        }, 3, "xY_4")
      ], 1, null)
    ], 1, null)
  ], 1, "xY_5");
};
const App = /* @__PURE__ */ componentQrl(/* @__PURE__ */ inlinedQrl(s_FxY30v92Dk4, "s_FxY30v92Dk4"));

const $$Astro = createAstro();
const $$ = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$;
  console.log("🔒 [PROFILE SPA] Processing protected route:", Astro2.url.pathname);
  const authToken = Astro2.cookies.get("cognito-auth-token");
  console.log("🍪 [PROFILE SPA] Cookie inspection:", {
    hasCognitoToken: Boolean(authToken?.value),
    cognitoTokenValue: authToken?.value ? "PRESENT" : "MISSING",
    authStatusCookie: Astro2.cookies.get("auth-status")?.value ? "PRESENT" : "MISSING"
  });
  if (!authToken || !authToken.value) {
    console.log("❌ [PROFILE SPA] No auth token found for protected route, redirecting to sign-in");
    return Astro2.redirect("/auth/sign-in", 302);
  }
  try {
    console.log("🔍 [PROFILE SPA] Validating token for protected route access...");
    const validation = jwtValidator.validateTokenBasic(authToken.value);
    console.log("🔍 [PROFILE SPA] Protected route token validation:", {
      isValid: validation.isValid,
      isExpired: validation.isExpired,
      hasPayload: Boolean(validation.payload),
      error: validation.error,
      payloadPreview: validation.payload ? {
        sub: validation.payload.sub?.substring(0, 8) + "...",
        email: validation.payload.email,
        tokenUse: validation.payload.token_use,
        exp: new Date(validation.payload.exp * 1e3).toISOString()
      } : null
    });
    if (!validation.isValid) {
      throw new Error(validation.error || "Invalid token");
    }
    if (validation.isExpired) {
      throw new Error("Token has expired");
    }
    if (validation.payload) {
      Astro2.locals.user = {
        sub: validation.payload.sub,
        email: validation.payload.email,
        username: validation.payload["cognito:username"] || validation.payload.username,
        emailVerified: validation.payload.email_verified || false,
        groups: validation.payload["cognito:groups"] || [],
        tokenUse: validation.payload.token_use
      };
      console.log("👤 [PROFILE SPA] User info stored in locals:", {
        email: Astro2.locals.user.email,
        username: Astro2.locals.user.username,
        tokenUse: Astro2.locals.user.tokenUse
      });
    }
    console.log("✅ [PROFILE SPA] Protected route access granted");
  } catch (error) {
    console.error("❌ [PROFILE SPA] Protected route validation failed:", error);
    Astro2.cookies.delete("cognito-auth-token", {
      path: "/"
    });
    console.log("🔄 [PROFILE SPA] Redirecting to sign-in due to validation failure");
    return Astro2.redirect("/auth/sign-in", 302);
  }
  const routeSegment = Astro2.params.all || "dashboard";
  const requestedRoute = routeSegment === "" ? "/dashboard" : `/${routeSegment}`;
  const validRoutes = ["/", "/dashboard", "/counter"];
  const initialRoute = validRoutes.includes(requestedRoute) ? requestedRoute : "/dashboard";
  let initialTheme = "dark";
  const themeCookie = Astro2.cookies.get("theme");
  if (themeCookie && (themeCookie.value === "light" || themeCookie.value === "dark")) {
    initialTheme = themeCookie.value;
  }
  const userAgent = Astro2.request.headers.get("user-agent") || "";
  const viewport = Astro2.request.headers.get("sec-ch-viewport-width") || "";
  const deviceMemory = Astro2.request.headers.get("device-memory") || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isMobileViewport = viewport && parseInt(viewport) < 1024;
  const isLowMemory = deviceMemory && parseFloat(deviceMemory) <= 4;
  const hasMobileKeyword = userAgent.includes("Mobile") || userAgent.includes("mobile");
  const isLikelyMobileSimulation = userAgent.includes("Chrome") && !userAgent.includes("Mobile") && viewport && parseInt(viewport) < 768;
  const isMobileDevice = isMobileUA || isMobileViewport || hasMobileKeyword || isLikelyMobileSimulation;
  console.log("🔍 [ASTRO SSR /profile] Enhanced Mobile Detection:", {
    userAgent: userAgent.substring(0, 100),
    viewport,
    deviceMemory,
    isMobileUA,
    isMobileViewport,
    isLowMemory,
    hasMobileKeyword,
    isLikelyMobileSimulation,
    finalResult: isMobileDevice,
    url: Astro2.url.pathname
  });
  let initialSidebarOpen = false;
  const sidebarCookie = Astro2.cookies.get("sidebarOpen");
  if (isMobileDevice) {
    if (sidebarCookie && sidebarCookie.value === "true") {
      initialSidebarOpen = true;
    }
  } else {
    if (sidebarCookie && (sidebarCookie.value === "true" || sidebarCookie.value === "false")) {
      initialSidebarOpen = sidebarCookie.value === "true";
    } else {
      initialSidebarOpen = true;
    }
  }
  console.log("🎛️ [ASTRO SSR /profile] Sidebar State:", {
    sidebarCookie: sidebarCookie?.value,
    initialSidebarOpen,
    isMobileDevice,
    logic: isMobileDevice ? "mobile" : "desktop"
  });
  const htmlClass = `h-full ${initialTheme === "dark" ? "dark" : ""}`;
  const bodyClass = `h-full ${initialTheme === "dark" ? "bg-zinc-900" : "bg-gray-50"}`;
  return renderTemplate`<html lang="en"${addAttribute(htmlClass, "class")}> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Profile - Qwik SPA</title><meta name="theme-color" content="#18181b"><meta name="color-scheme" content="dark light">${renderHead()}</head> <body${addAttribute(bodyClass, "class")}> <div id="qwik-root" class="h-full"> ${renderComponent($$result, "App", App, { "client:load": true, "initialRoute": initialRoute, "initialTheme": initialTheme, "initialSidebarOpen": initialSidebarOpen, "initialIsMobile": !!isMobileDevice, "client:component-hydration": "load", "client:component-path": "src/applications-qwik/profile/App.tsx", "client:component-export": "App" })} </div> <!-- No longer need the theme detection script since we pass it as props --> </body></html>`;
}, "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/profile/[...all].astro", void 0);
const $$file = "/home/ahmed/Projects-Docforge/Astro/cloudflare-frontend/src/pages/profile/[...all].astro";
const $$url = "/profile/[...all]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
