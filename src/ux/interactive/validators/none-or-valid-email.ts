export function noneOrValidEmail(value: string): boolean | string {
    if (value === "none") {
        return true;
    }
    return isValidEmail(value)
        ? true
        : "please enter an email address";
}

function isValidEmail(value: string): boolean {
    return !!value.match(/(([^<>()[]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/);
}
