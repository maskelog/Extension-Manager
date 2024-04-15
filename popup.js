let extensionGroups = {};

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
  setupEventListeners();
  loadExtensions();
  loadGroups();
}

function setupEventListeners() {
  document
    .getElementById("createGroupBtn")
    .addEventListener("click", () => displayModal(true));
  document
    .querySelector(".close")
    .addEventListener("click", () => displayModal(false));
  document.getElementById("saveGroupBtn").addEventListener("click", saveGroup);
}

function displayModal(show, groupName = "") {
  const modal = document.getElementById("groupModal");
  modal.style.display = show ? "block" : "none";
  if (show) {
    populateExtensionCheckboxes(groupName);
    document.getElementById("groupName").value = groupName;
  }
}

function populateExtensionCheckboxes(groupName) {
  const checkboxesContainer = document.getElementById("extensionCheckboxes");
  checkboxesContainer.innerHTML = "";
  chrome.management.getAll((extensions) => {
    const groupExtensions = extensionGroups[groupName] || [];
    extensions
      .filter((ext) => !ext.isApp)
      .forEach((extension) => {
        const checkboxContainer = createCheckboxForExtension(
          extension,
          groupExtensions.includes(extension.id)
        );
        checkboxesContainer.appendChild(checkboxContainer);
      });
  });
}

function createCheckboxForExtension(extension, isChecked) {
  const container = createElement("div", { className: "checkbox-container" });
  const checkbox = createElement("input", {
    type: "checkbox",
    id: extension.id,
    checked: isChecked,
  });
  const label = createElement(
    "label",
    { htmlFor: extension.id },
    extension.name
  );

  container.appendChild(checkbox);
  container.appendChild(label);
  return container;
}

function saveGroup() {
  const groupName = document.getElementById("groupName").value.trim();
  if (groupName === "") {
    alert("Please enter a group name.");
    return;
  }
  const checkboxes = document.querySelectorAll(
    '#extensionCheckboxes input[type="checkbox"]:checked'
  );
  const groupExtensions = Array.from(checkboxes).map((checkbox) => checkbox.id);
  extensionGroups[groupName] = groupExtensions;
  chrome.storage.sync.set({ [groupName]: groupExtensions }, () => {
    console.log("Group updated:", groupName, groupExtensions);
    displayGroups();
    displayModal(false);
  });
}
function displayGroups() {
  const groupList = document.getElementById("groupList");
  groupList.innerHTML = "";
  Object.keys(extensionGroups).forEach((groupName) => {
    groupList.appendChild(createGroupControls(groupName));
  });
}

function createGroupControls(groupName) {
  const groupDiv = createElement("div", { className: "group-controls" });
  const groupNameLabel = createElement("span", {
    textContent: groupName,
    className: "group-name-label",
  });

  const editIconSVG = `<svg dataSlot="icon" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>`;
  const deleteIconSVG = `<svg dataSlot="icon" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/></svg>`;

  const groupToggleSwitch = createToggleSwitch(groupName);

  const editButton = createElement("button", {
    className: "edit-button",
    onclick: () => displayModal(true, groupName),
    innerHTML: editIconSVG,
  });
  const deleteButton = createElement("button", {
    className: "delete-button",
    onclick: () => deleteGroup(groupName),
    innerHTML: deleteIconSVG,
  });

  groupDiv.append(groupNameLabel, groupToggleSwitch, editButton, deleteButton);
  return groupDiv;
}

function createToggleSwitch(groupName) {
  const label = createElement("label", { className: "switch" });
  let isActive = false;

  chrome.management.getAll((extensions) => {
    const groupExtensions = extensionGroups[groupName];
    if (groupExtensions) {
      isActive = groupExtensions.every((extId) =>
        extensions.some((ext) => ext.id === extId && ext.enabled)
      );

      input.checked = isActive;
    }
  });

  const input = createElement("input", {
    type: "checkbox",
    checked: isActive,
    onchange: () => toggleGroup(groupName, input.checked),
  });
  const slider = createElement("span", { className: "slider" });

  label.append(input, slider);
  return label;
}

