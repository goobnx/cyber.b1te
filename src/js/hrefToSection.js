document.addEventListener('DOMContentLoaded', function() {

    const navLinks = document.querySelectorAll('.pintas a');
    const sectionMap = {
      'Video Demonstrasi': 'section_video',
      'Tentang Kami': 'section_about',
      'Testimoni': 'section_testimonials',
      'Cara Penggunaan': 'section_howto',
      'Komunitas': 'section_community'
    };

    navLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        
        const linkText = this.textContent;
        
        const sectionId = sectionMap[linkText];
        
        if (sectionId) {
          const targetSection = document.getElementById(sectionId);
          
          if (targetSection) {
            const headerOffset = 110;
            const elementPosition = targetSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  });