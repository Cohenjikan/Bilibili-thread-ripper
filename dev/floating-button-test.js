// The button in the page corner: it opens the settings panel, hides while the panel is open
// and while the video fills the screen, follows its own switch, and the removed first-run
// guide never shows up again (issue #26).
(async () => {
  "use strict";
  const root = globalThis;

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const launcher = () => document.getElementById("__bilibili_thread_ripper_launcher__");
  const button = () => launcher()?.shadowRoot?.querySelector(".btr-launcher") || null;
  const panel = () => document.getElementById("__bilibili_thread_ripper_settings_dialog__");
  const player = document.querySelector(".bpx-player-container");
  const resultNode = document.getElementById("result");

  await wait(600);
  const shownByDefault = Boolean(button());
  const label = button()?.textContent || "";
  // Never dragged: it sits near the bottom right, clear of Bilibili's own row of buttons.
  const startBox = button()?.getBoundingClientRect();
  const defaultSpot = Boolean(startBox) && startBox.top > root.innerHeight / 2
    && root.innerWidth - startBox.right > 40 && root.innerWidth - startBox.right < 120;

  // Clicking it opens the panel; the button steps aside while the panel is open.
  button()?.click();
  await wait(200);
  const panelOpened = Boolean(panel());
  const hiddenWhilePanelOpen = !button();

  // The switch inside the panel turns it off and on again.
  const switchInput = panel()?.querySelector(`#${"__bilibili_thread_ripper_settings__"}`)
    ?.shadowRoot?.getElementById("floating-button");
  const switchWasOn = switchInput?.checked === true;
  if (switchInput) {
    switchInput.checked = false;
    switchInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
  await wait(300);
  const savedOff = globalThis.__btrTestStorage.syncState.floatingButton === false;
  // Close the panel: with the switch off the button must stay away.
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(300);
  const hiddenWhenSwitchedOff = !button();

  // Back on through the stored settings, the way another tab would change them.
  globalThis.chrome.storage.sync.set({ floatingButton: true }, () => {});
  await wait(400);
  const backAfterSwitchedOn = Boolean(button());

  // 网页全屏 keeps the browser out of it: the picture simply fills the window. The button
  // goes away for any video that covers the window, however it got there.
  const video = player.querySelector("video");
  video.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;";
  root.dispatchEvent(new Event("resize"));
  await wait(200);
  const hiddenInWebFullscreen = !button();
  video.style.cssText = "width:320px;height:180px;";
  root.dispatchEvent(new Event("resize"));
  await wait(200);
  const backAfterFullscreen = Boolean(button());

  // Dragging: pick it up, move it, let go. Dropped in the middle it stays put; dropped near
  // an edge it snaps flush to it. Dragging never counts as a click.
  const opacity = Number(getComputedStyle(button()).opacity);
  const drag = (toX, toY) => {
    const box = button().getBoundingClientRect();
    const at = (type, x, y) => button().dispatchEvent(new PointerEvent(type, { pointerId: 7, clientX: x, clientY: y, bubbles: true, button: 0 }));
    at("pointerdown", box.left + 20, box.top + 20);
    at("pointermove", toX + 20, toY + 20);
    at("pointerup", toX + 20, toY + 20);
  };
  // Well away from both edges: it stays exactly there.
  const middle = Math.round(root.innerWidth / 2);
  drag(middle, 240);
  await wait(200);
  const afterFreeDrag = button().getBoundingClientRect();
  const stayedWhereDropped = Math.abs(afterFreeDrag.left - middle) < 8 && Math.abs(afterFreeDrag.top - 240) < 24;
  const panelStayedClosed = !panel();
  const savedFreeSpot = Math.abs(Number(globalThis.__btrTestStorage.syncState.floatingButtonLeft) - middle / root.innerWidth) < 0.04
    && Math.abs(Number(globalThis.__btrTestStorage.syncState.floatingButtonTop) - 240 / root.innerHeight) < 0.06;
  // Close to the left edge: it snaps flush to it.
  drag(40, 260);
  await wait(200);
  const afterDrag = button().getBoundingClientRect();
  const snappedLeft = afterDrag.left <= 16 && Math.abs(afterDrag.top - 260) < 24;
  const savedLeftEdge = Number(globalThis.__btrTestStorage.syncState.floatingButtonLeft) === 0;
  // Close to the right edge: flush to that one.
  drag(root.innerWidth - 70, 300);
  await wait(200);
  const snappedRight = button().getBoundingClientRect().right >= root.innerWidth - 20;
  const savedRightEdge = Number(globalThis.__btrTestStorage.syncState.floatingButtonLeft) === 1;

  const noOnboarding = !document.getElementById("__bilibili_thread_ripper_onboarding__");

  const result = {
    shownByDefault,
    label,
    panelOpened,
    hiddenWhilePanelOpen,
    switchWasOn,
    savedOff,
    hiddenWhenSwitchedOff,
    backAfterSwitchedOn,
    hiddenInWebFullscreen,
    backAfterFullscreen,
    noOnboarding,
    defaultSpot,
    faintUntilHovered: opacity >= 0.5 && opacity <= 0.7,
    stayedWhereDropped,
    savedFreeSpot,
    snappedLeft,
    savedLeftEdge,
    snappedRight,
    savedRightEdge,
    panelStayedClosed,
    errors: []
  };
  result.pass = Object.entries(result).every(([key, value]) => ["errors", "label"].includes(key) ? true : value === true)
    && result.label === "BTR" && result.errors.length === 0;
  resultNode.textContent = JSON.stringify(result, null, 2);
  resultNode.dataset.pass = String(result.pass);
})();
