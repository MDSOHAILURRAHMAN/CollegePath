const headerHost = document.querySelector("[data-site-header]");
const footerHost = document.querySelector("[data-site-footer]");

if (headerHost) {
  const pageName = location.pathname.split("/").pop() || "index.html";
  const navItems = [
    ["Home", "index.html"],
    ["Services", "index.html#services"],
    ["Colleges", "colleges.html"],
    ["Branches", "branches.html"],
    ["Blog", "blog.html"],
    ["Contact", "contact.html"]
  ];
  headerHost.innerHTML = `<nav class="navbar navbar-expand-lg fixed-top site-nav"><div class="container"><a class="navbar-brand brand" href="index.html" aria-label="CollegePath Advisors home"><span class="brand-mark">CP</span><span>CollegePath<small>ADVISORS</small></span></a><button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button><div class="collapse navbar-collapse justify-content-end" id="mainNav"><div class="navbar-nav nav-links">${navItems.map(([label, href]) => `<a class="nav-link ${href.split("#")[0] === pageName ? "active" : ""}" href="${href}">${label}</a>`).join("")}<a class="btn btn-sun nav-contact" data-auth-link href="login.html">Sign in / Register <i class="bi bi-arrow-up-right"></i></a></div></div></div></nav>`;
}

if (footerHost) {
  footerHost.innerHTML = `<footer class="site-footer"><div class="container"><div class="footer-main"><div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark">CP</span><span>CollegePath<small>ADVISORS</small></span></a><p>Your path to the right college. Personal guidance for a decision that matters.</p><div class="footer-social"><a href="https://instagram.com/" aria-label="Instagram"><i class="bi bi-instagram"></i></a><a href="https://www.linkedin.com/" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a><a href="https://wa.me/910000000000" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></a></div></div><div class="footer-col"><h3>EXPLORE</h3><a href="index.html#services">Our services</a><a href="colleges.html">College finder</a><a href="branches.html">B.Tech branches</a><a href="blog.html">Field notes</a></div><div class="footer-col"><h3>COLLEGEPATH</h3><a href="contact.html">About our guidance</a><a href="contact.html">Book counselling</a><a href="contact.html">Get in touch</a></div><div class="footer-col footer-contact"><h3>LET'S TALK</h3><p>Questions about your next step?<br><a href="mailto:hello@collegepathadvisors.in">hello@collegepathadvisors.in</a></p><a href="contact.html">New Delhi, India · Nationwide guidance</a></div></div><div class="footer-bottom"><p>© ${new Date().getFullYear()} CollegePath Advisors. All rights reserved.</p><p>Thoughtful guidance for the road ahead.</p></div></div></footer>`;
}

const revealObserver = "IntersectionObserver" in window ? new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 }) : null;

document.querySelectorAll("[data-reveal]").forEach(element => {
  element.classList.add("reveal");
  revealObserver ? revealObserver.observe(element) : element.classList.add("is-visible");
});

const siteNav = document.querySelector(".site-nav");
const updateNavShadow = () => siteNav?.classList.toggle("is-scrolled", window.scrollY > 12);
updateNavShadow();
window.addEventListener("scroll", updateNavShadow, { passive: true });

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function showMessage(element, message, type = "error") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("d-none", "auth-message-error", "auth-message-success");
  element.classList.add(type === "success" ? "auth-message-success" : "auth-message-error");
}

const authLink = document.querySelector("[data-auth-link]");
if (authLink) {
  apiRequest("/api/session").then(({ user }) => {
    if (user) {
      authLink.href = "dashboard.html";
      authLink.innerHTML = `My account <i class="bi bi-arrow-up-right"></i>`;
    }
  }).catch(() => {});
}

document.addEventListener("click", async event => {
  const logoutButton = event.target.closest("[data-logout], #logout-button");
  if (logoutButton) {
    await apiRequest("/api/logout", { method: "POST", body: "{}" }).catch(() => {});
    location.href = "index.html";
    return;
  }
  const saveButton = event.target.closest("[data-save-college]");
  if (!saveButton) return;
  saveButton.disabled = true;
  try {
    await apiRequest("/api/saved-colleges", { method: "POST", body: JSON.stringify({ collegeId: saveButton.dataset.saveCollege }) });
    saveButton.innerHTML = `<i class="bi bi-check2"></i> Saved`;
    saveButton.classList.add("is-saved");
  } catch (error) {
    if (error.message.includes("Sign in")) location.href = "login.html?return=colleges.html";
    else showMessage(document.querySelector("#account-alert"), error.message);
    saveButton.disabled = false;
  }
});

