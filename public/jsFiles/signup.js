const form = document.getElementById("form");
form.addEventListener("submit",async function(event){
    event.preventDefault();
    let formValidated = true;
    
    const inputs = document.querySelectorAll(".input");    
    inputs.forEach(function(input){
        if(input.value === ''){
            input.parentNode.querySelector(".error").innerText = "Field Required"
            formValidated = false;
        }
    })

    // email validation    
    const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = document.getElementById("email");
    if(email.value.length > 0){
        const validEmail = emailFormat.test(email.value);
        if(!validEmail){
            email.parentNode.querySelector(".error").innerText = "Invalid Email Format";
            formValidated = false;
        }
        else{
            try{
                const response = await fetch(`/validateEmail?email=${email.value}`,{
                    method:"GET"
                })
                if(response.ok){
                    const data = await response.json();
                    if(data.result === "matching"){
                        email.parentNode.querySelector(".error").innerText = "Email already existing";
                        formValidated = false;
                    }
                }
            }
            catch(error){
                console.log("error",error);
            }
        }
    }
    

    // validating password
    const password = document.getElementById("password");
    if(password.value.length > 0){
        const atleastLower = /^(?=.*[a-z])/;
        const atleastDigit = /^(?=.*\d)/;
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
    }  

    // validating re-password;
    const rePassword = document.querySelector("#confirmPassword");
    if(rePassword.value.length > 0){
        if(rePassword.value != password.value){
            rePassword.parentNode.querySelector(".error").innerText = "password not matching";
            formValidated = false;
        }
    }
    

    if(formValidated){
        const referral = document.getElementById("referral");
        if(referral.value === ""){
            form.submit();
        }
        else{
            try{
                const referralCode = referral.value;
                const response = await fetch(`/findReferral?referralCode=${referralCode}`,{
                    method:'GET'
                })
                if(response.ok){
                    const data = await response.json();
                    if(data.message === "found"){
                        form.submit();
                    }
                    else{
                        referral.parentNode.querySelector(".error").innerText = "Refferal Code not found"
                    }
                }
            }
            catch(error){
                console.log("error",error);
            }
        }
    }
})

// key up
const inputs = document.querySelectorAll(".input");
inputs.forEach(function(input){
    input.addEventListener("keyup",function(){
        if(input.value === ""){
            input.parentNode.querySelector(".error").innerText = "Field Required";
        }
        else if(input.value.length > 0){
            input.parentNode.querySelector(".error").innerText = "";
        }
    })
});

const referralInput = document.querySelector("#referral");
referralInput.addEventListener("keyup",function(){
    if(referralInput.value.length > 0){
        referralInput.parentNode.querySelector(".error").innerText = ""
    }
})