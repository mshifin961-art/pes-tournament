(() => {
  "use strict";
  const KEY = "pes_tournament_registrations_v1";
  const getData = () => {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };

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

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));

  const formatDate = (iso) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", {
      day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"
    });
  };

  const render = () => {
    const all = getData();
    const query = els.search.value.trim().toLowerCase();
    const status = els.filter.value;

    els.total.textContent = all.length;
    els.registered.textContent = all.filter(x => x.registrationStatus === "REGISTERED").length;
    els.paid.textContent = all.filter(x => x.paymentStatus === "PAID").length;
    els.pending.textContent = all.filter(x => x.paymentStatus === "PENDING").length;

    const filtered = all.filter(item => {
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

  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  els.export.addEventListener("click", () => {
    const rows = getData();
    if (!rows.length) { alert("No registrations to export."); return; }
    const header = ["Registration ID","Name","Phone","Email","PES ID","Entry Fee","Payment Status","Registration Status","Registered At"];
    const body = rows.map(x => [x.id,x.name,x.phone,x.email,x.pesId,x.entryFee || 0,x.paymentStatus,x.registrationStatus,x.registeredAt]);
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
    if (!getData().length) return;
    if (confirm("Delete all registration data stored in this browser?")) {
      localStorage.removeItem(KEY);
      render();
    }
  });

  els.search.addEventListener("input", render);
  els.filter.addEventListener("change", render);
  window.addEventListener("storage", render);
  render();
})();