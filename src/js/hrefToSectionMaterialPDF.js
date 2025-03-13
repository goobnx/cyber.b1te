document
  .querySelector('a[href="#section_material"]')
  .addEventListener("click", function (e) {
    e.preventDefault(); // Mencegah default jump
    document.querySelector("#section_material").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
