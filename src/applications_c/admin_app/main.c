#include <emscripten.h>
#include <emscripten/html5.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ======================
// Application State
// ======================
static char current_route[256] = "/dashboard";

// ======================
// JavaScript Interface - History API
// ======================

// Get current pathname from URL
EM_JS(void, js_get_pathname, (char* buffer, int size), {
    let path = window.location.pathname || '/';
    // Extract route after the base path (/admin)
    const basePath = '/admin';
    if (path.startsWith(basePath)) {
        path = path.substring(basePath.length);
    }
    if (!path || path === '/') {
        path = '/dashboard';
    }
    stringToUTF8(path, buffer, size);
});

// Push state to history (navigate programmatically)
EM_JS(void, js_push_state, (const char* path), {
    const pathStr = UTF8ToString(path);
    const fullPath = '/admin' + pathStr;
    history.pushState({}, '', fullPath);
    Module._handle_route_change();
});

// Set up popstate listener for browser back/forward
EM_JS(void, js_setup_popstate_listener, (), {
    window.addEventListener('popstate', function(event) {
        Module._handle_route_change();
    });

    // Intercept clicks on navigation links
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[data-route]')) {
            e.preventDefault();
            const route = e.target.getAttribute('data-route');
            const fullPath = '/admin' + route;
            history.pushState({}, '', fullPath);
            Module._handle_route_change();
        }
    });
});

// Update page content
EM_JS(void, js_set_content, (const char* html), {
    const root = document.getElementById('wasm-root');
    if (root) {
        root.innerHTML = UTF8ToString(html);
    }
});

// Update page title
EM_JS(void, js_set_title, (const char* title), {
    document.title = UTF8ToString(title);
});

// ======================
// Page Rendering Functions
// ======================

