(() => {
  const modalElement = document.getElementById("letterModal");
  const letterContent = document.getElementById("letterContent");
  const triggerButtons = document.querySelectorAll(".generate-letter");
  const modal = modalElement ? new bootstrap.Modal(modalElement) : null;

  const handleClick = async (evt) => {
    const btn = evt.currentTarget;
    const payload = {
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      currency: btn.dataset.currency,
      billingCycle: btn.dataset.cycle,
      nextPaymentDate: btn.dataset.next,
      category: btn.dataset.category,
    };

    try {
      const res = await fetch("/api/ai/generate-cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation error");
      if (letterContent) {
        letterContent.textContent = data.letter || "Lettre non disponible.";
      }
      if (modal) modal.show();
    } catch (err) {
      if (letterContent)
        letterContent.textContent = "Generation impossible pour le moment.";
      if (modal) modal.show();
      console.error(err);
    }
  };

  triggerButtons.forEach((btn) => btn.addEventListener("click", handleClick));
})();