const collegeData = [
  { id: "iit-delhi", name: "Indian Institute of Technology Delhi", city: "New Delhi", state: "Delhi", type: "Government", fee: 2.3, rating: 4.8, branches: ["Computer Science Engineering", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Electronics & Communication"], image: "photo-1562774053-701939374585" },
  { id: "mit-manipal", name: "Manipal Institute of Technology", city: "Manipal", state: "Karnataka", type: "Private", fee: 4.1, rating: 4.4, branches: ["Computer Science Engineering", "Artificial Intelligence & Data Science", "Electronics & Communication", "Mechanical Engineering", "Electrical Engineering"], image: "photo-1564981797816-1043664bf78d" },
  { id: "vit-vellore", name: "Vellore Institute of Technology", city: "Vellore", state: "Tamil Nadu", type: "Private", fee: 2.0, rating: 4.3, branches: ["Computer Science Engineering", "Artificial Intelligence & Data Science", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering"], image: "photo-1562774053-701939374585" },
  { id: "nit-trichy", name: "NIT Tiruchirappalli", city: "Tiruchirappalli", state: "Tamil Nadu", type: "Government", fee: 1.6, rating: 4.6, branches: ["Computer Science Engineering", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering"], image: "photo-1498243691581-b145c3f54a5a" },
  { id: "bits-pilani", name: "BITS Pilani", city: "Pilani", state: "Rajasthan", type: "Private", fee: 5.7, rating: 4.7, branches: ["Computer Science Engineering", "Electronics & Communication", "Mechanical Engineering", "Electrical Engineering"], image: "photo-1564981797816-1043664bf78d" },
  { id: "srm-chennai", name: "SRM Institute of Science and Technology", city: "Chennai", state: "Tamil Nadu", type: "Private", fee: 3.2, rating: 4.1, branches: ["Computer Science Engineering", "Artificial Intelligence & Data Science", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering"], image: "photo-1523050854058-8df90110c9f1" },
  { id: "jadavpur", name: "Jadavpur University", city: "Kolkata", state: "West Bengal", type: "Government", fee: 0.2, rating: 4.5, branches: ["Computer Science Engineering", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering", "Electrical Engineering"], image: "photo-1498243691581-b145c3f54a5a" },
  { id: "pes-bengaluru", name: "PES University", city: "Bengaluru", state: "Karnataka", type: "Private", fee: 3.8, rating: 4.0, branches: ["Computer Science Engineering", "Artificial Intelligence & Data Science", "Electronics & Communication", "Mechanical Engineering"], image: "photo-1562774053-701939374585" }
];

const formatFee = fee => fee < 1 ? `₹${Math.round(fee * 100)}k` : `₹${fee.toFixed(1)}L`;
const makeCollegeCard = college => `<div class="col-sm-6 col-lg-4"><article class="college-card"><div class="college-card-image"><img src="https://images.unsplash.com/${college.image}?auto=format&fit=crop&w=800&q=80" alt="Campus representing ${college.name}" loading="lazy"><span class="college-type">${college.type}</span></div><div class="college-card-body"><h3>${college.name}</h3><p class="college-location"><i class="bi bi-geo-alt"></i> ${college.city}, ${college.state}</p><div class="college-meta"><span>Annual tuition<strong>${formatFee(college.fee)}</strong></span><span>Placement rating<strong class="college-rating"><i class="bi bi-star-fill"></i> ${college.rating.toFixed(1)} / 5</strong></span></div><button type="button" class="save-college" data-save-college="${college.id}"><i class="bi bi-bookmark-plus"></i> Save college</button></div></article></div>`;

const featuredTarget = document.querySelector("#featured-colleges");
if (featuredTarget) featuredTarget.innerHTML = collegeData.slice(0, 3).map(makeCollegeCard).join("");

const resultsTarget = document.querySelector("#college-results");
if (resultsTarget) {
  const searchInput = document.querySelector("#college-search");
  const stateFilter = document.querySelector("#state-filter");
  const branchFilter = document.querySelector("#branch-filter");
  const feesFilter = document.querySelector("#fees-filter");
  const ratingFilter = document.querySelector("#rating-filter");
  const noResults = document.querySelector("#no-results");
  const states = [...new Set(collegeData.map(college => college.state))].sort();
  const branches = [...new Set(collegeData.flatMap(college => college.branches))].sort();
  states.forEach(state => stateFilter.add(new Option(state, state)));
  branches.forEach(branch => branchFilter.add(new Option(branch, branch)));

  const renderResults = () => {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = collegeData.filter(college => {
      const matchesQuery = `${college.name} ${college.city} ${college.state}`.toLowerCase().includes(query);
      const matchesState = !stateFilter.value || college.state === stateFilter.value;
      const matchesBranch = !branchFilter.value || college.branches.includes(branchFilter.value);
      const matchesFees = feesFilter.value === "under-2" ? college.fee < 2 : feesFilter.value === "2-5" ? college.fee >= 2 && college.fee <= 5 : feesFilter.value === "over-5" ? college.fee > 5 : true;
      const matchesRating = !ratingFilter.value || college.rating >= Number(ratingFilter.value);
      return matchesQuery && matchesState && matchesBranch && matchesFees && matchesRating;
    });
    resultsTarget.innerHTML = filtered.map(makeCollegeCard).join("");
    document.querySelector("#results-count").textContent = `${filtered.length} ${filtered.length === 1 ? "college" : "colleges"} found`;
    noResults.classList.toggle("d-none", filtered.length > 0);
    resultsTarget.classList.toggle("d-none", filtered.length === 0);
  };
  const resetFilters = () => {
    searchInput.value = "";
    stateFilter.value = "";
    branchFilter.value = "";
    feesFilter.value = "";
    ratingFilter.value = "";
    renderResults();
  };
  [searchInput, stateFilter, branchFilter, feesFilter, ratingFilter].forEach(control => control.addEventListener(control === searchInput ? "input" : "change", renderResults));
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  document.querySelector("#empty-reset").addEventListener("click", resetFilters);
  renderResults();
}

const branchData = [
  ["Computer Science Engineering", "bi-cpu", "Learn how software, algorithms, and computing systems are designed and built.", "Programming · Systems · Software design"],
  ["Artificial Intelligence & Data Science", "bi-robot", "Work with data, machine learning, and intelligent systems that help solve real problems.", "Machine learning · Statistics · Data"],
  ["Electronics & Communication", "bi-broadcast", "Explore circuits, communication networks, embedded devices, and signal processing.", "Circuits · Communications · Embedded systems"],
  ["Mechanical Engineering", "bi-gear-wide-connected", "Understand the design, materials, and mechanics behind products and machines.", "Design · Manufacturing · Mechanics"],
  ["Civil Engineering", "bi-buildings", "Help shape the built environment through structures, transport, and infrastructure.", "Structures · Infrastructure · Environment"],
  ["Electrical Engineering", "bi-lightning-charge", "Study electrical systems, power, machines, and the technologies that move energy.", "Power systems · Electronics · Energy"]
];
const branchTarget = document.querySelector("#branch-cards");
if (branchTarget) branchTarget.innerHTML = branchData.map(([name, icon, description, focus], index) => `<div class="col-md-6 col-lg-4"><article class="branch-card"><div class="branch-card-top"><span class="branch-card-icon"><i class="bi ${icon}"></i></span><span class="branch-card-number">0${index + 1}</span></div><h3>${name}</h3><p>${description}</p><div class="branch-focus"><small>YOU'LL EXPLORE</small><span>${focus}</span></div></article></div>`).join("");

const contactForm = document.querySelector("#contact-form");
contactForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const submitButton = contactForm.querySelector("[type=submit]");
  submitButton.disabled = true;
  try {
    const formData = Object.fromEntries(new FormData(contactForm));
    await apiRequest("/api/enquiries", { method: "POST", body: JSON.stringify(formData) });
    showMessage(document.querySelector("#form-success"), "Your request was sent. A CollegePath counsellor will be in touch.", "success");
    contactForm.reset();
  } catch (error) {
    let errorTarget = document.querySelector("#form-error");
    if (!errorTarget) {
      errorTarget = document.createElement("div");
      errorTarget.id = "form-error";
      errorTarget.className = "auth-message d-none";
      contactForm.prepend(errorTarget);
    }
    showMessage(errorTarget, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

const authMessage = document.querySelector("#auth-message");
const switchAuthTab = tab => {
  document.querySelectorAll("[data-auth-tab]").forEach(button => {
    const selected = button.dataset.authTab === tab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
  document.querySelector("#login-form")?.classList.toggle("d-none", tab !== "login");
  document.querySelector("#register-form")?.classList.toggle("d-none", tab !== "register");
  authMessage?.classList.add("d-none");
};
document.querySelectorAll("[data-auth-tab]").forEach(button => button.addEventListener("click", () => switchAuthTab(button.dataset.authTab)));

const loginForm = document.querySelector("#login-form");
loginForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const button = loginForm.querySelector("[type=submit]");
  button.disabled = true;
  try {
    await apiRequest("/api/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(loginForm))) });
    const destination = new URLSearchParams(location.search).get("return");
    location.href = destination && /^[a-z0-9-]+\.html$/i.test(destination) ? destination : "dashboard.html";
  } catch (error) {
    showMessage(authMessage, error.message);
  } finally {
    button.disabled = false;
  }
});

const registerForm = document.querySelector("#register-form");
registerForm?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!registerForm.reportValidity()) return;
  const button = registerForm.querySelector("[type=submit]");
  button.disabled = true;
  try {
    await apiRequest("/api/register", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(registerForm))) });
    location.href = "dashboard.html";
  } catch (error) {
    showMessage(authMessage, error.message);
  } finally {
    button.disabled = false;
  }
});

const dashboard = document.querySelector(".dashboard-page");
if (dashboard) {
  const loadDashboard = async () => {
    let user;
    try {
      ({ user } = await apiRequest("/api/session"));
    } catch {
      user = null;
    }
    if (!user) {
      location.replace("login.html?return=dashboard.html");
      return;
    }
    document.querySelector("#account-name").textContent = user.name.split(" ")[0];
    const showPanel = id => document.querySelector(id).classList.remove("d-none");
    const alert = document.querySelector("#account-alert");
    if (user.role === "student") {
      showPanel("#student-panel");
      const { saved } = await apiRequest("/api/saved-colleges");
      const savedTarget = document.querySelector("#saved-colleges");
      savedTarget.innerHTML = saved.map(college => `<div class="col-md-6"><article class="saved-college"><span><i class="bi bi-buildings"></i></span><strong>${escapeHtml(college.name)}</strong><button type="button" data-remove-college="${escapeHtml(college.id)}" aria-label="Remove ${escapeHtml(college.name)}" title="Remove from shortlist"><i class="bi bi-x-lg"></i></button></article></div>`).join("");
      document.querySelector("#empty-shortlist").classList.toggle("d-none", saved.length > 0);
      savedTarget.addEventListener("click", async event => {
        const removeButton = event.target.closest("[data-remove-college]");
        if (!removeButton) return;
        try {
          await apiRequest(`/api/saved-colleges?collegeId=${encodeURIComponent(removeButton.dataset.removeCollege)}`, { method: "DELETE" });
          removeButton.closest(".col-md-6").remove();
          if (!savedTarget.querySelector(".saved-college")) document.querySelector("#empty-shortlist").classList.remove("d-none");
        } catch (error) {
          showMessage(alert, error.message);
        }
      });
    } else {
      showPanel("#staff-panel");
      const { enquiries } = await apiRequest("/api/enquiries");
      document.querySelector("#enquiry-total").textContent = `${enquiries.length} total`;
      document.querySelector("#enquiries-list").innerHTML = enquiries.length ? enquiries.map(enquiry => `<article class="enquiry-row"><div class="enquiry-main"><strong>${escapeHtml(enquiry.name)}</strong><small>${escapeHtml(enquiry.email)} · ${escapeHtml(enquiry.phone)}</small><p>${escapeHtml(enquiry.message || "No message added.")}</p></div><div class="enquiry-meta"><span>Admission ${escapeHtml(enquiry.year)}</span><select data-enquiry-status="${enquiry.id}" aria-label="Update status for ${escapeHtml(enquiry.name)}"><option value="new" ${enquiry.status === "new" ? "selected" : ""}>New</option><option value="contacted" ${enquiry.status === "contacted" ? "selected" : ""}>Contacted</option><option value="resolved" ${enquiry.status === "resolved" ? "selected" : ""}>Resolved</option></select></div></article>`).join("") : `<p class="empty-account">New counselling requests will appear here.</p>`;
      document.querySelector("#enquiries-list").addEventListener("change", async event => {
        const select = event.target.closest("[data-enquiry-status]");
        if (!select) return;
        try {
          await apiRequest(`/api/enquiries/${select.dataset.enquiryStatus}`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
        } catch (error) {
          showMessage(alert, error.message);
        }
      });
    }
    if (user.role === "admin") {
      showPanel("#admin-panel");
      const { users } = await apiRequest("/api/admin/users");
      document.querySelector("#user-total").textContent = `${users.length} accounts`;
      document.querySelector("#users-list").innerHTML = users.map(account => `<article class="user-row"><span class="user-avatar">${escapeHtml(account.name.slice(0, 1).toUpperCase())}</span><span class="user-ident"><strong>${escapeHtml(account.name)}</strong><small>${escapeHtml(account.email)}</small></span><select data-user-role="${account.id}" aria-label="Role for ${escapeHtml(account.name)}"><option value="student" ${account.role === "student" ? "selected" : ""}>Student</option><option value="counsellor" ${account.role === "counsellor" ? "selected" : ""}>Counsellor</option><option value="admin" ${account.role === "admin" ? "selected" : ""}>Admin</option></select></article>`).join("");
      document.querySelector("#users-list").addEventListener("change", async event => {
        const select = event.target.closest("[data-user-role]");
        if (!select) return;
        try {
          await apiRequest(`/api/admin/users/${select.dataset.userRole}/role`, { method: "PATCH", body: JSON.stringify({ role: select.value }) });
          showMessage(alert, "Account access updated.", "success");
        } catch (error) {
          showMessage(alert, error.message);
        }
      });
    }
  };
  loadDashboard().catch(error => showMessage(document.querySelector("#account-alert"), error.message));
}