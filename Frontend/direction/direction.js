const extraSection = document.querySelector(".extra-section");
const extraToggle = document.getElementById("extraToggle");
const extraContent = document.getElementById("extraContent");

extraToggle.addEventListener("click", () => {
  const isOpen = extraSection.classList.toggle("open");
  extraToggle.setAttribute("aria-expanded", String(isOpen));
  extraContent.style.maxHeight = isOpen ? `${extraContent.scrollHeight}px` : "0px";
});

window.addEventListener("resize", () => {
  if (extraSection.classList.contains("open")) {
    extraContent.style.maxHeight = `${extraContent.scrollHeight}px`;
  }
});

const cards = document.querySelectorAll(".pillar-card");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 120);

        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

cards.forEach((card) => observer.observe(card));


document.querySelectorAll(".pillar-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".pillar-card");
    const isOpen = card.classList.toggle("open");

    button.setAttribute("aria-expanded", isOpen);
  });
});