const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);

const ALLOWED_ATTRIBUTES = new Set(["href", "target", "rel"]);

export function sanitizeRichTextHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  if (typeof window === "undefined") {
    return value;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(value, "text/html");

  documentNode.body.querySelectorAll("*").forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(documentNode.createTextNode(element.textContent ?? ""));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (!ALLOWED_ATTRIBUTES.has(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      const safeHref = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
      if (!safeHref) {
        element.removeAttribute("href");
      }
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noreferrer");
    }
  });

  return documentNode.body.innerHTML;
}

export function isRichTextEmpty(value: string | null | undefined) {
  if (!value) {
    return true;
  }
  if (typeof window === "undefined") {
    return value.trim().length === 0;
  }
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(value, "text/html");
  return (documentNode.body.textContent ?? "").trim().length === 0;
}

