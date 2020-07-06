export function required(value: string): boolean | string {
    return (value || "").trim() === ""
        ? "value is required"
        : true;
}
