var themeColor = localStorage.getItem('themeColor') || 'light';
console.log("Default theme:", themeColor);

document.documentElement.setAttribute("data-theme", themeColor);

function checkTheme() {
    console.log("Check theme activated");

    //local storage is used to override OS theme settings
    if(localStorage.getItem("themeColor")){
        if(localStorage.getItem("themeColor") == "dark"){
            var themeColor = "dark";
        }
    } else {
        checkOSTheme();
    }

    changeTheme(themeColor);
}

function checkOSTheme () {
    if (!window.matchMedia) {
        console.log("matchMedia not supported");
        return false; // Check if matchMedia is supported
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        themeColor = "dark"; // Check if OS default is dark
        console.log("OS is dark");
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem('themeColor', 'dark');
    }

    return themeColor;
}

function changeTheme(theme) {
    themeColor = theme || document.documentElement.getAttribute("data-theme");
    console.log("Changing theme to:", themeColor);
    if (theme === "os") {
        checkOSTheme();
        themeColor = document.documentElement.getAttribute("data-theme");
        console.log("Theme changed to OS, theme is", themeColor);
    } else if (theme === "dark") {
        themeColor = "dark";
    } else if (theme === "light") {
        themeColor = "light";
    }

    document.documentElement.setAttribute("data-theme", themeColor);
    localStorage.setItem('themeColor', themeColor);
}

checkTheme();
