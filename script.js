(() => {
  "use strict";

  const STORAGE_KEY = "pes_tournament_registrations_v1";
  const SUPABASE_URL = "https://inligamwqciyhqionztd.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mXTRNsfI7hd_YuSbBKVrRQ_J0lAIk7h";

  const form = document.getElementById("registrationForm");
  const successBox = document.getElementById("successBox");
  const registrationId = document.getElementById("registrationId");
  const button = document.getElementById("registerButton");

  const getRegistrations = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const saveRegistrations = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const makeId = () => {
    const now = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `PES-${now}-${random}`;
  };

  const setError = (field, message = "") => {
    const input = document.getElementById(field);
    const error = document.querySelector(`[data-error-for="${field}"]`);
    if (input) input.classList.toggle("invalid", Boolean(message));
    if (error) error.textContent = message;
  };

  const clearErrors = () => ["name", "phone", "email", "pesId"].forEach(field => setError(field));

  const showSubmitError = (message) => {
    setError("pesId", message);
    button.disabled = false;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const data = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim().toLowerCase(),
      pesId: document.getElementById("pesId").value.trim()
    };

    let valid = true;
    if (data.name.length < 2) { setError("name", "Please enter your full name."); valid = false; }
    if (!/^\d{10}$/.test(data.phone)) { setError("phone", "Enter a valid 10-digit phone number."); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setError("email", "Enter a valid email address."); valid = false; }
    if (data.pesId.length < 2) { setError("pesId", "Please enter your PES ID."); valid = false; }

    if (!valid) return;

    const registrations = getRegistrations();
    const duplicate = registrations.find(item =>
      String(item.pesId || "").toLowerCase() === data.pesId.toLowerCase() ||
      String(item.email || "").toLowerCase() === data.email
    );

    if (duplicate) {
      setError("pesId", duplicate.pesId.toLowerCase() === data.pesId.toLowerCase()
        ? "This PES ID is already registered."
        : "This email is already registered.");
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showSubmitError("Registration service is unavailable. Please try again.");
      return;
    }

    button.disabled = true;

    const record = {
      id: makeId(),
      ...data,
      entryFee: 0,
      paymentStatus: "PENDING",
      registrationStatus: "REGISTERED",
      registeredAt: new Date().toISOString()
    };

    const client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    const { error } = await client
      .from("registrations")
      .insert({
        registration_code: record.id,
        name: record.name,
        phone: record.phone,
        email: record.email,
        pes_id: record.pesId,
        entry_fee: record.entryFee,
        registration_status: record.registrationStatus,
        payment_status: record.paymentStatus,
        registered_at: record.registeredAt
      });

    if (error) {
      console.error("Supabase registration error:", error);

      if (error.code === "23505") {
        const message = String(error.message || "").toLowerCase();
        if (message.includes("pes_id")) {
          showSubmitError("This PES ID is already registered.");
        } else if (message.includes("email")) {
          showSubmitError("This email is already registered.");
        } else {
          showSubmitError("This registration already exists.");
        }
      } else {
        showSubmitError("Could not save registration. Please try again.");
      }
      return;
    }

    registrations.push(record);
    saveRegistrations(registrations);

    registrationId.textContent = record.id;
    successBox.hidden = false;
    form.reset();
    button.disabled = false;
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();