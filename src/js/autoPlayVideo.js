document
  .getElementById("btnScrollToSectionVideo")
  .addEventListener("click", function (event) {
    event.preventDefault();

    const targetSection = document.getElementById("section_video");
    const video = document.getElementById("videoAboutUs");

    const scrollDestination = targetSection.offsetTop - 110;
    
    window.scrollTo({
      top: scrollDestination,
      behavior: "smooth",
    });

    let scrollComplete = false;
    const scrollListener = function() {
      if (Math.abs(window.scrollY - scrollDestination) < 5) {
        scrollComplete = true;
        window.removeEventListener('scroll', scrollListener);

        if (video.readyState >= 3) {
          video.play();
        } else {
          video.addEventListener('canplay', function playWhenReady() {
            video.play();
            video.removeEventListener('canplay', playWhenReady);
          });
        }
      }
    };
    
    window.addEventListener('scroll', scrollListener);

    setTimeout(() => {
      if (!scrollComplete) {
        window.removeEventListener('scroll', scrollListener);
        
        if (video.readyState >= 3) {
          video.play();
        } else {
          video.addEventListener('canplay', function playWhenReady() {
            video.play();
            video.removeEventListener('canplay', playWhenReady);
          });
        }
      }
    }, 1000);
  });