(() => {
  "use strict";

  const KEY = "pes_tournament_registrations_v1";
  const SUPABASE_URL = "https://inligamwqciyhqionztd.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_mXTRNsfI7hd_YuSbBKVrRQ_J0lAIk7h";

  const els = {
    total: document.getElementById("totalCount"),
    registered: document.getElementById("registeredCount"),
    paid: document.getElementById("paidCount"),
    pending: document.getElementById("pendingCount"),
    table: document.getElementById("playerTable"),
    search: document.getElementById("searchInput"),
    filter: document.getElementById("statusFilter"),
    export: document.getElementById("exportButton"),
    clear: document.getElementById("clearButton")
  };

  let allRows = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));

  const formatDate = (iso) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
      day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
    });
  };

  const normalize = (row) => ({
    id: row.registration_code,
    name: row.name,
    phone: row.phone,
    email: row.email,
    pesId: row.pes_id,
    entryFee: row.entry_fee,
    paymentStatus: row.payment_status,
    registrationStatus: row.registration_status,
    registeredAt: row.registered_at
  });

  const render = () => {
    const query = els.search.value.trim().toLowerCase();
    const status = els.filter.value;

    els.total.textContent = allRows.length;
    els.registered.textContent = allRows.filter(x => x.registrationStatus === "REGISTERED").length;
    els.paid.textContent = allRows.filter(x => x.paymentStatus === "PAID").length;
    els.pending.textContent = allRows.filter(x => x.paymentStatus === "PENDING").length;

    const filtered = allRows.filter(item => {
      const haystack = [item.name, item.pesId, item.phone, item.email].join(" ").toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus = status === "ALL" ||
        item.registrationStatus === status || item.paymentStatus === status;
      return matchesQuery && matchesStatus;
    }).sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));

    if (!filtered.length) {
      els.table.innerHTML = '<tr><td colspan="7" class="empty-row">No matching registrations.</td></tr>';
      return;
    }

    els.table.innerHTML = filtered.map(item => {
      const statusValue = item.paymentStatus === "PAID" ? "PAID" : item.registrationStatus;
      return `<tr>
        <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></td>
        <td>${escapeHtml(item.pesId)}</td>
        <td>${escapeHtml(item.phone)}</td>
        <td>${escapeHtml(item.email)}</td>
        <td>₹${Number(item.entryFee || 0).toFixed(0)}</td>
        <td><span class="status status-${statusValue.toLowerCase()}">${escapeHtml(statusValue)}</span></td>
        <td>${formatDate(item.registeredAt)}</td>
      </tr>`;
    }).join("");
  };

  const loadFromSupabase = async () => {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      throw new Error("Supabase client failed to load.");
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    const { data, error } = await client
      .from("registrations")
      .select("*")
      .order("registered_at", { ascending: false });

    if (error) throw error;

    allRows = (data || []).map(normalize);
    localStorage.setItem(KEY, JSON.stringify(allRows));
    render();
  };

  const showLoadError = (error) => {
    console.error("Supabase admin load error:", error);
    els.table.innerHTML = '<tr><td colspan="7" class="empty-row">Could not load registrations from the database.</td></tr>';
    els.total.textContent = "—";
    els.registered.textContent = "—";
    els.paid.textContent = "—";
    els.pending.textContent = "—";
  };

  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  els.export.addEventListener("click", () => {
    if (!allRows.length) { alert("No registrations to export."); return; }
    const header = ["Registration ID","Name","Phone","Email","PES ID","Entry Fee","Payment Status","Registration Status","Registered At"];
    const body = allRows.map(x => [x.id,x.name,x.phone,x.email,x.pesId,x.entryFee || 0,x.paymentStatus,x.registrationStatus,x.registeredAt]);
    const csv = [header,...body].map(row => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pes-tournament-registrations.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  els.clear.addEventListener("click", () => {
    alert("Registrations are now stored in Supabase. Use the database/admin controls to manage them.");
  });

  els.search.addEventListener("input", render);
  els.filter.addEventListener("change", render);

  loadFromSupabase().catch(showLoadError);
})();