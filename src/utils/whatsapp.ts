export function openWhatsApp(message: string): void {
    const phone = "250798891543";
    window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank"
    );
}
