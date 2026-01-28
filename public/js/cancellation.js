document.addEventListener("DOMContentLoaded", () => {
  const generateBtns = document.querySelectorAll(".generate-letter");
  const letterModalEl = document.getElementById("letterModal");
  const letterModal = new bootstrap.Modal(letterModalEl);
  const letterContent = document.getElementById("letterContent");

  const loadingModalEl = document.getElementById("loadingModal");
  const loadingModal = new bootstrap.Modal(loadingModalEl);

  const confirmLetterModalEl = document.getElementById("confirmLetterModal");
  const confirmLetterModal = new bootstrap.Modal(confirmLetterModalEl);
  const confirmLetterSubName = document.getElementById("confirmLetterSubName");
  const confirmGenerateLetterBtn = document.getElementById("confirmGenerateLetterBtn");

  let pendingLetterData = null;

  generateBtns.forEach((btn) => {
    btn.addEventListener("click", async () => {
      pendingLetterData = {
        name: btn.getAttribute("data-name"),
        price: btn.getAttribute("data-price"),
        currency: btn.getAttribute("data-currency"),
        billingCycle: btn.getAttribute("data-cycle"),
        nextPaymentDate: btn.getAttribute("data-next"),
        category: btn.getAttribute("data-category"),
      };
      confirmLetterSubName.textContent = pendingLetterData.name;
      confirmLetterModal.show();
    });
  });

  if (confirmGenerateLetterBtn) {
    confirmGenerateLetterBtn.addEventListener("click", async () => {
      confirmLetterModal.hide();
      if (!pendingLetterData) return;
      loadingModal.show();

      try {
        const response = await fetch("/api/ai/generate-cancellation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingLetterData),
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
  }
});
