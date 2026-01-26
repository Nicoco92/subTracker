(() => {
  const nameInput = document.querySelector("#name");
  const priceInput = document.querySelector("#price");
  const categoryInput = document.querySelector("#category");
  const cycleSelect = document.querySelector("#billingCycle");
  const hint = document.querySelector("#autofill-hint");

  const debounce = (fn, delay = 500) => {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const normalizeCycle = (value) => {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower.includes("week")) return "weekly";
    if (lower.includes("quarter")) return "quarterly";
    if (lower.includes("year") || lower.includes("ann")) return "yearly";
    if (lower.includes("once") || lower.includes("one")) return "once";
    return "monthly";
  };

  const applyData = (data) => {
    if (typeof data.price === "number" && !Number.isNaN(data.price)) {
      priceInput.value = data.price;
    }
    if (typeof data.category === "string") {
      categoryInput.value = data.category;
    }
    if (typeof data.cycle === "string") {
      const normalized = normalizeCycle(data.cycle);
      const option = Array.from(cycleSelect.options).find(
        (opt) => opt.value === normalized,
      );
      if (option) cycleSelect.value = normalized;
    }
    if (hint) {
      hint.textContent = data.mock
        ? "Donnees remplies via mode mock (aucune facture)"
        : "Donnees proposees par l'IA, verifiez avant de soumettre.";
    }
  };

  const fetchAutofill = async () => {
    const name = nameInput.value.trim();
    if (!name || name.length < 2) return;
    try {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Autofill failed");
      const data = await res.json();
      applyData(data);
    } catch (err) {
      if (hint) hint.textContent = "Autofill indisponible pour le moment.";
      console.error(err);
    }
  };

  if (nameInput) {
    nameInput.addEventListener("input", debounce(fetchAutofill));
  }
})();
