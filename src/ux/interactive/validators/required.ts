export function required(value: string) {
    return (value || "").trim() !== "";
}
