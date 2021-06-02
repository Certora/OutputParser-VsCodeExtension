
(function () {

    const coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            // this.classList.toggle("show");
            const target = this.dataset.target;
            console.log(target);
            if (target){
                const targetElem = document.getElementById(target);
                if (targetElem != null)
                    targetElem.classList.toggle("show");
                else
                    console.log("targetElem is null");
            }
        });
    }
}());