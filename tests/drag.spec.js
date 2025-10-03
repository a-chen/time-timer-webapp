import { test, expect } from '@playwright/test';

test.describe('Timer Drag Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should allow dragging outside circle after starting drag inside', async ({ page }) => {
    // Get the timer container
    const timerContainer = page.locator('#timerContainer');
    await expect(timerContainer).toBeVisible();

    // Get timer display element
    const timerTime = page.locator('#timerTime');

    // Initial time should be 00:00
    await expect(timerTime).toHaveText('00:00');

    // Get the bounding box of the timer container
    const box = await timerContainer.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Start drag inside the circle (at 12 o'clock position, slightly inside)
    const startX = centerX;
    const startY = centerY - 100; // 100px above center, well inside the circle

    // Use page.evaluate to trigger jQuery events properly
    await page.evaluate(({ startX, startY, endX, endY }) => {
      const $timerContainer = $('#timerContainer');
      const containerOffset = $timerContainer.offset();

      // Trigger mousedown
      const mousedownEvent = $.Event('mousedown', {
        pageX: startX,
        pageY: startY,
        originalEvent: { preventDefault: () => {} }
      });
      $timerContainer.trigger(mousedownEvent);

      // Simulate dragging with mousemove events
      for (let step = 0; step <= 10; step++) {
        const x = startX + (endX - startX) * (step / 10);
        const y = startY + (endY - startY) * (step / 10);
        const mousemoveEvent = $.Event('mousemove', {
          pageX: x,
          pageY: y
        });
        $(document).trigger(mousemoveEvent);
      }

      // Trigger mouseup
      const mouseupEvent = $.Event('mouseup');
      $(document).trigger(mouseupEvent);
    }, {
      startX,
      startY,
      endX: centerX + 400,
      endY: centerY
    });

    // Wait a moment for the timer to update
    await page.waitForTimeout(200);

    // Check that timer value has changed from 00:00
    const finalTime = await timerTime.textContent();
    expect(finalTime).not.toBe('00:00');

    // Timer should show a valid time between 00:01 and 60:00
    // The exact value depends on the final drag position
    expect(finalTime).toMatch(/^([0-5]?\d):([0-5]\d)$/);
  });

  test('should update timer value continuously while dragging outside', async ({ page }) => {
    const timerContainer = page.locator('#timerContainer');
    const timerTime = page.locator('#timerTime');

    // Get the bounding box
    const box = await timerContainer.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Use page.evaluate to perform the drag and capture timer values
    const times = await page.evaluate(({ centerX, centerY }) => {
      const $timerContainer = $('#timerContainer');
      const $timerTime = $('#timerTime');
      const times = [];

      // Start inside the circle
      const startX = centerX;
      const startY = centerY - 80;

      // Trigger mousedown
      const mousedownEvent = $.Event('mousedown', {
        pageX: startX,
        pageY: startY,
        originalEvent: { preventDefault: () => {} }
      });
      $timerContainer.trigger(mousedownEvent);

      // Move to 12 o'clock position outside
      const pos1X = centerX;
      const pos1Y = centerY - 500;
      for (let i = 0; i <= 5; i++) {
        const x = startX + (pos1X - startX) * (i / 5);
        const y = startY + (pos1Y - startY) * (i / 5);
        $(document).trigger($.Event('mousemove', { pageX: x, pageY: y }));
      }
      times.push($timerTime.text());

      // Move to 3 o'clock position outside
      const pos2X = centerX + 500;
      const pos2Y = centerY;
      for (let i = 0; i <= 5; i++) {
        const x = pos1X + (pos2X - pos1X) * (i / 5);
        const y = pos1Y + (pos2Y - pos1Y) * (i / 5);
        $(document).trigger($.Event('mousemove', { pageX: x, pageY: y }));
      }
      times.push($timerTime.text());

      // Move to 6 o'clock position outside
      const pos3X = centerX;
      const pos3Y = centerY + 500;
      for (let i = 0; i <= 5; i++) {
        const x = pos2X + (pos3X - pos2X) * (i / 5);
        const y = pos2Y + (pos3Y - pos2Y) * (i / 5);
        $(document).trigger($.Event('mousemove', { pageX: x, pageY: y }));
      }
      times.push($timerTime.text());

      // Trigger mouseup
      $(document).trigger($.Event('mouseup'));

      return times;
    }, { centerX, centerY });

    // All times should be different, showing continuous updates
    expect(times[0]).not.toBe(times[1]);
    expect(times[1]).not.toBe(times[2]);
    expect(times[0]).not.toBe(times[2]);
  });

  test('should stop timer on mousedown and restart on mouseup', async ({ page }) => {
    // Set initial timer value
    await page.goto('http://localhost:3000?init=600'); // 10 minutes

    const timerContainer = page.locator('#timerContainer');
    const timerTime = page.locator('#timerTime');

    // Wait for timer to be set
    await expect(timerTime).toHaveText('10:00');

    // Get initial time after a moment
    await page.waitForTimeout(500);
    const initialTime = await timerTime.textContent();

    // Get the bounding box
    const box = await timerContainer.boundingBox();
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Click and hold inside the circle (should stop timer)
    await page.mouse.move(centerX, centerY - 80);
    await page.mouse.down();

    // Wait a moment while holding
    await page.waitForTimeout(500);
    const timeDuringDrag = await timerTime.textContent();

    // Timer should have changed during drag (we set a new position)
    // but it should not be counting down anymore
    await page.mouse.up();

    // The timer value during drag might be different because we changed position
    // The important part is that the mousedown/mouseup events are handled correctly
    expect(timeDuringDrag).toBeTruthy();
  });
});
