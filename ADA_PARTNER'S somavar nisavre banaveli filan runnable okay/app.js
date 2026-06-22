// ADA Algorithm Lab - Main Shell & Application Controller
// Handles page routing, collapsable sidebar navigation, and search filtering

// Global toggle for sidebar
function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar) {
    if (window.innerWidth <= 992) {
      sidebar.classList.toggle('active-mobile');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }
}

// Search filtering for algorithms in sidebar
function filterAlgorithms() {
  var query = document.getElementById('algo-search').value.toLowerCase();
  var groups = document.querySelectorAll('.sidebar .nav-group');
  
  groups.forEach(function(group) {
    var groupHasMatch = false;
    var groupTabs = group.querySelectorAll('.tab');
    
    groupTabs.forEach(function(tab) {
      var text = tab.textContent.toLowerCase();
      var title = tab.getAttribute('title') || '';
      title = title.toLowerCase();
      
      if (text.includes(query) || title.includes(query)) {
        tab.style.display = 'flex';
        groupHasMatch = true;
      } else {
        tab.style.display = 'none';
      }
    });
    
    // Hide entire nav-group if no matching tabs are found
    if (groupHasMatch) {
      group.style.display = 'block';
    } else {
      group.style.display = 'none';
    }
  });
}

// showTool is defined in the main inline script with full canvas-resize + callback support.

// Close mobile sidebar on resize if viewport exceeds break-point
window.addEventListener('resize', function() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar && window.innerWidth > 992) {
    sidebar.classList.remove('active-mobile');
  }
});
