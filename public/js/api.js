/* =========================================================
   API.JS — thin fetch wrapper around the /api/* backend
   Every function returns a Promise. This is the ONLY file
   that talks to the network — every other script calls these
   functions and stays backend-agnostic.
   ========================================================= */

const Api = (() => {
  async function request(url, options = {}){
    let res;
    try{
      res = await fetch(url, {
        credentials: "same-origin",
        headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        ...options
      });
    }catch(networkErr){
      console.error("API request failed:", networkErr);
      // This fires when the browser can't even reach the server — e.g. the
      // page was opened as a local file, or `npm start` isn't running.
      throw new Error(
        "Could not reach the NoteDesk server. Make sure you ran \"npm start\" in a " +
        "terminal and are visiting http://localhost:3000 (not opening the HTML file directly)."
      );
    }

    let data = null;
    try{ data = await res.json(); }catch(e){ /* no JSON body, e.g. file stream */ }

    if (!res.ok){
      const message = (data && data.error) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  }

  // ---------- Auth ----------
  const getMe = () => request("/api/auth/me");
  const login = (email, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const register = (name, email, password) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  const logout = () => request("/api/auth/logout", { method: "POST" });

  // ---------- Notes ----------
  const getNotes = (params = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) query.append(k, v);
    }
    const qs = query.toString();
    return request(`/api/notes${qs ? "?" + qs : ""}`);
  };
  const getNoteMeta = () => request("/api/notes/meta");
  const getNote = (id) => request(`/api/notes/${id}`);
  const createNote = (formData) => request("/api/notes", { method: "POST", body: formData });
  const toggleSave = (id) => request(`/api/notes/${id}/save`, { method: "POST" });
  const downloadUrl = (id) => `/api/notes/${id}/download`;
  const viewUrl = (id) => `/api/notes/${id}/view`;

  // ---------- Dashboard ----------
  const getDashboard = () => request("/api/dashboard");

  return {
    getMe, login, register, logout,
    getNotes, getNoteMeta, getNote, createNote, toggleSave, downloadUrl, viewUrl,
    getDashboard
  };
})();