void render_dashboard() {
    js_set_title("Dashboard - Internal Operations Platform");

    char html[8192];
    snprintf(html, sizeof(html),
        "<div class=\"flex h-screen bg-gray-50 dark:bg-zinc-900\">\n"
        "  <!-- Sidebar -->\n"
        "  <aside class=\"w-60 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col\">\n"
        "    <!-- Logo/Header -->\n"
        "    <div class=\"p-6 border-b border-gray-200 dark:border-zinc-700\">\n"
        "      <div class=\"flex items-center gap-3\">\n"
        "        <svg class=\"w-8 h-8 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"></path>\n"
        "        </svg>\n"
        "        <div>\n"
        "          <h1 class=\"text-lg font-bold text-gray-900 dark:text-white\">Operations</h1>\n"
        "          <p class=\"text-xs text-purple-600 dark:text-purple-400\">Platform</p>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "    <!-- Navigation -->\n"
        "    <nav class=\"flex-1 p-4 space-y-1\">\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"></path>\n"
        "        </svg>\n"
        "        <span>Dashboard</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/project\" data-route=\"/project\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path>\n"
        "        </svg>\n"
        "        <span>Project</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/product\" data-route=\"/product\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"></path>\n"
        "        </svg>\n"
        "        <span>Product</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/development\" data-route=\"/development\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4\"></path>\n"
        "        </svg>\n"
        "        <span>Development</span>\n"
        "      </a>\n"
        "    </nav>\n"
        "  </aside>\n"
        "  <!-- Main Content -->\n"
        "  <main class=\"flex-1 overflow-auto\">\n"
        "    <div class=\"max-w-7xl mx-auto p-8\">\n"
        "      <!-- Header -->\n"
        "      <div class=\"mb-8\">\n"
        "        <h2 class=\"text-3xl font-bold text-gray-900 dark:text-white mb-2\">Dashboard</h2>\n"
        "        <p class=\"text-gray-600 dark:text-gray-400\">Overview of team activity and project status</p>\n"
        "      </div>\n"
        "\n"
        "      <!-- Stats Grid -->\n"
        "      <div class=\"grid grid-cols-1 md:grid-cols-3 gap-6 mb-8\">\n"
        "        <!-- Active Issues Card -->\n"
        "        <div class=\"bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border-2 border-gray-200 dark:border-zinc-700\">\n"
        "          <h3 class=\"text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3\">Active Issues</h3>\n"
        "          <p class=\"text-4xl font-bold text-gray-900 dark:text-white\">6</p>\n"
        "          <p class=\"text-sm text-gray-500 dark:text-gray-400 mt-2\">3 dev • 3 product</p>\n"
        "        </div>\n"
        "\n"
        "        <!-- Team Online Card -->\n"
        "        <div class=\"bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border-2 border-gray-200 dark:border-zinc-700\">\n"
        "          <h3 class=\"text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3\">Team Online</h3>\n"
        "          <p class=\"text-4xl font-bold text-gray-900 dark:text-white\">4/5</p>\n"
        "          <p class=\"text-sm text-gray-500 dark:text-gray-400 mt-2\">80% availability</p>\n"
        "        </div>\n"
        "\n"
        "        <!-- Current Milestone Card -->\n"
        "        <div class=\"bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border-2 border-gray-200 dark:border-zinc-700\">\n"
        "          <h3 class=\"text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3\">Current Milestone</h3>\n"
        "          <p class=\"text-lg font-bold text-gray-900 dark:text-white\">Core Dashboard Features</p>\n"
        "          <p class=\"text-sm text-gray-500 dark:text-gray-400 mt-2\">Feb 2025 • On track</p>\n"
        "        </div>\n"
        "      </div>\n"
        "\n"
        "      <!-- Recent Activity -->\n"
        "      <div class=\"bg-white dark:bg-zinc-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-zinc-700 p-6 mb-8\">\n"
        "        <h3 class=\"text-lg font-semibold text-gray-900 dark:text-white mb-4\">Recent Activity</h3>\n"
        "        <div class=\"space-y-4\">\n"
        "          <div class=\"flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"w-2 h-2 bg-blue-500 rounded-full mt-2\"></div>\n"
        "            <div class=\"flex-1\">\n"
        "              <p class=\"text-sm text-gray-900 dark:text-gray-100\"><span class=\"font-semibold\">Alex Kumar</span> commented on <span class=\"font-semibold\">API rate limiting</span></p>\n"
        "              <p class=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">2 hours ago • Development Issue</p>\n"
        "            </div>\n"
        "          </div>\n"
        "          <div class=\"flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"w-2 h-2 bg-green-500 rounded-full mt-2\"></div>\n"
        "            <div class=\"flex-1\">\n"
        "              <p class=\"text-sm text-gray-900 dark:text-gray-100\"><span class=\"font-semibold\">Mike Rodriguez</span> closed <span class=\"font-semibold\">User onboarding flow confusion</span></p>\n"
        "              <p class=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">5 hours ago • Product Issue</p>\n"
        "            </div>\n"
        "          </div>\n"
        "          <div class=\"flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"w-2 h-2 bg-purple-500 rounded-full mt-2\"></div>\n"
        "            <div class=\"flex-1\">\n"
        "              <p class=\"text-sm text-gray-900 dark:text-gray-100\"><span class=\"font-semibold\">Sarah Chen</span> updated the roadmap milestone <span class=\"font-semibold\">Core Dashboard Features</span></p>\n"
        "              <p class=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">1 day ago • Project Update</p>\n"
        "            </div>\n"
        "          </div>\n"
        "          <div class=\"flex items-start gap-4\">\n"
        "            <div class=\"w-2 h-2 bg-blue-500 rounded-full mt-2\"></div>\n"
        "            <div class=\"flex-1\">\n"
        "              <p class=\"text-sm text-gray-900 dark:text-gray-100\"><span class=\"font-semibold\">Jordan Lee</span> opened new issue <span class=\"font-semibold\">Firebase SDK integration</span></p>\n"
        "              <p class=\"text-xs text-gray-500 dark:text-gray-400 mt-1\">1 day ago • Development Issue</p>\n"
        "            </div>\n"
        "          </div>\n"
        "        </div>\n"
        "      </div>\n"
        "\n"
        "      <!-- Team Members -->\n"
        "      <div class=\"bg-white dark:bg-zinc-800 rounded-lg shadow-sm border-2 border-gray-200 dark:border-zinc-700 p-6\">\n"
        "        <h3 class=\"text-lg font-semibold text-gray-900 dark:text-white mb-6\">Team Members</h3>\n"
        "        <div class=\"space-y-4\">\n"
        "          <!-- Team Member 1 -->\n"
        "          <div class=\"flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"flex items-center gap-4\">\n"
        "              <div class=\"w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-zinc-600\">\n"
        "                SC\n"
        "              </div>\n"
        "              <div>\n"
        "                <p class=\"font-semibold text-gray-900 dark:text-white\">Sarah Chen</p>\n"
        "                <p class=\"text-sm text-gray-500 dark:text-gray-400\">Project Manager</p>\n"
        "              </div>\n"
        "            </div>\n"
        "            <div class=\"flex items-center gap-2\">\n"
        "              <span class=\"text-xs text-gray-500 dark:text-gray-400\">Active now</span>\n"
        "              <div class=\"w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800\"></div>\n"
        "            </div>\n"
        "          </div>\n"
        "\n"
        "          <!-- Team Member 2 -->\n"
        "          <div class=\"flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"flex items-center gap-4\">\n"
        "              <div class=\"w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-zinc-600\">\n"
        "                MR\n"
        "              </div>\n"
        "              <div>\n"
        "                <p class=\"font-semibold text-gray-900 dark:text-white\">Mike Rodriguez</p>\n"
        "                <p class=\"text-sm text-gray-500 dark:text-gray-400\">Product Manager</p>\n"
        "              </div>\n"
        "            </div>\n"
        "            <div class=\"flex items-center gap-2\">\n"
        "              <span class=\"text-xs text-gray-500 dark:text-gray-400\">Active now</span>\n"
        "              <div class=\"w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800\"></div>\n"
        "            </div>\n"
        "          </div>\n"
        "\n"
        "          <!-- Team Member 3 -->\n"
        "          <div class=\"flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"flex items-center gap-4\">\n"
        "              <div class=\"w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-zinc-600\">\n"
        "                ET\n"
        "              </div>\n"
        "              <div>\n"
        "                <p class=\"font-semibold text-gray-900 dark:text-white\">Emma Thompson</p>\n"
        "                <p class=\"text-sm text-gray-500 dark:text-gray-400\">UI Designer</p>\n"
        "              </div>\n"
        "            </div>\n"
        "            <div class=\"flex items-center gap-2\">\n"
        "              <span class=\"text-xs text-gray-500 dark:text-gray-400\">Offline</span>\n"
        "              <div class=\"w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-zinc-800\"></div>\n"
        "            </div>\n"
        "          </div>\n"
        "\n"
        "          <!-- Team Member 4 -->\n"
        "          <div class=\"flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-700\">\n"
        "            <div class=\"flex items-center gap-4\">\n"
        "              <div class=\"w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-zinc-600\">\n"
        "                AK\n"
        "              </div>\n"
        "              <div>\n"
        "                <p class=\"font-semibold text-gray-900 dark:text-white\">Alex Kumar</p>\n"
        "                <p class=\"text-sm text-gray-500 dark:text-gray-400\">Lead Developer</p>\n"
        "              </div>\n"
        "            </div>\n"
        "            <div class=\"flex items-center gap-2\">\n"
        "              <span class=\"text-xs text-gray-500 dark:text-gray-400\">Active now</span>\n"
        "              <div class=\"w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800\"></div>\n"
        "            </div>\n"
        "          </div>\n"
        "\n"
        "          <!-- Team Member 5 -->\n"
        "          <div class=\"flex items-center justify-between py-3\">\n"
        "            <div class=\"flex items-center gap-4\">\n"
        "              <div class=\"w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-zinc-600\">\n"
        "                JL\n"
        "              </div>\n"
        "              <div>\n"
        "                <p class=\"font-semibold text-gray-900 dark:text-white\">Jordan Lee</p>\n"
        "                <p class=\"text-sm text-gray-500 dark:text-gray-400\">Frontend Developer</p>\n"
        "              </div>\n"
        "            </div>\n"
        "            <div class=\"flex items-center gap-2\">\n"
        "              <span class=\"text-xs text-gray-500 dark:text-gray-400\">Active now</span>\n"
        "              <div class=\"w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800\"></div>\n"
        "            </div>\n"
        "          </div>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "  </main>\n"
        "</div>"
    );

    js_set_content(html);
    printf("📄 Rendered: Dashboard\n");
}

