const input = document.getElementById('category');
const form = document.getElementById('form');
const categoryID = document.getElementById('categoryID').value;
form.addEventListener('submit',async function(event){
    event.preventDefault();
    let validated = true;
    if(input.value.trim('').length === 0){
        input.parentElement.querySelector('.error').innerText = 'Invalid Entry';
        validated = false
    }
    else if(!isNaN(input.value)){
        input.parentElement.querySelector('.error').innerText = 'Numbers are not added as a name';
        validated = false
    }
    if(validated){
        const response = await fetch('/admin/updateCategory',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                category:input.value,
                categoryID
            })
        })
        if(response.ok){
            const data = await response.json();
            window.location.href = '/admin/category'
        }
        else{
            const data = await response.json();
            if(!data.serverFailure){
                input.parentElement.querySelector('.error').innerText = data.error;
            }            
        }
    }
})