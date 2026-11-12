document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("feedback-form");
  if (!form) return;

  const button = document.getElementById("feedback-submit");
  const message = document.getElementById("feedback-message");
  let sending = false;

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (sending || !form.reportValidity()) return;

    const rating = form.querySelector(
      'input[name="rating"]:checked'
    );
    const comment = form.elements.comment.value.trim();

    if (!rating || !comment) {
      message.textContent = "請選擇評價並填寫意見。";
      return;
    }

    const token = form.querySelector(
      '[name="csrfmiddlewaretoken"]'
    ).value;

    sending = true;
    button.disabled = true;
    button.textContent = "送出中…";
    message.textContent = "";

    try {
      const response = await fetch(form.dataset.apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": token
        },
        body: JSON.stringify({
          page_id: form.dataset.pageId,
          rating: rating.value,
          comment: comment
        })
      });

      if (response.status === 403) {
        throw new Error("驗證失敗，請重新整理頁面再試。");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "送出失敗，請稍後再試。");
      }

      message.textContent =
        result.message + " 回饋編號：" + result.id;

      form.reset();
    } catch (error) {
      message.textContent =
        "未能確認送出成功：" + error.message;
    } finally {
      sending = false;
      button.disabled = false;
      button.textContent = "送出回饋";
    }
  });
});