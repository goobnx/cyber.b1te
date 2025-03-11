function searchText() {
  let input = document.getElementById("searchText").value.toLowerCase();
  let contentValue = document.getElementById("contentValue");

  // Reset to original state first
  if (!contentValue.originalHTML) {
    contentValue.originalHTML = contentValue.innerHTML;
  } else if (!input) {
    contentValue.innerHTML = contentValue.originalHTML;
    return;
  }

  // Create a document fragment to work with the DOM structure
  let tempDiv = document.createElement("div");
  tempDiv.innerHTML = contentValue.originalHTML;

  // Function to recursively process text nodes only
  function highlightTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.toLowerCase().includes(input)) {
        let wrapper = document.createElement("span");
        wrapper.innerHTML = node.textContent.replace(
          new RegExp(`(${input})`, "gi"),
          '<span class="bg-green-neon text-black">$1</span>'
        );
        node.parentNode.replaceChild(wrapper, node);
      }
    } else {
      // Process child nodes
      Array.from(node.childNodes).forEach(highlightTextNodes);
    }
  }

  // Apply highlighting to text nodes only
  highlightTextNodes(tempDiv);

  // Update content
  contentValue.innerHTML = tempDiv.innerHTML;
}