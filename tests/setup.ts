if (process.env.DETECT_LEAKS) {
    require("leaked-handles").set({
        timeout: 10000
    });
}
