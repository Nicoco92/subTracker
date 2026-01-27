document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const priceInput = document.getElementById("price");
  const categorySelect = document.getElementById("category");
  const cycleSelect = document.getElementById("billingCycle");
  const loadingIndicator = document.getElementById("ai-loading");

  if (nameInput) {
    nameInput.addEventListener("blur", async () => {
      const name = nameInput.value.trim();
      if (!name) return;

      if (priceInput.value) return;

      try {
        if (loadingIndicator) loadingIndicator.style.display = "block";

        const response = await fetch("/api/ai/autofill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const data = await response.json();

        if (data && !data.error) {
          if (data.price) priceInput.value = data.price;

          if (data.category && categorySelect) {
            const options = Array.from(categorySelect.options);
            const match = options.find((opt) => opt.value === data.category);
            if (match) {
              categorySelect.value = data.category;
            } else {
              categorySelect.value = "Autre";
            }
          }
          if (data.billingCycle && cycleSelect) {
            cycleSelect.value = data.billingCycle;
          }
        }
      } catch (error) {
        console.error("Erreur autofill:", error);
      } finally {
        if (loadingIndicator) loadingIndicator.style.display = "none";
      }
    });
  }
});
