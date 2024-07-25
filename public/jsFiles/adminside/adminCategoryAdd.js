const input = document.getElementById('category');
const form = document.getElementById('form');
form.addEventListener('submit',async function(event){
    event.preventDefault();
    let validated = true;
    if(input.value.trim('').length === 0){
        input.parentElement.querySelector('.category-error').innerText = 'Invalid Entry';
        validated = false
    }
    else if(!isNaN(input.value)){
        input.parentElement.querySelector('.category-error').innerText = 'Numbers are not added as a name';
        validated = false
    }
    if(validated){
        const response = await fetch('/admin/addNewCategory',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({category:input.value})
        })
        if(response.ok){
            const data = await response.json();
            window.location.reload()
        }
        else{
            const data = await response.json();
            if(!data.serverFailure){
                input.parentElement.querySelector('.category-error').innerText = data.error;
            }            
        }
    }
})

input.addEventListener('keyup',function(){
    if(input.value.length > 0){
        input.parentElement.querySelector('.category-error').innerText = ''
    }
})
