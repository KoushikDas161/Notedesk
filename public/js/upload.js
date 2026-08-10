/* =========================================================
   UPLOAD.JS — upload.html form handling
   Requires a logged-in session (checked against the server).
   Submits a real multipart/form-data request so the file is
   actually stored on disk in server/uploads/.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  const authGate = document.getElementById("authGate");
  const formWrap = document.getElementById("uploadFormWrap");

  let user = null;
  try{
    user = await Api.getMe();
  }catch(err){
    NSApp.showToast(err.message);
  }

  if (!user){
    authGate.style.display = "block";
    formWrap.style.display = "none";
    return;
  }
  authGate.style.display = "none";
  formWrap.style.display = "block";

  const titleInput = document.getElementById("noteTitle");
  const descInput = document.getElementById("noteDesc");
  const subjectInput = document.getElementById("noteSubject");
  const courseInput = document.getElementById("noteCourse");
  const categoryInput = document.getElementById("noteCategory");
  const typeInput = document.getElementById("noteType");
  const tagsInput = document.getElementById("noteTags");

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("noteFile");
  const fileChosen = document.getElementById("fileChosen");
  const successBanner = document.getElementById("formSuccess");
  const submitBtn = form.querySelector("button[type=submit]");

  try{
    const meta = await Api.getNoteMeta();
    fillSelect(subjectInput, meta.subjects, "Select a subject");
    fillSelect(categoryInput, meta.categories, "Select a category");
    fillSelect(typeInput, meta.types, "Select a file type");
  }catch(err){
    NSApp.showToast(err.message);
  }

  function fillSelect(select, values, placeholder){
    select.innerHTML = `<option value="">${placeholder}</option>` +
      values.map(v => `<option value="${v}">${v}</option>`).join("");
  }

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " "){ e.preventDefault(); fileInput.click(); }
  });
  ["dragenter", "dragover"].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
  );
  ["dragleave", "drop"].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
  );
  dropzone.addEventListener("drop", (e) => {
    const dropped = e.dataTransfer.files;
    if (dropped.length){
      fileInput.files = dropped;
      showFileChosen(dropped[0]);
    }
  });
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) showFileChosen(fileInput.files[0]);
  });

  function showFileChosen(file){
    const sizeKb = (file.size / 1024).toFixed(0);
    fileChosen.textContent = `Selected: ${file.name} (${sizeKb} KB)`;
    fileChosen.style.display = "block";
    clearFieldError(fileInput.closest(".form-row"));
  }

  function setFieldError(row, message){
    row.classList.add("error");
    const errEl = row.querySelector(".field-error");
    if (errEl && message) errEl.textContent = message;
  }
  function clearFieldError(row){ row.classList.remove("error"); }

  function validateClientSide(){
    let valid = true;
    [
      [titleInput, "Give your note a clear title."],
      [descInput, "Add a short description so students know what's inside."]
    ].forEach(([input, msg]) => {
      const row = input.closest(".form-row");
      if (!input.value.trim()){ setFieldError(row, msg); valid = false; } else clearFieldError(row);
    });
    [
      [subjectInput, "Choose a subject."],
      [categoryInput, "Choose a category."],
      [typeInput, "Choose a file type."]
    ].forEach(([input, msg]) => {
      const row = input.closest(".form-row");
      if (!input.value){ setFieldError(row, msg); valid = false; } else clearFieldError(row);
    });
    const fileRow = fileInput.closest(".form-row");
    if (!fileInput.files.length){
      setFieldError(fileRow, "Attach a file to upload — PDF, image, or document.");
      valid = false;
    } else clearFieldError(fileRow);
    return valid;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateClientSide()){
      NSApp.showToast("Please fix the highlighted fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", titleInput.value.trim());
    formData.append("description", descInput.value.trim());
    formData.append("subject", subjectInput.value);
    formData.append("course", courseInput.value.trim());
    formData.append("category", categoryInput.value);
    formData.append("type", typeInput.value);
    formData.append("tags", tagsInput.value);
    formData.append("file", fileInput.files[0]);

    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading…";

    try{
      const note = await Api.createNote(formData);
      successBanner.style.display = "block";
      successBanner.textContent = `"${note.title}" was uploaded — the file is now stored on the server and can be viewed or downloaded.`;
      successBanner.scrollIntoView({ behavior: "smooth", block: "center" });
      form.reset();
      fileChosen.style.display = "none";
      NSApp.showToast("Note uploaded — find it in your dashboard");
      setTimeout(() => { window.location.href = "dashboard.html"; }, 1400);
    }catch(err){
      NSApp.showToast(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Upload note";
    }
  });
});
