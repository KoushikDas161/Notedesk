/* =========================================================
   SEARCH.JS — browse.html search + filter + sort
   Every change re-queries the backend (GET /api/notes).
   Filter option lists come from GET /api/notes/meta.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("noteGrid");
  if (!grid) return; // not on browse page

  const searchInput = document.getElementById("searchInput");
  const subjectSelect = document.getElementById("subjectFilter");
  const categorySelect = document.getElementById("categoryFilter");
  const typeSelect = document.getElementById("typeFilter");
  const sortSelect = document.getElementById("sortFilter");
  const countLabel = document.getElementById("resultCount");
  const clearBtn = document.getElementById("clearFilters");

  function fillOptions(select, values){
    values.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  try{
    const meta = await Api.getNoteMeta();
    fillOptions(subjectSelect, meta.subjects);
    fillOptions(categorySelect, meta.categories);
    fillOptions(typeSelect, meta.types);
  }catch(err){
    NSApp.showToast(err.message);
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get("q")) searchInput.value = params.get("q");
  if (params.get("subject")) subjectSelect.value = params.get("subject");

  async function applyFilters(){
    const query = {
      q: searchInput.value.trim(),
      subject: subjectSelect.value,
      category: categorySelect.value,
      type: typeSelect.value,
      sort: sortSelect.value
    };

    try{
      const results = await Api.getNotes(query);
      NSApp.renderNoteGrid(grid, results, "Try clearing a filter or searching a different subject.");
      countLabel.textContent = `${results.length} note${results.length === 1 ? "" : "s"} found`;
    }catch(err){
      grid.innerHTML = `<div class="empty-state"><h3>Couldn't load notes</h3><p>${err.message}</p></div>`;
    }
  }

  function debounce(fn, wait){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  searchInput.addEventListener("input", debounce(applyFilters, 250));
  [subjectSelect, categorySelect, typeSelect, sortSelect].forEach(el =>
    el.addEventListener("change", applyFilters)
  );

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    subjectSelect.value = "";
    categorySelect.value = "";
    typeSelect.value = "";
    sortSelect.value = "recent";
    applyFilters();
  });

  applyFilters();
});

/* ---------------------------------------------------------
   Home page hero search — redirects to browse.html?q=...
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const heroForm = document.getElementById("heroSearchForm");
  if (!heroForm) return;
  heroForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("heroSearchInput").value.trim();
    window.location.href = `browse.html${q ? "?q=" + encodeURIComponent(q) : ""}`;
  });
});
