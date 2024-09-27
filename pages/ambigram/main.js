const slide = {
    name:"ambigram"    
}
function setup() {
    let img = document.getElementById("symmetry");

    let bgImg = new Image();
    bgImg.src = img.src;
    bgImg.classList.add('dynamic')
    bgImg.style.position = "absolute";
    bgImg.style.zIndex = -1;
    bgImg.style.filter = "invert(50%)"
    img.parentElement.insertBefore(bgImg, img);
    

    img.onclick = ()=> {
        if(img.style.transform == "rotate(180deg)")
            img.style.transform = "rotate(0deg)"
        else
            img.style.transform = "rotate(180deg)"
    }
}

function cleanup() {
}