void render_project() {
    js_set_title("Project - Internal Operations Platform");

    char html[8192];
    snprintf(html, sizeof(html),
        "<div class=\"flex h-screen bg-gray-50 dark:bg-zinc-900\">\n"
        "  <!-- Sidebar -->\n"
        "  <aside class=\"w-60 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col\">\n"
        "    <div class=\"p-6 border-b border-gray-200 dark:border-zinc-700\">\n"
        "      <div class=\"flex items-center gap-3\">\n"
        "        <svg class=\"w-8 h-8 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"></path>\n"
        "        </svg>\n"
        "        <div>\n"
        "          <h1 class=\"text-lg font-bold text-gray-900 dark:text-white\">Operations</h1>\n"
        "          <p class=\"text-xs text-purple-600 dark:text-purple-400\">Platform</p>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "    <nav class=\"flex-1 p-4 space-y-1\">\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"></path>\n"
        "        </svg>\n"
        "        <span>Dashboard</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/project\" data-route=\"/project\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path>\n"
        "        </svg>\n"
        "        <span>Project</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/product\" data-route=\"/product\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"></path>\n"
        "        </svg>\n"
        "        <span>Product</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/development\" data-route=\"/development\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4\"></path>\n"
        "        </svg>\n"
        "        <span>Development</span>\n"
        "      </a>\n"
        "    </nav>\n"
        "  </aside>\n"
        "  <!-- Main Content -->\n"
        "  <main class=\"flex-1 overflow-auto\">\n"
        "    <div class=\"max-w-7xl mx-auto px-8 py-12\">\n"
        "      <h1 class=\"text-4xl font-bold text-gray-900 dark:text-white mb-4\">Project Screen</h1>\n"
        "      <p class=\"text-xl text-gray-600 dark:text-gray-400\">Content Coming Soon</p>\n"
        "    </div>\n"
        "  </main>\n"
        "</div>"
    );

    js_set_content(html);
    printf("📄 Rendered: Project\n");
}

