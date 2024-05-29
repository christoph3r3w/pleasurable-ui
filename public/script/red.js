
// forms
let forms = document.querySelectorAll("form");
const formBTN = document.querySelectorAll('button[type="submit"]');
const testBTN = document.querySelector(".inleiding_text");

// date
const CT = document.querySelector('header .h-main-datum strong');

// mobile menu 
const menuBtn = document.querySelector(".menu-open");
const menuExitBtn = document.querySelector(".menu-exit");
const menuWindow = document.querySelector("#mobile-menu-window");
const showMenu = document.querySelector(".showMenu");


//forms
if (formBTN) {
	forms.forEach((form) => {
		form.addEventListener("submit", function (e) {
			let form = this;
			let data = new FormData(this);
			// console.log(data,"and",this)
			data.append("enhanced", true);

			// add loader
			this.classList.add('loader');

			fetch(this.action, {
				body: new URLSearchParams(data),
				method: this.method,
			})
				.then(function (rawStream) {
					return rawStream.text();
					// loading state
					this.classList.remove('loader');

					// console.log('[3]',response.text());
				})
				.then(function (text) {

					// view transition for form
					if(!document.startViewTransition){
						//remove loader
						form.innerHTML = text;
						form.classList.remove('loader');
					}else{
						document.startViewTransition(() => {
							form.innerHTML = text;
							form.classList.remove('loader');
						})
					}

					
					
					// add new sate to buttons
				})
				.catch((x) => {
					// Handle error if fetching data fails
					// Add error state
					alert("something went wrong", x);
				});

				

			e.preventDefault();
			testBTN.addEventListener("click", () => {
				console.log(forms);
			});
			
		});
	});
	
}




if(CT){
	const currentDate = new Date();
	const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

	let dateString = currentDate.toLocaleDateString('nl-US', options);
	dateString = dateString.replace(' ', ', ') 
	CT.textContent = dateString;
}
// check temporal api 

// Mobile window function

menuBtn?.addEventListener("click", function (e) {
	menuWindow.classList.add("showMenu");
});

menuExitBtn?.addEventListener("click", (e) => {
	menuWindow.classList.remove("showMenu");
});



const prevButtons = document.querySelectorAll(".prevBtn");
const nextButtons = document.querySelectorAll(".nextBtn");
const carousels = document.querySelectorAll(".carousel ul");

function updateButtonVisibility(carousel, prevButton, nextButton) {
    const articles = carousel.querySelectorAll("li");
    if (articles.length > 4 && window.innerWidth >= 769) {
        prevButton.removeAttribute("hidden");
        nextButton.removeAttribute("hidden");
    } else {
        prevButton.setAttribute("hidden", true);
        nextButton.setAttribute("hidden", true);
    }
}

function updateButtonState(carousel, prevButton, nextButton) {
    if (carousel.scrollLeft <= 0) {
        prevButton.classList.add('disabled');
    } else {
        prevButton.classList.remove('disabled');
    }

    if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
        nextButton.classList.add('disabled');
    } else {
        nextButton.classList.remove('disabled');
    }
}

carousels.forEach((carousel, index) => {
    const prevButton = prevButtons[index];
    const nextButton = nextButtons[index];

    updateButtonVisibility(carousel, prevButton, nextButton);
    updateButtonState(carousel, prevButton, nextButton);

    carousel.addEventListener('scroll', () => {
        updateButtonState(carousel, prevButton, nextButton);
    });

    prevButton.addEventListener('click', function() {
        if (carousel.scrollLeft > 0) {
            carousel.scrollBy({
                left: -carousel.offsetWidth,
                behavior: 'smooth'
            });
        }
    });

    nextButton.addEventListener('click', function() {
        if (carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth) {
            carousel.scrollBy({
                left: carousel.offsetWidth,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('resize', () => { //UGLY BUT IDK HOW TO DO IT BETTER
    carousels.forEach((carousel, index) => {
        const prevButton = prevButtons[index];
        const nextButton = nextButtons[index];
        updateButtonVisibility(carousel, prevButton, nextButton);
    });
});

$(".footer").click(function(){
	window.scrollTo({
	  top: "20%",
	  behavior: 'smooth',
	});
  });

/* Current day and month code */

const currentDateElement = document.querySelector('.first-col');
const currentDate = new Date();
const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

let dateString = currentDate.toLocaleDateString('nl-US', options);
dateString = dateString.replace(' ', ', ') 
currentDateElement.textContent = dateString;