/* =========================================================
   APP.JS — shared utilities used across every page
   Nav highlighting, mobile menu, toast messages, and note
   card rendering. Auth state comes from Api.getMe(), and the
   save button posts to the real /api/notes/:id/save endpoint.
   ========================================================= */

const NSApp = (() => {
  let toastTimer = null;
  function showToast(message){
    let el = document.querySelector(".toast");
    if (!el){
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function formatDate(iso){
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatNumber(n){
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  function noteCardHTML(note){
    return `
      <article class="note-card" data-id="${note.id}">
        <div class="note-card-top">
          <span class="tag-chip">${note.subject}</span>
          <button class="save-btn ${note.saved ? "saved" : ""}" data-save="${note.id}" aria-label="${note.saved ? "Remove from saved notes" : "Save this note"}" title="${note.saved ? "Saved" : "Save for later"}">
            ${note.saved ? "★" : "☆"}
          </button>
        </div>
        <h3><a href="note-details.html?id=${note.id}">${note.title}</a></h3>
        <p class="note-desc">${note.description}</p>
        <div class="note-card-top" style="margin-top:-0.3rem;">
          <span class="tag-chip type">${note.type}</span>
          <span class="tag-chip type">${note.category}</span>
        </div>
        <div class="note-meta">
          <span>${note.course} · ${note.authorName}</span>
          <span class="note-stats">👁 ${formatNumber(note.views)} · ⬇ ${formatNumber(note.downloads)}</span>
        </div>
      </article>
    `;
  }

  function renderNoteGrid(container, notesArray, emptyMessage){
    if (!container) return;
    if (!notesArray || !notesArray.length){
      container.innerHTML = `
        <div class="empty-state">
          <h3>No notes found</h3>
          <p>${emptyMessage || "Try a different search term or clear your filters."}</p>
        </div>`;
      return;
    }
    container.innerHTML = notesArray.map(noteCardHTML).join("");
    wireSaveButtons(container);
  }

  function wireSaveButtons(scope){
    scope.querySelectorAll("[data-save]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-save");
        try{
          const { saved } = await Api.toggleSave(id);
          btn.classList.toggle("saved", saved);
          btn.textContent = saved ? "★" : "☆";
          btn.setAttribute("aria-label", saved ? "Remove from saved notes" : "Save this note");
          showToast(saved ? "Saved to your dashboard" : "Removed from saved notes");
        }catch(err){
          if (err.message.toLowerCase().includes("logged in")){
            showToast("Log in to save notes");
            setTimeout(() => window.location.href = "login.html", 900);
          } else {
            showToast(err.message);
          }
        }
      });
    });
  }

  // ---------- Nav / header behavior ----------
  async function initNav(){
    const toggle = document.querySelector(".nav-toggle");
    const links = document.querySelector(".nav-links");
    if (toggle && links){
      toggle.addEventListener("click", () => {
        const open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    }

    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(a => {
      if (a.getAttribute("href") === path) a.classList.add("active");
    });

    const authSlot = document.querySelector("[data-auth-slot]");
    if (!authSlot) return;

    try{
      const user = await Api.getMe();
      if (user){
        authSlot.innerHTML = `
          <a href="dashboard.html" class="btn btn-ghost btn-sm">Dashboard</a>
          <button class="btn btn-sm" data-logout>Log out</button>
        `;
        authSlot.querySelector("[data-logout]").addEventListener("click", async () => {
          await Api.logout();
          showToast("Logged out");
          setTimeout(() => window.location.href = "index.html", 500);
        });
      }
    }catch(err){
      // Server unreachable — leave the default "Log in" link in place, and
      // surface it once so it's obvious the backend isn't running.
      console.warn("Could not load session:", err.message);
      showToast(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", initNav);

  return { showToast, formatDate, formatNumber, noteCardHTML, renderNoteGrid, wireSaveButtons };
})();