void render_product() {
    js_set_title("Product - Internal Operations Platform");

    char html[8192];
    snprintf(html, sizeof(html),
        "<div class=\"flex h-screen bg-gray-50 dark:bg-zinc-900\">\n"
        "  <!-- Sidebar -->\n"
        "  <aside class=\"w-60 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col\">\n"
        "    <div class=\"p-6 border-b border-gray-200 dark:border-zinc-700\">\n"
        "      <div class=\"flex items-center gap-3\">\n"
        "        <svg class=\"w-8 h-8 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"></path>\n"
        "        </svg>\n"
        "        <div>\n"
        "          <h1 class=\"text-lg font-bold text-gray-900 dark:text-white\">Operations</h1>\n"
        "          <p class=\"text-xs text-purple-600 dark:text-purple-400\">Platform</p>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "    <nav class=\"flex-1 p-4 space-y-1\">\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"></path>\n"
        "        </svg>\n"
        "        <span>Dashboard</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/project\" data-route=\"/project\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path>\n"
        "        </svg>\n"
        "        <span>Project</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/product\" data-route=\"/product\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"></path>\n"
        "        </svg>\n"
        "        <span>Product</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/development\" data-route=\"/development\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4\"></path>\n"
        "        </svg>\n"
        "        <span>Development</span>\n"
        "      </a>\n"
        "    </nav>\n"
        "  </aside>\n"
        "  <!-- Main Content -->\n"
        "  <main class=\"flex-1 overflow-auto\">\n"
        "    <div class=\"max-w-7xl mx-auto px-8 py-12\">\n"
        "      <h1 class=\"text-4xl font-bold text-gray-900 dark:text-white mb-4\">Product Screen</h1>\n"
        "      <p class=\"text-xl text-gray-600 dark:text-gray-400\">Content Coming Soon</p>\n"
        "    </div>\n"
        "  </main>\n"
        "</div>"
    );

    js_set_content(html);
    printf("📄 Rendered: Product\n");
}

void render_development() {
    js_set_title("Development - Internal Operations Platform");

    char html[8192];
    snprintf(html, sizeof(html),
        "<div class=\"flex h-screen bg-gray-50 dark:bg-zinc-900\">\n"
        "  <!-- Sidebar -->\n"
        "  <aside class=\"w-60 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col\">\n"
        "    <div class=\"p-6 border-b border-gray-200 dark:border-zinc-700\">\n"
        "      <div class=\"flex items-center gap-3\">\n"
        "        <svg class=\"w-8 h-8 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"></path>\n"
        "        </svg>\n"
        "        <div>\n"
        "          <h1 class=\"text-lg font-bold text-gray-900 dark:text-white\">Operations</h1>\n"
        "          <p class=\"text-xs text-purple-600 dark:text-purple-400\">Platform</p>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "    <nav class=\"flex-1 p-4 space-y-1\">\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"></path>\n"
        "        </svg>\n"
        "        <span>Dashboard</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/project\" data-route=\"/project\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path>\n"
        "        </svg>\n"
        "        <span>Project</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/product\" data-route=\"/product\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"></path>\n"
        "        </svg>\n"
        "        <span>Product</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/development\" data-route=\"/development\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4\"></path>\n"
        "        </svg>\n"
        "        <span>Development</span>\n"
        "      </a>\n"
        "    </nav>\n"
        "  </aside>\n"
        "  <!-- Main Content -->\n"
        "  <main class=\"flex-1 overflow-auto\">\n"
        "    <div class=\"max-w-7xl mx-auto px-8 py-12\">\n"
        "      <h1 class=\"text-4xl font-bold text-gray-900 dark:text-white mb-4\">Development Screen</h1>\n"
        "      <p class=\"text-xl text-gray-600 dark:text-gray-400\">Content Coming Soon</p>\n"
        "    </div>\n"
        "  </main>\n"
        "</div>"
    );

    js_set_content(html);
    printf("📄 Rendered: Development\n");
}

