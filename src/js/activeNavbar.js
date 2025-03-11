document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("header nav a");
    const currentPage = window.location.pathname;

    links.forEach(link => {
        const linkHref = link.getAttribute("href");

        if (currentPage.includes(linkHref) || currentPage.startsWith(linkHref.replace('.html', ''))) {
            link.style.color = "#0ACE88";
        } else {
            link.classList.add("text-white");
        }
    });
});