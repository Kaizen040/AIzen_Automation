document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll('[data-link]');
    const indicator = document.querySelector('.nav-indicator');
    const sections = [...document.querySelectorAll('section')];

    if (!indicator || links.length === 0) return;

    function moveIndicator(el) {
        const rect = el.getBoundingClientRect();
        const parentRect = el.parentElement.getBoundingClientRect();

        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - parentRect.left}px`;
    }

    links.forEach(link => {
        link.addEventListener('click', e => {
            const href = link.getAttribute('href');

            if (href.startsWith("#")) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    moveIndicator(link);
                }
            }
        });
    });

    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + window.innerHeight / 3;

        sections.forEach(sec => {
            if (
                scrollPos > sec.offsetTop &&
                scrollPos < sec.offsetTop + sec.offsetHeight
            ) {
                const activeLink = document.querySelector(
                    `a[href="#${sec.id}"]`
                );
                if (activeLink) moveIndicator(activeLink);
            }
        });
    });
});

// navigation.js unten ergänzen:
window.addEventListener('scroll', () => {
    const header = document.querySelector('.site-header');
    if (window.scrollY > 50) {
        header.style.background = 'rgba(11,15,26,0.95)';
    } else {
        header.style.background = 'rgba(11,15,26,0.85)';
    }
});

