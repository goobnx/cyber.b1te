function searchText() {
  let input = document.getElementById("searchText").value.toLowerCase();
  let contentValue = document.getElementById("contentValue");

  if (!contentValue.originalHTML) {
    contentValue.originalHTML = contentValue.innerHTML;
  } else if (!input) {
    contentValue.innerHTML = contentValue.originalHTML;
    return;
  }

  let tempDiv = document.createElement("div");
  tempDiv.innerHTML = contentValue.originalHTML;

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
      Array.from(node.childNodes).forEach(highlightTextNodes);
    }
  }

  highlightTextNodes(tempDiv);

  contentValue.innerHTML = tempDiv.innerHTML;
}