void render_404() {
    js_set_title("404 - Page Not Found");

    char html[4096];
    snprintf(html, sizeof(html),
        "<div class=\"flex h-screen bg-gray-50 dark:bg-zinc-900\">\n"
        "  <!-- Sidebar -->\n"
        "  <aside class=\"w-60 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col\">\n"
        "    <div class=\"p-6 border-b border-gray-200 dark:border-zinc-700\">\n"
        "      <div class=\"flex items-center gap-3\">\n"
        "        <svg class=\"w-8 h-8 text-purple-500\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z\"></path>\n"
        "        </svg>\n"
        "        <div>\n"
        "          <h1 class=\"text-lg font-bold text-gray-900 dark:text-white\">Operations</h1>\n"
        "          <p class=\"text-xs text-purple-600 dark:text-purple-400\">Platform</p>\n"
        "        </div>\n"
        "      </div>\n"
        "    </div>\n"
        "    <nav class=\"flex-1 p-4 space-y-1\">\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"></path>\n"
        "        </svg>\n"
        "        <span>Dashboard</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/project\" data-route=\"/project\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2\"></path>\n"
        "        </svg>\n"
        "        <span>Project</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/product\" data-route=\"/product\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01\"></path>\n"
        "        </svg>\n"
        "        <span>Product</span>\n"
        "      </a>\n"
        "      <a href=\"/admin/development\" data-route=\"/development\" class=\"flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors\">\n"
        "        <svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "          <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4\"></path>\n"
        "        </svg>\n"
        "        <span>Development</span>\n"
        "      </a>\n"
        "    </nav>\n"
        "  </aside>\n"
        "  <!-- Main Content -->\n"
        "  <main class=\"flex-1 overflow-auto flex items-center justify-center\">\n"
        "    <div class=\"text-center px-8\">\n"
        "      <svg class=\"w-32 h-32 mx-auto text-gray-400 dark:text-gray-600 mb-8\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n"
        "        <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"></path>\n"
        "      </svg>\n"
        "      <h1 class=\"text-6xl font-bold text-gray-900 dark:text-white mb-4\">404</h1>\n"
        "      <h2 class=\"text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4\">Page Not Found</h2>\n"
        "      <p class=\"text-gray-600 dark:text-gray-400 mb-8\">The page you're looking for doesn't exist.</p>\n"
        "      <a href=\"/admin/dashboard\" data-route=\"/dashboard\" class=\"inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors\">Return to Dashboard</a>\n"
        "    </div>\n"
        "  </main>\n"
        "</div>"
    );

    js_set_content(html);
    printf("📄 Rendered: 404 page\n");
}

// ======================
// Router - History API
// ======================

EMSCRIPTEN_KEEPALIVE
void handle_route_change() {
    js_get_pathname(current_route, sizeof(current_route));

    printf("🔀 Navigating to: %s\n", current_route);

    // Route matching
    if (strcmp(current_route, "/") == 0 || strcmp(current_route, "/dashboard") == 0 || strcmp(current_route, "") == 0) {
        render_dashboard();
    } else if (strcmp(current_route, "/project") == 0) {
        render_project();
    } else if (strcmp(current_route, "/product") == 0) {
        render_product();
    } else if (strcmp(current_route, "/development") == 0) {
        render_development();
    } else {
        render_404();
    }
}

EMSCRIPTEN_KEEPALIVE
void navigate_to(const char* path) {
    js_push_state(path);
}

// ======================
// Application Entry Point
// ======================

int main() {
    printf("🚀 Internal Operations Platform Starting...\n");
    printf("📦 Setting up History API routing system\n");

    // Set up popstate listener for browser navigation
    js_setup_popstate_listener();

    // Route to initial page
    handle_route_change();

    printf("✅ Application initialized successfully!\n");
    printf("🌐 Available routes: /dashboard, /project, /product, /development\n");
    printf("✨ Using History API for clean URLs\n");

    return 0;
}