function checkGroupActiveState(groupName) {
  let isActive = false;
  if (extensionGroups[groupName]) {
    chrome.management.getAll((extensions) => {
      isActive = extensionGroups[groupName].every((extId) =>
        extensions.find((ext) => ext.id === extId && ext.enabled)
      );
    });
  }
  return isActive;
}

function toggleGroup(groupName, state) {
  chrome.management.getAll((extensions) => {
    const groupExtensions = extensionGroups[groupName];
    if (!groupExtensions) return;

    groupExtensions.forEach((extId) => {
      const ext = extensions.find((e) => e.id === extId);
      if (ext) {
        chrome.management.setEnabled(ext.id, state, () => {
          console.log(
            `Extension ${ext.name} is now ${state ? "enabled" : "disabled"}.`
          );
        });
      }
    });
    loadExtensions();
  });
}

function deleteGroup(groupName) {
  delete extensionGroups[groupName];
  chrome.storage.sync.remove(groupName, () => {
    console.log(`Group ${groupName} deleted.`);
    displayGroups();
  });
}

function loadExtensions() {
  chrome.management.getAll((extensions) => {
    const container = document.getElementById("extensionsList");
    container.innerHTML = "";
    extensions
      .filter((ext) => !ext.isApp)
      .sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      })
      .forEach((extension) => {
        chrome.management.get(extension.id, (details) => {
          container.appendChild(
            createExtensionSwitch(
              extension,
              details.icons ? details.icons[details.icons.length - 1].url : ""
            )
          );
        });
      });
  });
}

function loadGroups() {
  chrome.storage.sync.get(null, (items) => {
    Object.entries(items).forEach(([key, value]) => {
      if (Array.isArray(value)) extensionGroups[key] = value;
    });
    displayGroups();
  });
}

function createElement(tag, options = {}, textContent = "") {
  const element = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (key === "textContent") element.textContent = value;
    else if (key === "onclick") element.onclick = value;
    else element[key] = value;
  });
  if (textContent) element.textContent = textContent;
  return element;
}

function updateExtension(id, enabled) {
  chrome.management.setEnabled(id, enabled);
  console.log(`Extension ${id} is now ${enabled ? "enabled" : "disabled"}.`);
  chrome.storage.sync.set({ [id]: enabled });
}

function loadExtensions() {
  chrome.management.getAll((extensions) => {
    const container = document.getElementById("extensionsList");
    container.innerHTML = ""; // Clear previous contents
    extensions
      .filter((ext) => !ext.isApp)
      .forEach((extension) => {
        chrome.management.get(extension.id, (details) => {
          container.appendChild(
            createExtensionSwitch(
              extension,
              details.icons ? details.icons[details.icons.length - 1].url : ""
            )
          );
        });
      });
  });
}

function createExtensionSwitch(extension, iconUrl) {
  const container = createElement("div", {
    className: "extension-switch-container",
    style: "align-items: center; display: flex;",
  });
  const icon = createElement("img", {
    src: iconUrl,
    alt: `${extension.name} icon`,
    style: "width: 24px; height: 24px; margin-right: 10px;",
  });
  const switchLabel = createElement("label", { className: "switch" });
  const switchInput = createElement("input", {
    type: "checkbox",
    checked: extension.enabled,
    onchange: () => updateExtension(extension.id, switchInput.checked),
  });
  const switchSlider = createElement("span", { className: "slider" });
  const extensionName = createElement("span", {
    textContent: extension.name,
    style: "font-size: 18px;",
  });

  switchLabel.append(switchInput, switchSlider);
  container.append(icon, extensionName, switchLabel);
  return container;
}

function updateExtension(id, enabled) {
  chrome.management.setEnabled(id, enabled);
  console.log(`Extension ${id} is now ${enabled ? "enabled" : "disabled"}.`);
  chrome.storage.sync.set({ [id]: enabled });
}
