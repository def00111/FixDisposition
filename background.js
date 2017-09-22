"use strict";
const {webRequest} = browser;

function processHeaders(details) {
  if (details.statusCode !== 200 || details.method !== "GET") {
    return;
  }

  let contentDispositionHeader = null;
  for (let header of details.responseHeaders) {
    if (header.name.toLowerCase() == "content-disposition") {
      contentDispositionHeader = header;
      break;
    }
  }

  if (!contentDispositionHeader ||
      !contentDispositionHeader.value) {
    return;
  }

  let parts = contentDispositionHeader.value.split(';');
  for (let i = 0; i < parts.length; i++) {
    let line = parts[i].trim();
    if ("filename=" == line.substring(0, 9)) {
      let startsWithQuote = line.substring(9).startsWith('"');
      let filename = line.substring(9).replace(/^\s*\\?['"]?/, "").replace(/\\?['"]?\s*$/, "");
      if (filename.length == 0) {
        parts.splice(i, 1);
      }
      else if (!startsWithQuote && /\s/.test(filename)) {
        parts[i] = ` filename="${filename}"`;
      }
      else if (/%[0-9A-Fa-f]{2}/.test(filename)) {
        parts[i] = ` filename*=UTF-8''${filename}`;
      }
      break;
    }
  }
  contentDispositionHeader.value = parts.join(';');

  return {
    responseHeaders: details.responseHeaders
  };
}

webRequest.onHeadersReceived.addListener(
  processHeaders,
  {urls: ["<all_urls>"]},
  ["blocking", "responseHeaders"]
);
