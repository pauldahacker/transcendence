// makes data-userid-row clickable, allows seeing profiles on search and news
export function attachProfileLinks(container: HTMLElement, onClose?: () => void) {
    const userRows = container.querySelectorAll("[data-userid-row]");
    userRows.forEach((row) => {
      row.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const userId = target.dataset.useridRow;
        if (!userId) return;
  
        // Optional: close popup if provided
        if (onClose) onClose();
  
        // Navigate to the user's profile
        window.location.hash = `#/profile/${userId}`;
      });
    });
  }
  