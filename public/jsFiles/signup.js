const form = document.getElementById("form");
form.addEventListener("submit",async function(event){
    event.preventDefault();
    const inputs = document.querySelectorAll(".input");
    let formValidated = true;
    inputs.forEach(function(input){
        if(input.value === ''){
            input.parentNode.querySelector(".error").innerText = "Field Required"
            formValidated = false;
        }
    })

    // email validation
    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = document.getElementById("email");
    const validEmail = emailFormat.test(email.value);
    if(!validEmail){
        email.parentNode.querySelector(".error").innerText = "Invalid Email Format";
        formValidated = false;
    }

    // validating password
    const password = document.getElementById("password");
    const atleastLower = /^(?=.*[a-z])$/;
    const atleastDigit = /^(?=.*\d)$/;
    const atleast5 = /^.{5,}$/
    if(!atleastLower.test(password.value)){
        password.parentNode.querySelector(".error").innerText = "requires atleast one lowercase";
        formValidated = false;
    }
    else if(!atleastDigit.test(password.value)){
        password.parentNode.querySelector(".error").innerText = "requires atleast one digit";
        formValidated = false;
    }
    else if(!atleast5.test(password.value)){
        password.parentNode.querySelector(".error").innerText = "requires atleast 5 characters";
        formValidated = false;
    }

    // validating re-password;
    const rePassword = document.querySelector("#confirmPassword");
    if(rePassword.value != password.value){
        rePassword.parentNode.querySelector(".error").innerText = "password not matching";
        formValidated = false;
    }

    if(formValidated){
        const referral = document.getElementById("referral");
        if(referral.value === ""){
            form.submit();
        }
        else{
            try{
                const referralCode = referral.value;
                const response = await fetch(`/findReferral?referral=referralCode`,{
                    method:'GET'
                })
            }
            catch(error){
                console.log("error",error);
            }
        }
    }



    

})