<!-- Inject scroll-to-top button -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Add scroll-to-top button if it doesn't exist
    if (!document.getElementById('scroll-to-top')) {
      const aiWrapper = document.querySelector('.ai-wrapper');
      if (aiWrapper && aiWrapper.firstChild) {
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-top';
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.textContent = '↑';
        scrollBtn.setAttribute('aria-label', 'Back to top');
        scrollBtn.style.display = 'none';
        aiWrapper.insertBefore(scrollBtn, aiWrapper.firstChild);
      }
    }
  });
</script>
