document.addEventListener("DOMContentLoaded", () => {
  const generateBtns = document.querySelectorAll(".generate-letter");
  const letterModalEl = document.getElementById("letterModal");
  const letterModal = new bootstrap.Modal(letterModalEl);
  const letterContent = document.getElementById("letterContent");

  const loadingModalEl = document.getElementById("loadingModal");
  const loadingModal = new bootstrap.Modal(loadingModalEl);

  generateBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const name = btn.getAttribute("data-name");
      const price = btn.getAttribute("data-price");
      const currency = btn.getAttribute("data-currency");
      const billingCycle = btn.getAttribute("data-cycle");
      const nextPaymentDate = btn.getAttribute("data-next");
      const category = btn.getAttribute("data-category");

      loadingModal.show();

      try {
        const response = await fetch("/api/ai/generate-cancellation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            price,
            currency,
            billingCycle,
            nextPaymentDate,
            category,
          }),
        });

        const data = await response.json();

        setTimeout(() => {
          loadingModal.hide();

          if (data.letter) {
            letterContent.textContent = data.letter;
            letterModal.show();
          } else {
            alert("Erreur lors de la génération de la lettre.");
          }
        }, 500);
      } catch (error) {
        loadingModal.hide();
        console.error("Erreur:", error);
        alert("Impossible de contacter l'IA.");
      }
    });
  });
});
